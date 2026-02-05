import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWebsiteStatusDto {
  @ApiProperty({
    description: '활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
  })
  @IsIn([0, 1])
  isActive: number;
}
