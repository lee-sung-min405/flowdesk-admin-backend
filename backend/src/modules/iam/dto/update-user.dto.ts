import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '회사명',
    example: 'Acme Corporation',
    maxLength: 250,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  corpName?: string;

  @ApiProperty({
    description: '사용자 이름',
    example: 'John Doe',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userName?: string;

  @ApiProperty({
    description: '이메일',
    example: 'john.doe@example.com',
    required: false,
    maxLength: 250,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(250)
  userEmail?: string;

  @ApiProperty({
    description: '전화번호',
    example: '02-1234-5678',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userTel?: string;

  @ApiProperty({
    description: '휴대폰 번호',
    example: '010-1234-5678',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userHp?: string;
}
