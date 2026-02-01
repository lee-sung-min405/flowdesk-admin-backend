import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Only enable Swagger in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT ?? 3000;
    const config = new DocumentBuilder()
      .setTitle('flowdesk-admin API')
      .setDescription('flowdesk-admin 백엔드 API 문서')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT',
      )
      // === 시스템 ===
      .addTag('Health', '헬스체크 및 시스템 진단')
      // === 인증 ===
      .addTag('Auth', '인증 관련 API (로그인, 회원가입, 토큰 관리)')
      // === 테넌트 관리자용 ===
      .addTag('Users', '사용자 관리 API (테넌트 관리자)')
      .addTag('Roles', '역할 관리 API (역할 CRUD, 권한/사용자 할당)')
      .addTag('Permissions', '권한 카탈로그 조회 API (테넌트 관리자)')
      // === 슈퍼 관리자 전용 ===
      .addTag('Super Admin (슈퍼 관리자 전용)', '슈퍼 관리자 대시보드 API (시스템 통계)')
      .addTag('Tenants (슈퍼 관리자 전용)', '테넌트 관리 API (멀티테넌시)')
      .addTag('Permissions Admin (슈퍼 관리자 전용)', '페이지/액션/권한 CRUD API')
      .setContact('flowdesk', 'https://github.com/lee-sung-min405/flowdesk-admin', '')
      .addServer(`http://localhost:${port}`)
      .addServer('https://flowdesk-admin-production.up.railway.app')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      // Optionally filter out internal endpoints or add extra metadata
    });

    SwaggerModule.setup('api', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
