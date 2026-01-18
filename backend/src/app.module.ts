import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { validate } from './config/validation';
import databaseConfig from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [databaseConfig],
      validate,
      cache: true,
    }),
  DatabaseModule,
  HealthModule,
  AuthModule,
  PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
