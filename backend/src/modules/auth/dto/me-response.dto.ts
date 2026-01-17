import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class MeResponseDto {
  @ApiProperty({ description: '토큰에서 확인된 사용자 정보', type: () => UserDto })
  user: UserDto;
}

export default MeResponseDto;
