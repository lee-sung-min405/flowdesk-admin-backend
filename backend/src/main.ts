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
      .addTag('health', '헬스체크 및 진단')
      .addTag('인증', '인증 관련 API')
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
