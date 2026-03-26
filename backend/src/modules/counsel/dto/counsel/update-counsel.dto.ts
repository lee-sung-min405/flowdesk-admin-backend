import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, IsArray, ValidateNested, ValidateIf, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { CounselFieldValueDto } from './create-counsel.dto';

export class UpdateCounselDto {
  @ApiPropertyOptional({ description: '상담자 이름', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '상담자 전화번호', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  counselHp?: string;

  @ApiPropertyOptional({ description: '담당자 userSeq (null: 미배정). 입력 시 동일 테넌트 소속 여부를 서버에서 검증합니다.', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Type(() => Number)
  empSeq?: number | null;

  @ApiPropertyOptional({ description: 'UTM 소스', maxLength: 50, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(50)
  counselSource?: string | null;

  @ApiPropertyOptional({ description: 'UTM 매체', maxLength: 50, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(50)
  counselMedium?: string | null;

  @ApiPropertyOptional({ description: 'UTM 캠페인', maxLength: 50, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(50)
  counselCampaign?: string | null;

  @ApiPropertyOptional({ description: '예약 일시 — ISO 8601 형식만 허용 (null 허용)', example: '2026-03-15T14:00:00', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601({}, { message: 'counselResvDtm은 ISO 8601 형식이어야 합니다.' })
  counselResvDtm?: string | null;

  @ApiPropertyOptional({ description: '상담 메모', maxLength: 255, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255)
  counselMemo?: string | null;

  @ApiPropertyOptional({
    description: '동적 필드 값 목록 (전체 교체)',
    type: [CounselFieldValueDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounselFieldValueDto)
  fieldValues?: CounselFieldValueDto[];
}
