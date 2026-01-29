import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    description: '리소스 활성화 여부',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
