import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsEnum } from 'class-validator';
import { MatchType } from '../entities/block-word.entity';

export class BulkCreateBlockWordDto {
  @ApiProperty({
    description: `차단할 단어 목록\n\n**입력 형식 안내:**\n- 한 줄에 하나의 단어를 입력\n- 쉼표(,)로 구분하여 입력 가능\n\n**예시:**\n\`\`\`\n욕설\n비속어,금지어\n나쁜말\n\`\`\``,
    example: '욕설\n비속어\n금지어',
  })
  @IsString()
  words: string;

  @ApiPropertyOptional({
    description: `매칭 타입 (모든 단어에 동일하게 적용됨):\n- **EXACT**: 정확히 일치할 때만 차단\n- **CONTAINS**: 포함되면 차단 (기본값, 가장 일반적)\n- **REGEX**: 정규표현식 패턴으로 매칭`,
    enum: MatchType,
    example: MatchType.CONTAINS,
    default: MatchType.CONTAINS,
  })
  @IsOptional()
  @IsEnum(MatchType)
  matchType?: MatchType;

  @ApiPropertyOptional({
    description: '차단 사유 (모든 단어에 동일하게 적용됨)',
    example: '부적절한 언어',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: '활성 상태 (1: 활성-차단중, 0: 비활성-차단해제)',
    example: 1,
    default: 1,
    enum: [0, 1],
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}

export class BulkCreateBlockWordResponseDto {
  @ApiProperty({ description: '등록 성공한 단어 수', example: 10 })
  successCount: number;

  @ApiProperty({ description: '건너뛴 단어 수 (중복 등)', example: 2 })
  skippedCount: number;

  @ApiProperty({ description: '총 처리한 단어 수', example: 12 })
  totalCount: number;

  @ApiPropertyOptional({
    description: '건너뛴 단어 목록',
    example: ['욕설', '비속어'],
  })
  skippedWords?: string[];
}
