import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import databaseConfig from '../config/configuration';
import { createTypeOrmOptions } from './typeorm.module-options';
import { TransactionUtil } from '../common/utils/transaction.util';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<ReturnType<typeof databaseConfig>>('database');
        if (!config) {
          throw new Error('Database configuration is missing');
        }
        return createTypeOrmOptions(config);
      },
    }),
  ],
  providers: [
    {
      provide: TransactionUtil,
      useFactory: (dataSource: DataSource) => {
        return new TransactionUtil(dataSource);
      },
      inject: [getDataSourceToken()],
    },
  ],
  exports: [TypeOrmModule, TransactionUtil],
})
export class DatabaseModule {}

