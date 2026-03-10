import { IsString, IsOptional, IsIn, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MatchType } from '../../entities/block-word.entity';

export class UpdateBlockWordDto {
  @ApiPropertyOptional({
    description: '매칭 타입 (EXACT: 정확히 일치, CONTAINS: 포함, REGEX: 정규식)',
    example: 'CONTAINS',
    enum: MatchType,
  })
  @IsOptional()
  @IsEnum(MatchType)
  matchType?: MatchType;

  @ApiPropertyOptional({
    description: '차단 사유',
    example: '비속어',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    description: '활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
