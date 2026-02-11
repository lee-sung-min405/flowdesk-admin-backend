import { ApiProperty } from '@nestjs/swagger';
import { AvailableRoleDto } from './available-role.dto';

export class UserDetailResponseDto {
  @ApiProperty({ description: '사용자 일련번호', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '사용자 ID', example: 'admin' })
  userId: string;

  @ApiProperty({ description: '회사명', example: 'FlowDesk' })
  corpName: string;

  @ApiProperty({ description: '사용자 이름', example: '슈퍼 관리자' })
  userName: string;

  @ApiProperty({ description: '이메일', example: 'admin@flowdesk.com', nullable: true })
  userEmail: string | null;

  @ApiProperty({ description: '전화번호', example: '02-1234-5678', nullable: true })
  userTel: string | null;

  @ApiProperty({ description: '휴대폰 번호', example: '010-1234-5678', nullable: true })
  userHp: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 정지)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '등록일시', example: '2026-01-28T11:11:44.000Z' })
  regDtm: Date;

  @ApiProperty({ description: '정지일시', example: null, nullable: true })
  stopDtm: Date | null;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ 
    description: '할당된 역할 ID 배열', 
    type: [Number],
    example: [1, 3] 
  })
  assignedRoleIds: number[];

  @ApiProperty({ 
    description: '전체 역할 목록 (할당 여부 포함)', 
    type: [AvailableRoleDto] 
  })
  availableRoles: AvailableRoleDto[];
}
