export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean | 'all' | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration')[];
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  timezone: string;
  migrationsRun: boolean;
  migrationsTableName: string;
}

