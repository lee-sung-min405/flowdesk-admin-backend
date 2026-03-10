import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '테넌트 코드명', example: 'acme' })
  tenantName: string;

  @ApiPropertyOptional({ description: '테넌트 표시명', example: 'ACME 주식회사' })
  displayName: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiPropertyOptional({ description: '도메인', example: 'acme.flowdesk.com' })
  domain: string | null;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}
