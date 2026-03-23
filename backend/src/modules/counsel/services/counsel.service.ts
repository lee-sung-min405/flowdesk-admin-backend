import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Counsel, DeleteState } from '../entities/counsel.entity';
import { CounselFieldValue } from '../entities/counsel-field-value.entity';
import { CounselLog } from '../entities/counsel-log.entity';
import { CounselMemoLog } from '../entities/counsel-memo-log.entity';
import { Website } from '../../websites/entities/website.entity';
import { TenantStatus } from '../../tenants/entities/tenant-status.entity';
import { CounselFieldDef } from '../entities/counsel-field-def.entity';
import { User } from '../../users/entities/user.entity';
import { BlockHpService } from '../../security/block-hp.service';
import { BlockIpService } from '../../security/block-ip.service';
import { BlockWordService } from '../../security/block-word.service';
import { CreateCounselDto } from '../dto/counsel/create-counsel.dto';
import { UpdateCounselDto } from '../dto/counsel/update-counsel.dto';
import { CounselListQueryDto } from '../dto/counsel/counsel-list-query.dto';
import {
  CounselFieldValueResponseDto,
  CounselListItemDto,
  CounselDetailDto,
} from '../dto/counsel/counsel-response.dto';
import { CounselLogDto } from '../dto/status/counsel-log.dto';
import { CounselMemoDto } from '../dto/memo/counsel-memo.dto';
import { CounselListResponseDto } from '../dto/counsel/counsel-list-response.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
  ValidationException,
} from '../../../common/exceptions/base.exception';
import { TransactionUtil } from '../../../common/utils/transaction.util';

