import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesResponseDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '역할이 수정되었습니다.',
  })
  message: string;
}
