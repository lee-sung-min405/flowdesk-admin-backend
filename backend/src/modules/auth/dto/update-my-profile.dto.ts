import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class UpdateMyProfileDto {
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
}
