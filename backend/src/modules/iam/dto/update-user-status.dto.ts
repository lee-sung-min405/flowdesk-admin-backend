import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: '활성 상태 (true: 활성, false: 정지)',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
