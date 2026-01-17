import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class LoginResponseDto {
  @ApiProperty({ description: '액세스 토큰 (JWT)' })
  accessToken: string;

  @ApiProperty({ description: '토큰 만료(예: 3600s)', required: false })
  expiresIn?: string;

  @ApiProperty({ description: '사용자 최소 정보', type: () => UserDto })
  user: UserDto;

  @ApiProperty({ description: 'Refresh token (rotate 시 새로운 토큰 발급)', required: false })
  refreshToken?: string;

  @ApiProperty({ description: 'Refresh token 만료 ISO string', required: false })
  refreshExpiresAt?: string;
}
