import { IsArray, IsInt, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesToUserDto {
  @ApiProperty({ description: '배정/해제할 역할 ID 목록', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds: number[];
}
