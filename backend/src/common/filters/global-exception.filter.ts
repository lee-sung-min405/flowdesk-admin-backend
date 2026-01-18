import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseBusinessException } from '../exceptions/base.exception';

/**
 * 전역 Exception Filter
 * - 모든 예외를 포착하여 일관된 응답 형식으로 변환
 * - 내부 로그 (상세) vs 외부 응답 (간결) 분리
 * - 보안 정보 노출 방지
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'SYS001';
    let externalMessage = 'Internal server error';
    let internalMessage = 'Unknown error';
    let context: any = {};

    // 우리가 정의한 Business Exception
    if (exception instanceof BaseBusinessException) {
      status = exception.statusCode;
      errorCode = exception.errorCode;
      externalMessage = exception.externalMessage;
      internalMessage = exception.internalMessage;
      context = exception.context || {};
    }
    // NestJS 기본 HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      externalMessage = typeof response === 'string' ? response : (response as any).message || exception.message;
      internalMessage = exception.message;
    }
    // 예상치 못한 에러 (DB, 시스템 오류 등)
    else if (exception instanceof Error) {
      internalMessage = exception.message;
      context.stack = exception.stack;
    }

    // 내부 로그 (상세 정보 - Datadog/ELK 등으로 전송)
    const logData = {
      timestamp: new Date().toISOString(),
      errorCode,
      statusCode: status,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userSeq: (request as any).user?.userSeq || null,
      tenantId: (request as any).user?.tenantId || null,
      internalMessage,  // ← 상세 원인 (외부 노출 안 됨)
      context,           // ← 추가 컨텍스트
    };

    // 로그 레벨 분리
    if (status === 401 || status === 403) {
      this.logger.warn(logData);  // 인증/인가 실패
    } else if (status >= 500) {
      this.logger.error(logData);  // 서버 오류
    } else {
      this.logger.log(logData);    // 기타
    }

    // 외부 응답 (간결, 정보 노출 최소화)
    response.status(status).json({
      error: {
        code: errorCode,
        message: externalMessage,  // ← 간결한 메시지만
        statusCode: status,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
