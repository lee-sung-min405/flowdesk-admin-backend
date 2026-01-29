import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionDto {
  @ApiProperty({
    description: '고유 액션 이름 (식별자)',
    example: 'read',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  actionName: string;

  @ApiPropertyOptional({
    description: '액션 표시 이름',
    example: 'Read',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: '액션 활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
