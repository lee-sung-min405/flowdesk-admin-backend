import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ description: '액세스 토큰 (JWT) — payload에 tokenVersion이 포함됩니다. 서버가 tokenVersion을 증가시키면 해당 토큰은 무효화됩니다.' })
  accessToken: string;

  @ApiProperty({ description: '토큰 만료(예: 3600s)', required: false })
  expiresIn?: string;

  @ApiProperty({ description: 'Refresh token (rotate 시 새로운 토큰 발급)', required: false })
  refreshToken?: string;

  @ApiProperty({ description: 'Refresh token 만료 ISO string', required: false })
  refreshExpiresAt?: string;
}
