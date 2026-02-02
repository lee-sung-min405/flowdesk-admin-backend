import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';

export class ModifyPermissionsDto {
  @ApiProperty({
    description: '추가할 권한 ID 목록',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  add?: number[];

  @ApiProperty({
    description: '제거할 권한 ID 목록',
    example: [4, 5],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  remove?: number[];
}
