import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: '추가할 역할 ID 목록',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  add?: number[];

  @ApiProperty({
    description: '제거할 역할 ID 목록',
    example: [4, 5],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  remove?: number[];
}
