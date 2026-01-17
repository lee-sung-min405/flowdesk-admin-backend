import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: '폐기할 리프레시 토큰' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
