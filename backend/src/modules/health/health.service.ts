import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(getDataSourceToken()) private readonly dataSource: DataSource,
  ) {}

  async check() {
    const uptime = process.uptime();
    const env = this.configService.get('NODE_ENV') || process.env.NODE_ENV || 'development';

    const result: any = {
      status: 'ok',
      uptime: Math.floor(uptime),
      env,
      details: {
        database: { status: 'unknown' },
      },
    };

    // DB check
    try {
      if (!this.dataSource) {
        result.details.database.status = 'down';
      } else if (!this.dataSource.isInitialized) {
        // If data source isn't initialized, try a lightweight check
        result.details.database.status = 'down';
      } else {
        // Run a simple query
        await this.dataSource.query('SELECT 1');
        result.details.database.status = 'up';
      }
    } catch (err) {
      this.logger.warn('Database health check failed', (err as Error).message);
      result.details.database.status = 'down';
      result.status = 'error';
    }

    return result;
  }
}
