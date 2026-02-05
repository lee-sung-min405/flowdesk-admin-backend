import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebsiteResponseDto {
  @ApiProperty({ description: '웹사이트 코드', example: 'SITE001' })
  webCode: string;

  @ApiProperty({ description: '담당 사용자 시퀀스', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '웹사이트 URL', example: 'https://example.com' })
  webUrl: string;

  @ApiPropertyOptional({ description: '웹사이트 제목', example: '예제 웹사이트' })
  webTitle: string | null;

  @ApiPropertyOptional({ description: '웹사이트 이미지 URL', example: '/images/site001.png' })
  webImg: string | null;

  @ApiPropertyOptional({ description: '웹사이트 설명', example: '예제 웹사이트 설명' })
  webDesc: string | null;

  @ApiPropertyOptional({ description: '웹사이트 메모', example: '관리자 메모' })
  webMemo: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '중복 허용 기간 (일)', example: 30 })
  duplicateAllowAfterDays: number;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}
