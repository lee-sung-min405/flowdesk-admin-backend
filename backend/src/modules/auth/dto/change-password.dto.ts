import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: '현재 비밀번호',
    example: 'CurrentP@ss1',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: '새 비밀번호 (8자 이상, 영문/숫자/특수문자 조합)',
    example: 'NewP@ssw0rd!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다',
  })
  newPassword: string;

  @ApiProperty({
    description: '새 비밀번호 확인',
    example: 'NewP@ssw0rd!',
  })
  @IsString()
  confirmPassword: string;
}
