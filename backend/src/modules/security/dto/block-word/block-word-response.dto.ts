import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchType } from '../../entities/block-word.entity';

export class BlockWordResponseDto {
  @ApiProperty({ description: '금칙어 ID', example: 1 })
  dbwIdx: number;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '금칙어', example: '욕설' })
  blockWord: string;

  @ApiProperty({ 
    description: '매칭 타입', 
    example: 'CONTAINS',
    enum: MatchType,
  })
  matchType: MatchType;

  @ApiPropertyOptional({ description: '차단 사유', example: '비속어' })
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
