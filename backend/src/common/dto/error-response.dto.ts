import { ApiProperty } from '@nestjs/swagger';

/**
 * 표준 에러 응답 DTO (Swagger 문서용)
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: '에러 코드 (AUTH001, AUTH101, VAL001, BIZ001 등)',
    example: 'AUTH001',
  })
  code: string;

  @ApiProperty({
    description: '사용자에게 표시할 에러 메시지 (최소한의 정보만 제공)',
    example: 'Authentication required',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP 상태 코드',
    example: 401,
  })
  statusCode: number;
}

export class ErrorMetaDto {
  @ApiProperty({
    description: '요청 추적 ID (Request ID / Correlation ID)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  requestId: string;

  @ApiProperty({
    description: '에러 발생 시각 (ISO 8601)',
    example: '2026-01-18T12:34:56.789Z',
  })
  timestamp: string;

  @ApiProperty({
    description: '요청 경로',
    example: '/auth/login',
  })
  path: string;
}

export class StandardErrorResponseDto {
  @ApiProperty({
    description: '에러 정보',
    type: ErrorResponseDto,
  })
  error: ErrorResponseDto;

  @ApiProperty({
    description: '메타 정보',
    type: ErrorMetaDto,
  })
  meta: ErrorMetaDto;
}
