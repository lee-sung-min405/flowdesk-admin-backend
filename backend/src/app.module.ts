import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { WebsitesModule } from './modules/websites/websites.module';
import { SecurityModule } from './modules/security/security.module';
import { BoardsModule } from './modules/boards/boards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [databaseConfig],
      validate,
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60초
        limit: 60, // 기본: 60초에 60회
      },
    ]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    PermissionsModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    SuperModule,
    WebsitesModule,
    SecurityModule,
    BoardsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Request ID를 모든 라우트에 적용
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
