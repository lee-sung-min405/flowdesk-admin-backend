import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 에러 컨텍스트 (로그용 추가 정보)
 */
export interface ErrorContext {
  [key: string]: any;
}

/**
 * 전 API 공통 Base Exception
 * - internalMessage: 내부 로그용 (상세 원인)
 * - externalMessage: 클라이언트 응답용 (간결, 정보 노출 최소화)
 */
export class BaseBusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    public readonly internalMessage: string,
    public readonly externalMessage: string,
    public readonly statusCode: HttpStatus,
    public readonly context?: ErrorContext,
  ) {
    super(externalMessage, statusCode);
  }
}

/**
 * 인증 오류 (401)
 * - 토큰 없음/만료/위조/잘못됨
 * - 비활성 계정
 * - tokenVersion 불일치
 * 
 * 외부 응답: 항상 "Authentication required"
 */
export class AuthenticationException extends BaseBusinessException {
  constructor(internalMessage: string, context?: ErrorContext) {
    super(
      'AUTH001',
      internalMessage,
      'Authentication required',
      HttpStatus.UNAUTHORIZED,
      context,
    );
  }
}

/**
 * 인가 오류 (403)
 * - 로그인은 되었으나 권한 부족
 * - 다른 테넌트 리소스 접근
 * 
 * 외부 응답: 항상 "Forbidden"
 */
export class AuthorizationException extends BaseBusinessException {
  constructor(internalMessage: string, context?: ErrorContext) {
    super(
      'AUTH101',
      internalMessage,
      'Forbidden',
      HttpStatus.FORBIDDEN,
      context,
    );
  }
}

/**
 * Validation 오류 (400)
 * - 필수 파라미터 누락
 * - 형식 오류
 * 
 * 외부 응답: 구체적 메시지 가능 (보안 위험 없음)
 */
export class ValidationException extends BaseBusinessException {
  constructor(
    internalMessage: string,
    externalMessage: string,
    context?: ErrorContext,
  ) {
    super(
      'VAL001',
      internalMessage,
      externalMessage,
      HttpStatus.BAD_REQUEST,
      context,
    );
  }
}

/**
 * 비즈니스 충돌 오류 (409)
 * - 중복 리소스
 * - 상태 충돌
 * 
 * 외부 응답: 구체적 메시지 가능
 */
export class BusinessConflictException extends BaseBusinessException {
  constructor(
    internalMessage: string,
    externalMessage: string,
    context?: ErrorContext,
  ) {
    super(
      'BIZ001',
      internalMessage,
      externalMessage,
      HttpStatus.CONFLICT,
      context,
    );
  }
}
