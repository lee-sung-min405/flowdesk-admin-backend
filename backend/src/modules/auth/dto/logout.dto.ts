import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: '폐기할 리프레시 토큰 (형식: tokenId.secret). 서버에서 secret 부분을 검증한 뒤 폐기합니다.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479.3f2a4b...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
