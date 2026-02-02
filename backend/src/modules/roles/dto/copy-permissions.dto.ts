import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CopyPermissionsDto {
  @ApiProperty({
    description: '복사할 권한을 가진 원본 역할 ID',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  sourceRoleId: number;
}
