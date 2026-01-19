import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, Matches, IsOptional } from 'class-validator';

export class SignupDto {
  @ApiProperty({ 
    description: '회사명 (Tenant 이름)', 
    example: 'Acme Corporation',
  })
  @IsString()
  @MinLength(2, { message: '회사명은 최소 2자 이상이어야 합니다.' })
  companyName: string;

  @ApiProperty({ 
    description: '관리자 이름', 
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  adminName: string;

  @ApiProperty({ 
    description: '관리자 이메일 (로그인 ID로 사용됨)', 
    example: 'admin@acme.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @ApiProperty({ 
    description: '관리자 휴대폰 번호', 
    example: '010-1234-5678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: '비밀번호 (8자 이상, 영문/숫자/특수문자 포함)', 
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/,
    { message: '비밀번호는 영문, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.' }
  )
  password: string;
}
