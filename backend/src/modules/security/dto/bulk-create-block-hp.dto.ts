import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class BulkCreateBlockHpDto {
  @ApiProperty({
    description: `차단할 전화번호 목록\n\n**입력 형식 안내:**\n- 한 줄에 하나의 전화번호를 입력\n- 쉼표(,)로 구분하여 입력 가능\n- 하이픈(-)은 자동으로 제거됨\n\n**예시:**\n\`\`\`\n01012345678\n010-2345-6789\n01034567890,01045678901\n\`\`\``,
    example: '01012345678\n010-2345-6789\n01034567890',
  })
  @IsString()
  phones: string;

  @ApiPropertyOptional({
    description: '차단 사유 (모든 전화번호에 동일하게 적용됨)',
    example: '스팸 전화',
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

export class BulkCreateBlockHpResponseDto {
  @ApiProperty({ description: '등록 성공한 전화번호 수', example: 10 })
  successCount: number;

  @ApiProperty({ description: '건너뛴 전화번호 수 (중복 등)', example: 2 })
  skippedCount: number;

  @ApiProperty({ description: '총 처리한 전화번호 수', example: 12 })
  totalCount: number;

  @ApiPropertyOptional({
    description: '건너뛴 전화번호 목록',
    example: ['01012345678', '01023456789'],
  })
  skippedPhones?: string[];
}
