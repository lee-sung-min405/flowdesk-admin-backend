import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantStatusDto {
  @ApiProperty({
    description: '활성 상태 (1: 활성, 0: 비활성)',
    example: 1,
  })
  @IsIn([0, 1])
  isActive: number;
}
