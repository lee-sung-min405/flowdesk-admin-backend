import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockHpResponseDto {
  @ApiProperty({ description: '차단 휴대폰 ID', example: 1 })
  dbhIdx: number;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '차단 휴대폰 번호', example: '01012345678' })
  blockHp: string;

  @ApiPropertyOptional({ description: '차단 사유', example: '스팸 발송자' })
  reason: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiPropertyOptional({ description: '생성자 ID', example: 1 })
  createdBy: number | null;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}
