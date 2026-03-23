import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CounselDashboardQueryDto {
  @ApiPropertyOptional({
    description: '조회 시작일 (YYYY-MM-DD). 미지정 시 30일 전',
    example: '2026-03-01',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate는 YYYY-MM-DD 형식이어야 합니다.' })
  startDate?: string;

  @ApiPropertyOptional({
    description: '조회 종료일 (YYYY-MM-DD). 미지정 시 오늘',
    example: '2026-03-23',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate는 YYYY-MM-DD 형식이어야 합니다.' })
  endDate?: string;
}
