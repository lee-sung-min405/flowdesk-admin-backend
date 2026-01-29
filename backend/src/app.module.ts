import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { validate } from './config/validation';
import databaseConfig from './config/configuration';
import { SuperModule } from './modules/super/super.module';
import { PermissionsModule } from './modules/rbac/permissions.module';

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
    UsersModule,
    RolesModule,
    TenantsModule,
    SuperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
