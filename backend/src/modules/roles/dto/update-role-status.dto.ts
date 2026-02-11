import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsIn } from 'class-validator';

export class UpdateRoleStatusDto {
  @ApiProperty({
    description: '역할 활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
    enum: [0, 1],
  })
  @IsInt()
  @IsIn([0, 1])
  isActive: number;
}
