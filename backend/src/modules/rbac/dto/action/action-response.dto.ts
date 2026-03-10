import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActionResponseDto {
  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiProperty({ description: '액션 코드명', example: 'read' })
  actionName: string;

  @ApiPropertyOptional({ description: '액션 표시명', example: '조회' })
  displayName: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}
