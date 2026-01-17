import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SafeUser } from '../types/safe-user.type';

export class UserDto implements SafeUser{
  @ApiProperty({ description: '사용자 고유 시퀀스', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiPropertyOptional({ description: '테넌트 이름', example: 'tenant-a' })
  tenantName?: string | null;

  @ApiProperty({ description: '사용자 아이디', example: 'alice' })
  userId: string;

  @ApiProperty({ description: '사용자 이름', example: 'Alice' })
  userName: string;

  @ApiProperty({ description: '법인명', example: 'ACME Corp' })
  corpName: string;

  @ApiPropertyOptional({ description: '이메일', example: 'alice@example.com' })
  userEmail?: string | null;

  @ApiPropertyOptional({ description: '전화번호', example: '02-1234-5678' })
  userTel?: string | null;

  @ApiPropertyOptional({ description: '휴대폰', example: '010-1234-5678' })
  userHp?: string | null;

  @ApiProperty({ description: '활성 여부(1=활성,0=비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '등록일시' })
  regDtm: Date;
}
