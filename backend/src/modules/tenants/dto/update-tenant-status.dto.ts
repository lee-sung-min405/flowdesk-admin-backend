import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantStatusDto {
  @ApiProperty({
    description: '테넌트 활성화 여부',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
