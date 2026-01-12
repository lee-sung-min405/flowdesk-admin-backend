import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './database.config';

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'flowdesk_admin',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true' ? ['error', 'warn'] : false,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '600000', 10),
    timezone: process.env.DB_TIMEZONE || '+09:00',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    migrationsTableName: process.env.DB_MIGRATIONS_TABLE || 'typeorm_migrations',
  }),
);

