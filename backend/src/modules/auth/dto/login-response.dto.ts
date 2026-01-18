import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class LoginResponseDto {
  @ApiProperty({ description: '액세스 토큰 (JWT) — payload에 tokenVersion이 포함됩니다. logout-all 호출 시 서버가 tokenVersion을 증가시키면 기존 액세스 토큰은 즉시 무효화됩니다.' })
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