@Injectable()
export class CounselService {
  constructor(
    @InjectRepository(Counsel)
    private readonly counselRepository: Repository<Counsel>,
    @InjectRepository(CounselFieldValue)
    private readonly fieldValueRepository: Repository<CounselFieldValue>,
    @InjectRepository(CounselFieldDef)
    private readonly counselFieldDefRepository: Repository<CounselFieldDef>,
    @InjectRepository(CounselLog)
    private readonly counselLogRepository: Repository<CounselLog>,
    @InjectRepository(CounselMemoLog)
    private readonly memoLogRepository: Repository<CounselMemoLog>,
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    @InjectRepository(TenantStatus)
    private readonly tenantStatusRepository: Repository<TenantStatus>,
    private readonly blockHpService: BlockHpService,
    private readonly blockIpService: BlockIpService,
    private readonly blockWordService: BlockWordService,
    private readonly transactionUtil: TransactionUtil,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 상담 생성 (랜딩페이지 공개 API)
   * webCode → tenantId 조회, 차단 검증, 중복 판별 후 트랜잭션으로 저장
   */
  async createCounsel(dto: CreateCounselDto, clientIp: string): Promise<CounselDetailDto> {
    // 1. webCode로 웹사이트 조회
    const website = await this.websiteRepository.findOne({
      where: { webCode: dto.webCode, isActive: 1 },
    });

    if (!website) {
      throw new ValidationException(
        `Website not found: webCode=${dto.webCode}`,
        '유효하지 않은 웹사이트 코드입니다.',
        { webCode: dto.webCode },
      );
    }

    const tenantId = website.tenantId;

    // 2. 차단 검증: 전화번호
    const hpCheck = await this.blockHpService.checkBlocked(tenantId, dto.counselHp);
    if (hpCheck.isBlocked) {
      throw new ValidationException(
        `Blocked phone number: hp=${dto.counselHp}, tenantId=${tenantId}`,
        '차단된 전화번호로는 상담 신청이 불가합니다.',
        { counselHp: dto.counselHp },
      );
    }

    // 3. 차단 검증: IP
    const ipCheck = await this.blockIpService.checkBlocked(tenantId, clientIp);
    if (ipCheck.isBlocked) {
      throw new ValidationException(
        `Blocked IP: ip=${clientIp}, tenantId=${tenantId}`,
        '차단된 IP에서는 상담 신청이 불가합니다.',
        { counselIp: clientIp },
      );
    }

    // 4. 차단 검증: 금칙어 (이름 + 메모)
    const textsToCheck = [dto.name, dto.counselMemo].filter(Boolean).join(' ');
    if (textsToCheck) {
      const wordCheck = await this.blockWordService.checkBlocked(tenantId, textsToCheck);
      if (wordCheck.isBlocked) {
        throw new ValidationException(
          `Blocked word detected: matchedWord=${wordCheck.matchedWord}, tenantId=${tenantId}`,
          '금칙어가 포함되어 상담 신청이 불가합니다.',
          { matchedWord: wordCheck.matchedWord },
        );
      }
    }

    // 5. 초기 상태 자동 배정: NEW(신규) / DUPLICATE(중복) statusKey 기준 조회
    const [newStatus, duplicateStatus] = await Promise.all([
      this.tenantStatusRepository.findOne({
        where: { tenantId, statusKey: 'NEW', isActive: 1 },
      }),
      this.tenantStatusRepository.findOne({
        where: { tenantId, statusKey: 'DUPLICATE', isActive: 1 },
      }),
    ]);
    if (!newStatus) {
      throw new ValidationException(
        `Default status 'NEW' not configured for tenantId=${tenantId}`,
        '기본 상담 상태(NEW)가 설정되지 않았습니다. 관리자에게 문의하세요.',
        { tenantId },
      );
    }
    if (!duplicateStatus) {
      throw new ValidationException(
        `Default status 'DUPLICATE' not configured for tenantId=${tenantId}`,
        '중복 상담 상태(DUPLICATE)가 설정되지 않았습니다. 관리자에게 문의하세요.',
        { tenantId },
      );
    }

    // 6. 동적 필드 fieldId 유효성 검증
    if (dto.fieldValues?.length) {
      const validFieldDefs = await this.counselFieldDefRepository
        .createQueryBuilder('fd')
        .select('fd.fieldId')
        .where('fd.tenantId = :tenantId', { tenantId })
        .andWhere('fd.isActive = 1')
        .getMany();
      const validFieldIdSet = new Set(validFieldDefs.map((fd) => fd.fieldId));
      const invalidIds = dto.fieldValues
        .map((fv) => fv.fieldId)
        .filter((id) => !validFieldIdSet.has(id));
      if (invalidIds.length > 0) {
        throw new ValidationException(
          `Invalid fieldIds: ${invalidIds.join(', ')}, tenantId=${tenantId}`,
          '유효하지 않은 동적 필드 ID가 포함되어 있습니다.',
          { invalidFieldIds: invalidIds },
        );
      }
    }

    // 7. Advisory Lock 획득 (동일 사용자 연타 방지)
    // - 원본 키를 SHA-256 해시(64자 hex)로 변환 → MySQL GET_LOCK 64자 제한 항상 준수
    // - 전용 lockRunner 커넥션 사용 → GET_LOCK / RELEASE_LOCK이 반드시 같은 커넥션에서 실행됨
    //   (MySQL Advisory Lock은 커넥션 단위: dataSource.query()는 매 호출마다 임의 커넥션을 사용하므로 위험)
    const rawLockKey = `counsel:${dto.webCode}:${dto.counselHp}:${clientIp}`;
    const lockKey = createHash('sha256').update(rawLockKey).digest('hex'); // 항상 64자
    const lockRunner = this.dataSource.createQueryRunner();
    await lockRunner.connect();

    const lockResult = await lockRunner.query('SELECT GET_LOCK(?, 0) AS acquired', [lockKey]);
    if (lockResult[0].acquired !== 1) {
      await lockRunner.release();
      throw new BusinessConflictException(
        `Advisory lock acquisition failed: key=${rawLockKey}`,
        '이미 처리 중인 상담 신청입니다. 잠시 후 다시 시도해 주세요.',
        { lockKey: rawLockKey },
      );
    }

    // 8. Lock 내부에서 중복 신청 판별 (레이스 컨디션 방지: 락 획득 후 확인해야 함)
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - website.duplicateAllowAfterDays);
      const duplicateExists = await this.counselRepository
        .createQueryBuilder('c')
        .where('c.tenantId = :tenantId', { tenantId })
        .andWhere('c.counselHp = :counselHp', { counselHp: dto.counselHp })
        .andWhere('c.counselIp = :counselIp', { counselIp: clientIp })
        .andWhere('c.deleteState = :deleteState', { deleteState: DeleteState.N })
        .andWhere('c.regDtm >= :cutoffDate', { cutoffDate })
        .limit(1)
        .getOne();
      const isDuplicate = !!duplicateExists;
      const initialStatId = isDuplicate ? duplicateStatus.tenantStatusId : newStatus.tenantStatusId;

      // 9. 트랜잭션으로 저장 (finally에서 락 반드시 해제)
      const newCounselSeq = await this.transactionUtil.executeInTransaction(async (queryRunner) => {
        const counsel = queryRunner.manager.create(Counsel, {
          tenantId,
          webCode: dto.webCode,
          name: dto.name ?? null,
          counselHp: dto.counselHp,
          counselIp: clientIp,
          counselStat: initialStatId,
          empSeq: null, // 최초 신청 시 담당자 미배정 (관리자가 이후 수정)
          counselSource: dto.counselSource ?? null,
          counselMedium: dto.counselMedium ?? null,
          counselCampaign: dto.counselCampaign ?? null,
          counselResvDtm: dto.counselResvDtm ? new Date(dto.counselResvDtm) : null,
          counselMemo: dto.counselMemo ?? null,
          duplicateState: isDuplicate ? 'Y' : 'N',
          deleteState: DeleteState.N,
        });
        const saved = await queryRunner.manager.save(Counsel, counsel);

        // 동적 필드 값 저장
        if (dto.fieldValues?.length) {
          const fieldValues = dto.fieldValues.map((fv) =>
            queryRunner.manager.create(CounselFieldValue, {
              counselSeq: saved.counselSeq,
              tenantId,
              fieldId: fv.fieldId,
              valueText: fv.valueText ?? null,
              valueNumber: fv.valueNumber ?? null,
              valueDate: fv.valueDate ? new Date(fv.valueDate) : null,
              valueDatetime: fv.valueDatetime ? new Date(fv.valueDatetime) : null,
            }),
          );
          await queryRunner.manager.save(CounselFieldValue, fieldValues);
        }

        // 초기 상태 로그 생성
        const log = queryRunner.manager.create(CounselLog, {
          counselSeq: saved.counselSeq,
          tenantId,
          logNo: 1,
          counselStat: initialStatId,
        });
        await queryRunner.manager.save(CounselLog, log);

        return saved.counselSeq;
      });

      // 트랜잭션 커밋 후 별도 커넥션으로 조회
      return this.getCounselById(tenantId, newCounselSeq);
    } finally {
      // 반드시 lockRunner(락을 획득한 커넥션)에서 해제 후 커넥션 풀 반환
      await lockRunner.query('SELECT RELEASE_LOCK(?)', [lockKey]);
      await lockRunner.release();
    }
  }

  async findCounsels(tenantId: number, query: CounselListQueryDto, empSeqFilter?: number): Promise<CounselListResponseDto> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.counselRepository
      .createQueryBuilder('c')
      .leftJoin('c.status', 'ts', 'ts.tenantId = c.tenantId')
      .leftJoin('c.employee', 'emp', 'emp.tenantId = c.tenantId')
      .leftJoin('c.website', 'w')
      .addSelect(['ts.statusName', 'emp.userName', 'w.webTitle'])
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.deleteState = :deleteState', { deleteState: DeleteState.N });

    // 비관리자는 자신에게 배정된 상담만 조회
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.empSeq = :empSeqFilter', { empSeqFilter });
    }

    // 검색어 필터
    if (query.q) {
      qb.andWhere(
        '(c.name LIKE :q OR c.counselHp LIKE :q OR c.counselMemo LIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    // 상태 필터
    if (query.counselStat !== undefined) {
      qb.andWhere('c.counselStat = :counselStat', { counselStat: query.counselStat });
    }

    // 담당자 필터
    if (query.empSeq !== undefined) {
      qb.andWhere('c.empSeq = :empSeq', { empSeq: query.empSeq });
    }

    // 웹사이트 코드 필터
    if (query.webCode) {
      qb.andWhere('c.webCode = :webCode', { webCode: query.webCode });
    }

    // 날짜 범위 필터
    if (query.startDate) {
      qb.andWhere('c.regDtm >= :startDate', { startDate: `${query.startDate} 00:00:00` });
    }
    if (query.endDate) {
      qb.andWhere('c.regDtm <= :endDate', { endDate: `${query.endDate} 23:59:59` });
    }

    // 중복 신청 여부 필터
    if (query.duplicateState !== undefined) {
      qb.andWhere('c.duplicateState = :duplicateState', { duplicateState: query.duplicateState });
    }

    // 예약 일시 범위 필터 (counsel_resv_dtm 기준)
    if (query.resvStartDate) {
      qb.andWhere('c.counselResvDtm >= :resvStartDate', { resvStartDate: `${query.resvStartDate} 00:00:00` });
    }
    if (query.resvEndDate) {
      qb.andWhere('c.counselResvDtm <= :resvEndDate', { resvEndDate: `${query.resvEndDate} 23:59:59` });
    }

    qb.orderBy('c.regDtm', 'DESC');

    const totalItems = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // 조회된 상담들의 동적 필드 값을 단일 쿼리로 배치 조회
    const fieldValuesMap = new Map<number, CounselFieldValueResponseDto[]>();
    if (items.length > 0) {
      const counselSeqs = items.map((c) => Number(c.counselSeq));
      const allFieldValues = await this.fieldValueRepository
        .createQueryBuilder('fv')
        .leftJoinAndSelect('fv.fieldDef', 'fd', 'fd.tenantId = fv.tenantId')
        .where('fv.counselSeq IN (:...counselSeqs)', { counselSeqs })
        .andWhere('fv.tenantId = :tenantId', { tenantId })
        .orderBy('fd.sortOrder', 'ASC')
        .getMany();

      for (const fv of allFieldValues) {
        const seq = Number(fv.counselSeq);
        if (!fieldValuesMap.has(seq)) fieldValuesMap.set(seq, []);
        fieldValuesMap.get(seq)!.push({
          fieldId: Number(fv.fieldId),
          fieldKey: fv.fieldDef?.fieldKey ?? '',
          label: fv.fieldDef?.label ?? '',
          fieldType: fv.fieldDef?.fieldType ?? '',
          valueText: fv.valueText,
          valueNumber: fv.valueNumber !== null && fv.valueNumber !== undefined ? Number(fv.valueNumber) : null,
          valueDate: fv.valueDate instanceof Date
            ? `${fv.valueDate.getFullYear()}-${String(fv.valueDate.getMonth() + 1).padStart(2, '0')}-${String(fv.valueDate.getDate()).padStart(2, '0')}`
            : (fv.valueDate ?? null),
          valueDatetime: fv.valueDatetime ? fv.valueDatetime.toISOString() : null,
        });
      }
    }

    return {
      items: items.map((c) => this.toCounselListItem(c, fieldValuesMap.get(Number(c.counselSeq)) ?? [])),
      pageInfo: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getCounselById(tenantId: number, counselSeq: number, empSeqFilter?: number): Promise<CounselDetailDto> {
    const qb = this.counselRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.status', 'ts', 'ts.tenantId = c.tenantId')
      .leftJoinAndSelect('c.employee', 'emp', 'emp.tenantId = c.tenantId')
      .leftJoinAndSelect('c.website', 'w')
      .where('c.counselSeq = :counselSeq', { counselSeq })
      .andWhere('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.deleteState = :deleteState', { deleteState: DeleteState.N });

    if (empSeqFilter !== undefined) {
      qb.andWhere('c.empSeq = :empSeqFilter', { empSeqFilter });
    }

    const counsel = await qb.getOne();

    if (!counsel) {
      throw new ResourceNotFoundException(
        `Counsel not found: counselSeq=${counselSeq}, tenantId=${tenantId}`,
        '상담을 찾을 수 없습니다.',
        { counselSeq, tenantId },
      );
    }

    // 동적 필드 값, 상태 이력, 메모를 병렬 조회
    const [fieldValues, logs, memos] = await Promise.all([
      this.fieldValueRepository
        .createQueryBuilder('fv')
        .leftJoinAndSelect('fv.fieldDef', 'fd', 'fd.tenantId = fv.tenantId')
        .where('fv.counselSeq = :counselSeq', { counselSeq })
        .andWhere('fv.tenantId = :tenantId', { tenantId })
        .orderBy('fd.sortOrder', 'ASC')
        .getMany(),

      this.counselLogRepository
        .createQueryBuilder('cl')
        .leftJoinAndSelect('cl.status', 'ts', 'ts.tenantId = cl.tenantId')
        .where('cl.counselSeq = :counselSeq', { counselSeq })
        .andWhere('cl.tenantId = :tenantId', { tenantId })
        .orderBy('cl.logNo', 'ASC')
        .getMany(),

      this.memoLogRepository
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.status', 'ts', 'ts.tenantId = m.tenantId')
        .leftJoinAndSelect('m.creator', 'u', 'u.tenantId = m.tenantId')
        .where('m.counselSeq = :counselSeq', { counselSeq })
        .andWhere('m.tenantId = :tenantId', { tenantId })
        .andWhere('m.isDeleted = 0')
        .orderBy('m.createdAt', 'DESC')
        .getMany(),
    ]);

    return {
      ...this.toCounselListItem(counsel),
      counselIp: counsel.counselIp,
      counselSource: counsel.counselSource,
      counselMedium: counsel.counselMedium,
      counselCampaign: counsel.counselCampaign,
      counselResvDtm: counsel.counselResvDtm,
      counselMemo: counsel.counselMemo,
      fieldValues: fieldValues.map((fv) => ({
        fieldId: Number(fv.fieldId),
        fieldKey: fv.fieldDef?.fieldKey ?? '',
        label: fv.fieldDef?.label ?? '',
        fieldType: fv.fieldDef?.fieldType ?? '',
        valueText: fv.valueText,
        valueNumber: fv.valueNumber !== null && fv.valueNumber !== undefined ? Number(fv.valueNumber) : null,
        valueDate: fv.valueDate instanceof Date
          ? `${fv.valueDate.getFullYear()}-${String(fv.valueDate.getMonth() + 1).padStart(2, '0')}-${String(fv.valueDate.getDate()).padStart(2, '0')}`
          : (fv.valueDate ?? null),
        valueDatetime: fv.valueDatetime ? fv.valueDatetime.toISOString() : null,
      })),
      logs: logs.map((log): CounselLogDto => ({
        counselSeq: log.counselSeq,
        logNo: log.logNo,
        counselStat: log.counselStat,
        statusName: log.status?.statusName ?? null,
        regDtm: log.regDtm,
      })),
      memos: memos.map((m): CounselMemoDto => ({
        memoLogId: m.memoLogId,
        counselSeq: m.counselSeq,
        statusId: m.statusId,
        statusName: m.status?.statusName ?? null,
        memoText: m.memoText,
        createdBy: m.createdBy,
        creatorName: m.creator?.userName ?? null,
        createdAt: m.createdAt,
      })),
    };
  }

  async updateCounsel(tenantId: number, counselSeq: number, dto: UpdateCounselDto, empSeqFilter?: number): Promise<CounselDetailDto> {
    await this.transactionUtil.executeInTransaction(async (queryRunner) => {
      const where: Record<string, any> = { counselSeq, tenantId, deleteState: DeleteState.N };
      if (empSeqFilter !== undefined) {
        where.empSeq = empSeqFilter;
      }
      const counsel = await queryRunner.manager.findOne(Counsel, { where });

      if (!counsel) {
        throw new ResourceNotFoundException(
          `Counsel not found: counselSeq=${counselSeq}, tenantId=${tenantId}`,
          '상담을 찾을 수 없습니다.',
          { counselSeq, tenantId },
        );
      }

      // 기본 필드 업데이트
      if (dto.name !== undefined) counsel.name = dto.name;
      if (dto.counselHp !== undefined) counsel.counselHp = dto.counselHp;
      if (dto.empSeq !== undefined) {
        if (dto.empSeq !== null) {
          const empExists = await queryRunner.manager.findOne(User, {
            where: { userSeq: dto.empSeq, tenantId },
          });
          if (!empExists) {
            throw new ValidationException(
              `Invalid empSeq: userSeq=${dto.empSeq}, tenantId=${tenantId}`,
              '유효하지 않은 담당자입니다.',
              { empSeq: dto.empSeq },
            );
          }
        }
        counsel.empSeq = dto.empSeq;
      }
      if (dto.counselSource !== undefined) counsel.counselSource = dto.counselSource;
      if (dto.counselMedium !== undefined) counsel.counselMedium = dto.counselMedium;
      if (dto.counselCampaign !== undefined) counsel.counselCampaign = dto.counselCampaign;
      if (dto.counselResvDtm !== undefined) {
        counsel.counselResvDtm = dto.counselResvDtm ? new Date(dto.counselResvDtm) : null;
      }
      if (dto.counselMemo !== undefined) counsel.counselMemo = dto.counselMemo;

      await queryRunner.manager.save(Counsel, counsel);

      // 동적 필드 값 갱신 (전체 교체)
      if (dto.fieldValues !== undefined) {
        // fieldId 유효성 검증 (해당 테넌트의 활성 필드인지 확인)
        if (dto.fieldValues.length > 0) {
          const validFieldDefs = await queryRunner.manager
            .createQueryBuilder(CounselFieldDef, 'fd')
            .select('fd.fieldId')
            .where('fd.tenantId = :tenantId', { tenantId })
            .andWhere('fd.isActive = 1')
            .getMany();
          const validFieldIdSet = new Set(validFieldDefs.map((fd) => fd.fieldId));
          const invalidIds = dto.fieldValues
            .map((fv) => fv.fieldId)
            .filter((id) => !validFieldIdSet.has(id));
          if (invalidIds.length > 0) {
            throw new ValidationException(
              `Invalid fieldIds: ${invalidIds.join(', ')}, tenantId=${tenantId}`,
              '유효하지 않은 동적 필드 ID가 포함되어 있습니다.',
              { invalidFieldIds: invalidIds },
            );
          }
        }

        await queryRunner.manager.delete(CounselFieldValue, { counselSeq, tenantId });

        if (dto.fieldValues.length > 0) {
          const fieldValues = dto.fieldValues.map((fv) =>
            queryRunner.manager.create(CounselFieldValue, {
              counselSeq,
              tenantId,
              fieldId: fv.fieldId,
              valueText: fv.valueText ?? null,
              valueNumber: fv.valueNumber ?? null,
              valueDate: fv.valueDate ? new Date(fv.valueDate) : null,
              valueDatetime: fv.valueDatetime ? new Date(fv.valueDatetime) : null,
            }),
          );
          await queryRunner.manager.save(CounselFieldValue, fieldValues);
        }
      }

    });
    return this.getCounselById(tenantId, counselSeq);
  }

  async softDeleteCounsel(tenantId: number, counselSeq: number, empSeqFilter?: number): Promise<void> {
    const where: Record<string, any> = { counselSeq, tenantId, deleteState: DeleteState.N };
    if (empSeqFilter !== undefined) {
      where.empSeq = empSeqFilter;
    }
    const counsel = await this.counselRepository.findOne({ where });

    if (!counsel) {
      throw new ResourceNotFoundException(
        `Counsel not found: counselSeq=${counselSeq}, tenantId=${tenantId}`,
        '상담을 찾을 수 없습니다.',
        { counselSeq, tenantId },
      );
    }

    counsel.deleteState = DeleteState.Y;
    await this.counselRepository.save(counsel);
  }

  private toCounselListItem(counsel: Counsel, fieldValues: CounselFieldValueResponseDto[] = []): CounselListItemDto {
    return {
      counselSeq: counsel.counselSeq,
      webCode: counsel.webCode,
      webTitle: counsel.website?.webTitle ?? null,
      name: counsel.name,
      counselHp: counsel.counselHp,
      counselStat: counsel.counselStat,
      statusName: counsel.status?.statusName ?? null,
      empSeq: counsel.empSeq,
      empName: counsel.employee?.userName ?? null,
      duplicateState: counsel.duplicateState,
      counselResvDtm: counsel.counselResvDtm,
      regDtm: counsel.regDtm,
      editDtm: counsel.editDtm,
      fieldValues,
    };
  }

}
