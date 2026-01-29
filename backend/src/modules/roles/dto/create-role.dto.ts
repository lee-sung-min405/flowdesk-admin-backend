import { IsString, IsOptional, MaxLength, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: '역할 이름',
    example: 'admin',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  roleName: string;

  @ApiPropertyOptional({
    description: '역할 표시 이름',
    example: '관리자',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: '역할 설명',
    example: '시스템 관리자 역할',
  })
  @IsOptional()
  @IsString()
  description?: string;

}
