import { ApiProperty } from '@nestjs/swagger';

export class UserDetailDto {
  @ApiProperty({ description: '사용자 일련번호', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '사용자 ID', example: 'john.doe' })
  userId: string;

  @ApiProperty({ description: '회사명', example: 'Acme Corporation' })
  corpName: string;

  @ApiProperty({ description: '사용자 이름', example: 'John Doe' })
  userName: string;

  @ApiProperty({ description: '이메일', example: 'john.doe@example.com', nullable: true })
  userEmail: string | null;

  @ApiProperty({ description: '전화번호', example: '02-1234-5678', nullable: true })
  userTel: string | null;

  @ApiProperty({ description: '휴대폰 번호', example: '010-1234-5678', nullable: true })
  userHp: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 정지)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '토큰 버전', example: 0 })
  tokenVersion: number;

  @ApiProperty({ description: '등록일시', example: '2026-01-19T00:00:00.000Z' })
  regDtm: Date;

  @ApiProperty({ description: '정지일시', example: null, nullable: true })
  stopDtm: Date | null;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;
}
