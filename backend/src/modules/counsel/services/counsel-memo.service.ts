import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counsel, DeleteState } from '../entities/counsel.entity';
import { CounselMemoLog } from '../entities/counsel-memo-log.entity';
import { CounselMemoDto } from '../dto/memo/counsel-memo.dto';
import { ResourceNotFoundException } from '../../../common/exceptions/base.exception';

@Injectable()
export class CounselMemoService {
  constructor(
    @InjectRepository(Counsel)
    private readonly counselRepository: Repository<Counsel>,
    @InjectRepository(CounselMemoLog)
    private readonly memoLogRepository: Repository<CounselMemoLog>,
  ) {}

  /**
   * 메모 작성 (현재 상담 상태 스냅샷 포함)
   */
  async createCounselMemo(
    tenantId: number,
    counselSeq: number,
    memoText: string,
    createdBy: number,
    empSeqFilter?: number,
  ): Promise<CounselMemoDto> {
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

    const memo = this.memoLogRepository.create({
      counselSeq,
      tenantId,
      statusId: counsel.counselStat,
      memoText,
      createdBy,
    });

    const saved = await this.memoLogRepository.save(memo);

    // 저장 후 조인 데이터 포함하여 반환
    const result = await this.memoLogRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.status', 'ts', 'ts.tenantId = m.tenantId')
      .leftJoinAndSelect('m.creator', 'u', 'u.tenantId = m.tenantId')
      .where('m.memoLogId = :memoLogId', { memoLogId: saved.memoLogId })
      .andWhere('m.tenantId = :tenantId', { tenantId })
      .getOne();

    return this.toCounselMemoDto(result!);
  }

  /**
   * 메모 목록 조회 (삭제되지 않은 메모만)
   */
  async findCounselMemos(tenantId: number, counselSeq: number, empSeqFilter?: number): Promise<CounselMemoDto[]> {
    // 상담 존재 확인
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

    const memos = await this.memoLogRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.status', 'ts', 'ts.tenantId = m.tenantId')
      .leftJoinAndSelect('m.creator', 'u', 'u.tenantId = m.tenantId')
      .where('m.counselSeq = :counselSeq', { counselSeq })
      .andWhere('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.isDeleted = 0')
      .orderBy('m.createdAt', 'DESC')
      .getMany();

    return memos.map((m) => this.toCounselMemoDto(m));
  }

  private toCounselMemoDto(memo: CounselMemoLog): CounselMemoDto {
    return {
      memoLogId: memo.memoLogId,
      counselSeq: memo.counselSeq,
      statusId: memo.statusId,
      statusName: memo.status?.statusName ?? null,
      memoText: memo.memoText,
      createdBy: memo.createdBy,
      creatorName: memo.creator?.userName ?? null,
      createdAt: memo.createdAt,
    };
  }
}
