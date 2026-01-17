import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '테넌트 이름 (tenant_name, 유니크)', example: 'tenant-a' })
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @ApiProperty({ description: '사용자 아이디 (user_id)' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '비밀번호 (평문)' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
