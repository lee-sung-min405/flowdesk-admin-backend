import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty()
  userSeq: number;

  @ApiProperty()
  tenantId: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  corpName: string;

  @ApiProperty()
  isActive: number;

  @ApiProperty()
  regDtm: Date;
}
