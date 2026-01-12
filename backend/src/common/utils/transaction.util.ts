import { DataSource, QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionUtil {
  constructor(private readonly dataSource: DataSource) {}

  async executeInTransaction<T>(
    callback: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

