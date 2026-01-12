import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import databaseConfig from '../config/configuration';

export const createTypeOrmOptions = (
  config: ConfigType<typeof databaseConfig>,
): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false, // 절대 true 금지
    logging: config.logging,
    timezone: config.timezone,
    charset: 'utf8mb4',
    extra: {
      connectionLimit: config.maxConnections,
      connectTimeout: config.connectionTimeout,
      idleTimeout: config.idleTimeout,
      timezone: config.timezone,
    },
    migrationsRun: config.migrationsRun && !isProduction, // 운영에서는 수동 실행
    migrationsTableName: config.migrationsTableName,
    // 운영 환경 최적화
    ...(isProduction && {
      logging: ['error', 'warn'],
      maxQueryExecutionTime: 1000, // 1초 이상 쿼리 로깅
    }),
  } as DataSourceOptions;
};

