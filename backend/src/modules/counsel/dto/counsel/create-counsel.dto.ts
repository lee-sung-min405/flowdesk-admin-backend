import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, IsArray, ValidateNested, ValidateIf, IsISO8601, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CounselFieldValueDto {
  @ApiProperty({ description: '필드 ID', example: 1 })
  @IsInt()
  @Type(() => Number)
  fieldId: number;

  @ApiPropertyOptional({ description: '텍스트 값', example: '홍길동' })
  @IsOptional()
  @IsString()
  valueText?: string;

  @ApiPropertyOptional({ description: '숫자 값', example: 100000 })
  @IsOptional()
  @Type(() => Number)
  valueNumber?: number;

  @ApiPropertyOptional({ description: '날짜 값 — YYYY-MM-DD 형식만 허용', example: '2026-03-11', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'valueDate는 YYYY-MM-DD 형식이어야 합니다.' })
  valueDate?: string;

  @ApiPropertyOptional({ description: '일시 값 — ISO 8601 형식만 허용', example: '2026-03-11T09:00:00' })
  @IsOptional()
  @IsISO8601({}, { message: 'valueDatetime은 ISO 8601 형식이어야 합니다.' })
  valueDatetime?: string;
}

export class CreateCounselDto {
  @ApiProperty({ description: '웹사이트 코드', example: 'WEB001', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  webCode: string;

  @ApiProperty({ description: '상담자 이름', example: '홍길동', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '상담자 전화번호', example: '010-1234-5678', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  counselHp: string;

  @ApiPropertyOptional({ description: 'UTM 소스', example: 'google', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  counselSource?: string;

  @ApiPropertyOptional({ description: 'UTM 매체', example: 'cpc', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  counselMedium?: string;

  @ApiPropertyOptional({ description: 'UTM 캠페인', example: 'spring_sale', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  counselCampaign?: string;

  @ApiPropertyOptional({
    description: '예약 일시 — ISO 8601 형식만 허용 (null 허용)',
    example: '2026-03-15T14:00:00',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601({}, { message: 'counselResvDtm은 ISO 8601 형식이어야 합니다.' })
  counselResvDtm?: string | null;

  @ApiPropertyOptional({ description: '상담 메모', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  counselMemo?: string;

  @ApiPropertyOptional({
    description: '동적 필드 값 목록',
    type: [CounselFieldValueDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounselFieldValueDto)
  fieldValues?: CounselFieldValueDto[];
}
