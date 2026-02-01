import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * - 각 요청마다 고유한 ID 생성
 * - 클라이언트가 X-Request-ID 헤더로 전송하면 그대로 사용
 * - 없으면 서버에서 UUID 생성
 * - 응답 헤더에도 포함하여 클라이언트가 참조 가능하도록 함
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 클라이언트가 보낸 Request ID 사용 (있으면)
    const existingRequestId = req.headers['x-request-id'] as string;
    const requestId = existingRequestId || randomUUID();

    // Request 객체에 저장 (로그에서 사용)
    (req as any).requestId = requestId;

    // 응답 헤더에 포함 (클라이언트가 에러 리포트 시 사용)
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
