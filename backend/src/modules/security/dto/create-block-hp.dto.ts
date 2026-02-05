import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockHpDto {
  @ApiProperty({
    description: '차단할 휴대폰 번호 (하이픈 없이 숫자만 입력 권장)',
    example: '01012345678',
    examples: {
      '하이픈 없이': { value: '01012345678' },
      '하이픈 포함': { value: '010-1234-5678', summary: '하이픈은 저장 시 그대로 유지됨' },
    },
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  blockHp: string;

  @ApiPropertyOptional({
    description: '차단 사유 (관리자 메모용, 차단 여부 확인 시 함께 반환됨)',
    example: '스팸 발송자',
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
