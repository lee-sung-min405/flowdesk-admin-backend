import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength, IsInt } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: '테넌트 이름 (tenant_name, 유니크)', example: 'tenant-a' })
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @ApiProperty({ description: '사용자 아이디 (user_id)' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: '비밀번호 (평문, 최소 8자)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: '법인명(corp_name)' })
  @IsNotEmpty()
  @IsString()
  corpName: string;

  @ApiProperty({ description: '사용자 이름(user_name)' })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiPropertyOptional({ description: '사용자 이메일' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: '전화번호' })
  @IsOptional()
  @IsString()
  userTel?: string;

  @ApiPropertyOptional({ description: '휴대폰' })
  @IsOptional()
  @IsString()
  userHp?: string;
}
