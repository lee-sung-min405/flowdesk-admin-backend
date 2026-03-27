import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsIn, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CounselListQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호 (최솟값: 1)', example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수 (최솟값: 1, 최댓값: 100)', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: '검색어 (이름, 전화번호, 메모에서 검색)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: '상담 상태 ID 필터', example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  counselStat?: number;

  @ApiPropertyOptional({ description: '담당자 userSeq 필터', example: 5 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  empSeq?: number;

  @ApiPropertyOptional({ description: '웹사이트 코드 필터', example: 'WEB001' })
  @IsOptional()
  @IsString()
  webCode?: string;

  @ApiPropertyOptional({ description: '등록 시작일 — YYYY-MM-DD 형식만 허용', example: '2026-01-01', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate는 YYYY-MM-DD 형식이어야 합니다.' })
  startDate?: string;

  @ApiPropertyOptional({ description: '등록 종료일 — YYYY-MM-DD 형식만 허용', example: '2026-12-31', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate는 YYYY-MM-DD 형식이어야 합니다.' })
  endDate?: string;

  @ApiPropertyOptional({ description: '중복 신청 여부 필터 (Y: 중복, N: 정상)', example: 'N', enum: ['Y', 'N'] })
  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  duplicateState?: string;

  @ApiPropertyOptional({ description: '예약 시작일 (counsel_resv_dtm 기준) — YYYY-MM-DD 형식만 허용', example: '2026-03-01', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'resvStartDate는 YYYY-MM-DD 형식이어야 합니다.' })
  resvStartDate?: string;

  @ApiPropertyOptional({ description: '예약 종료일 (counsel_resv_dtm 기준) — YYYY-MM-DD 형식만 허용', example: '2026-03-31', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'resvEndDate는 YYYY-MM-DD 형식이어야 합니다.' })
  resvEndDate?: string;
}
