import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CounselUpdateStatusDto {
  @ApiProperty({ description: '변경할 상태 ID (tenant_status)', example: 2 })
  @IsInt()
  @Type(() => Number)
  counselStat: number;

  @ApiPropertyOptional({
    description: '예약 일시 — statusKey가 SCHEDULED일 때 필수. ISO 8601 형식만 허용',
    example: '2026-03-15T14:00:00',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsISO8601({}, { message: 'counselResvDtm은 ISO 8601 형식이어야 합니다.' })
  counselResvDtm?: string;
}
