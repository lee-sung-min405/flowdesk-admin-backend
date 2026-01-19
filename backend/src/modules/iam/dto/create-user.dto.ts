import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 ID (테넌트 내 유니크)',
    example: 'john.doe',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  userId: string;

  @ApiProperty({
    description: '비밀번호 (8자 이상, 영문/숫자/특수문자 조합)',
    example: 'P@ssw0rd!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다',
  })
  password: string;

  @ApiProperty({
    description: '회사명',
    example: 'Acme Corporation',
    maxLength: 250,
  })
  @IsString()
  @MaxLength(250)
  corpName: string;

  @ApiProperty({
    description: '사용자 이름',
    example: 'John Doe',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  userName: string;

  @ApiProperty({
    description: '이메일 (선택)',
    example: 'john.doe@example.com',
    required: false,
    maxLength: 250,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(250)
  userEmail?: string;

  @ApiProperty({
    description: '전화번호 (선택)',
    example: '02-1234-5678',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userTel?: string;

  @ApiProperty({
    description: '휴대폰 번호 (선택)',
    example: '010-1234-5678',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userHp?: string;
}
