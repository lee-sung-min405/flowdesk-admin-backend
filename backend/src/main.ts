import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy for accurate IP detection in production (Railway, Nginx, etc.)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Apply security headers with Helmet (CSP disabled for Swagger)
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Register global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // DTO에 없는 속성 전송 시 400 에러
      transform: true, // 요청 데이터를 DTO 인스턴스로 자동 변환
      transformOptions: {
        enableImplicitConversion: true, // query/param의 숫자/boolean 자동 변환
      },
    }),
  );

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
      .addTag('Roles', '역할 관리 API (테넌트 관리자, 역할 CRUD, 권한/사용자 할당)')
      .addTag('Permissions', '권한 카탈로그 조회 API (역할 권한 할당용, 사용자별 자동 필터링)')
      // === 슈퍼 관리자 전용 ===
      .addTag('Super Admin (슈퍼 관리자 전용)', '슈퍼 관리자 대시보드 API (시스템 통계)')
      .addTag('Tenants (슈퍼 관리자 전용)', '테넌트 관리 API (멀티테넌시)')
      .addTag('Permissions Admin (슈퍼 관리자 전용)', '페이지/액션/권한 CRUD API')
      .addTag('Websites', '웹사이트 관리 API (테넌트 관리자, 웹사이트 CRUD)')
      // === 보안 ===
      .addTag('Security - Block IP', 'IP 차단 관리 API')
      .addTag('Security - Block HP', '휴대폰 차단 관리 API')
      .addTag('Security - Block Word', '금칙어 관리 API')
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
