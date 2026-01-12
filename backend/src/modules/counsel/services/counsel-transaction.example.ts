/**
 * 트랜잭션 사용 예시: 상담 상태 변경
 * 
 * 이 파일은 예시용입니다. 실제 서비스에서는
 * src/modules/counsel/services/counsel.service.ts에 구현하세요.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Counsel } from '../entities/counsel.entity';
import { CounselLog } from '../entities/counsel-log.entity';
import { TransactionUtil } from '../../../common/utils/transaction.util';

@Injectable()
export class CounselTransactionExample {
  constructor(
    @InjectRepository(Counsel)
    private readonly counselRepository: Repository<Counsel>,
    @InjectRepository(CounselLog)
    private readonly counselLogRepository: Repository<CounselLog>,
    private readonly transactionUtil: TransactionUtil,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 상담 상태 변경 (트랜잭션 예시)
   * 
   * 1. 상담 상태 업데이트
   * 2. 상태 변경 로그 생성
   * 
   * 두 작업이 모두 성공해야 커밋, 하나라도 실패하면 롤백
   */
  async updateCounselStatus(
    counselSeq: number,
    tenantId: number,
    newStatusId: number,
  ): Promise<void> {
    await this.transactionUtil.executeInTransaction(async (queryRunner) => {
      // 1. 상담 상태 업데이트
      await queryRunner.manager.update(
        Counsel,
        { counselSeq, tenantId },
        { counselStat: newStatusId, editDtm: new Date() },
      );

      // 2. 로그 생성 (log_no 자동 계산)
      const existingLogs = await queryRunner.manager.count(CounselLog, {
        where: { counselSeq, tenantId },
      });

      const counselLog = queryRunner.manager.create(CounselLog, {
        counselSeq,
        tenantId,
        logNo: existingLogs + 1,
        counselStat: newStatusId,
        regDtm: new Date(),
      });

      await queryRunner.manager.save(CounselLog, counselLog);
    });
  }

  /**
   * 대안: DataSource를 직접 사용하는 방법
   * (TransactionUtil이 없는 경우)
   */
  async updateCounselStatusAlternative(
    counselSeq: number,
    tenantId: number,
    newStatusId: number,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 상담 상태 업데이트
      await queryRunner.manager.update(
        Counsel,
        { counselSeq, tenantId },
        { counselStat: newStatusId, editDtm: new Date() },
      );

      // 2. 로그 생성
      const existingLogs = await queryRunner.manager.count(CounselLog, {
        where: { counselSeq, tenantId },
      });

      const counselLog = queryRunner.manager.create(CounselLog, {
        counselSeq,
        tenantId,
        logNo: existingLogs + 1,
        counselStat: newStatusId,
        regDtm: new Date(),
      });

      await queryRunner.manager.save(CounselLog, counselLog);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

