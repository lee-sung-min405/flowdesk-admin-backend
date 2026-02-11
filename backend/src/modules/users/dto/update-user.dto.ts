import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MaxLength, IsArray, IsInt, ArrayUnique } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '회사명',
    example: 'Acme Corporation',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  corpName?: string;

  @ApiPropertyOptional({
    description: '사용자 이름',
    example: 'John Doe',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userName?: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'john.doe@example.com',
    maxLength: 250,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(250)
  userEmail?: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '02-1234-5678',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userTel?: string;

  @ApiPropertyOptional({
    description: '휴대폰 번호',
    example: '010-1234-5678',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userHp?: string;

  @ApiPropertyOptional({
    description: '할당할 역할 ID 배열 (선택적, 전송 시 기존 역할을 모두 교체함)',
    type: [Number],
    example: [1, 3, 5],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds?: number[];
}
