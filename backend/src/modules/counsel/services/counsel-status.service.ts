import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counsel, DeleteState } from '../entities/counsel.entity';
import { CounselLog } from '../entities/counsel-log.entity';
import { TenantStatus } from '../../tenants/entities/tenant-status.entity';
import { CounselLogDto } from '../dto/status/counsel-log.dto';
import { ResourceNotFoundException, ValidationException } from '../../../common/exceptions/base.exception';
import { TransactionUtil } from '../../../common/utils/transaction.util';

@Injectable()
export class CounselStatusService {
  constructor(
    @InjectRepository(Counsel)
    private readonly counselRepository: Repository<Counsel>,
    @InjectRepository(CounselLog)
    private readonly counselLogRepository: Repository<CounselLog>,
    @InjectRepository(TenantStatus)
    private readonly tenantStatusRepository: Repository<TenantStatus>,
    private readonly transactionUtil: TransactionUtil,
  ) {}

  /**
   * 상담 상태 변경 + 로그 생성 (트랜잭션)
   */
  async updateCounselStatus(
    tenantId: number,
    counselSeq: number,
    newStatusId: number,
    counselResvDtm?: string,
  ): Promise<void> {
    await this.transactionUtil.executeInTransaction(async (queryRunner) => {
      const counsel = await queryRunner.manager.findOne(Counsel, {
        where: { counselSeq, tenantId, deleteState: DeleteState.N },
      });

      if (!counsel) {
        throw new ResourceNotFoundException(
          `Counsel not found: counselSeq=${counselSeq}, tenantId=${tenantId}`,
          '상담을 찾을 수 없습니다.',
          { counselSeq, tenantId },
        );
      }

      // 1. counselStat 유효성 검증 (tenant_status 존재 여부 확인)
      const validStatus = await queryRunner.manager.findOne(TenantStatus, {
        where: { tenantStatusId: newStatusId, tenantId, isActive: 1 },
      });
      if (!validStatus) {
        throw new ValidationException(
          `Invalid counselStat: statusId=${newStatusId}, tenantId=${tenantId}`,
          '유효하지 않은 상담 상태입니다.',
          { counselStat: newStatusId },
        );
      }

      // 2. SCHEDULED 상태일 때 counselResvDtm 필수 검증
      if (validStatus.statusKey === 'SCHEDULED' && !counselResvDtm) {
        throw new ValidationException(
          `counselResvDtm is required when status is SCHEDULED`,
          '예약 상태로 변경 시 예약 일시(counselResvDtm)는 필수입니다.',
          { counselStat: newStatusId },
        );
      }

      // 3. 상담 상태 업데이트 (SCHEDULED이면 예약 일시 함께 저장)
      const updateFields: Partial<Counsel> = { counselStat: newStatusId };
      if (validStatus.statusKey === 'SCHEDULED') {
        updateFields.counselResvDtm = new Date(counselResvDtm!);
      }
      await queryRunner.manager.update(Counsel, { counselSeq, tenantId }, updateFields);

      // 4. 로그 번호 계산 후 로그 생성
      const existingLogs = await queryRunner.manager.count(CounselLog, {
        where: { counselSeq, tenantId },
      });

      const log = queryRunner.manager.create(CounselLog, {
        counselSeq,
        tenantId,
        logNo: existingLogs + 1,
        counselStat: newStatusId,
      });
      await queryRunner.manager.save(CounselLog, log);
    });
  }

  /**
   * 상담 상태 변경 이력 조회
   */
  async findCounselLogs(tenantId: number, counselSeq: number): Promise<CounselLogDto[]> {
    // 상담 존재 확인
    const counsel = await this.counselRepository.findOne({
      where: { counselSeq, tenantId, deleteState: DeleteState.N },
    });
    if (!counsel) {
      throw new ResourceNotFoundException(
        `Counsel not found: counselSeq=${counselSeq}, tenantId=${tenantId}`,
        '상담을 찾을 수 없습니다.',
        { counselSeq, tenantId },
      );
    }

    const logs = await this.counselLogRepository
      .createQueryBuilder('cl')
      .leftJoinAndSelect('cl.status', 'ts', 'ts.tenantId = cl.tenantId')
      .where('cl.counselSeq = :counselSeq', { counselSeq })
      .andWhere('cl.tenantId = :tenantId', { tenantId })
      .orderBy('cl.logNo', 'ASC')
      .getMany();

    return logs.map((log) => ({
      counselSeq: log.counselSeq,
      logNo: log.logNo,
      counselStat: log.counselStat,
      statusName: log.status?.statusName ?? null,
      regDtm: log.regDtm,
    }));
  }
}
