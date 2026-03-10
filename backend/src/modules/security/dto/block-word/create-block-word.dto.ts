import { IsString, IsOptional, IsIn, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchType } from '../../entities/block-word.entity';

export class CreateBlockWordDto {
  @ApiProperty({
    description: '차단할 단어 또는 패턴 (matchType에 따라 해석 방식이 다름)',
    example: '욕설',
    examples: {
      'EXACT 예시': { value: '바보', summary: '"바보"와 정확히 일치하는 경우만 차단' },
      'CONTAINS 예시': { value: '바보', summary: '"바보"가 포함된 모든 텍스트 차단 (예: "바보야", "멍청한바보")' },
      'REGEX 예시': { value: '시[.]*발', summary: '정규식 패턴으로 "시발", "시.발", "시..발" 등 차단' },
    },
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  blockWord: string;

  @ApiPropertyOptional({
    description: `매칭 타입:\n- **EXACT**: 텍스트가 단어와 정확히 일치할 때만 차단\n- **CONTAINS**: 텍스트에 단어가 포함되면 차단 (가장 일반적)\n- **REGEX**: 정규표현식 패턴으로 복잡한 매칭 (변형된 욕설 등)`,
    example: 'CONTAINS',
    enum: MatchType,
    default: MatchType.CONTAINS,
  })
  @IsOptional()
  @IsEnum(MatchType)
  matchType?: MatchType;

  @ApiPropertyOptional({
    description: '차단 사유 (관리자 메모용, 차단 여부 확인 시 함께 반환됨)',
    example: '비속어',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    description: '활성화 여부 (1: 활성-차단중, 0: 비활성-차단해제)',
    example: 1,
    default: 1,
    enum: [0, 1],
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
