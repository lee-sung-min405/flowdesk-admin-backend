import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBlockHpDto {
  @ApiPropertyOptional({
    description: '차단 사유',
    example: '스팸 발송자',
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
