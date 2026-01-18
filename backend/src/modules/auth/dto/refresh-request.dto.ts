import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty({ description: '리프레시 토큰 (형식: tokenId.secret). 서버는 tokenId로 레코드를 찾고 secret을 해시와 비교하여 검증합니다.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479.3f2a4b...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
