import { ApiProperty } from '@nestjs/swagger';

export class AvailableRoleDto {
  @ApiProperty({ description: '역할 ID', example: 1 })
  roleId: number;

  @ApiProperty({ description: '역할 이름', example: 'super_admin' })
  roleName: string;

  @ApiProperty({ description: '역할 표시 이름', example: '슈퍼 관리자', nullable: true })
  displayName: string | null;

  @ApiProperty({ description: '역할 설명', example: '시스템 전체 관리 권한을 가진 최고 관리자', nullable: true })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '현재 사용자에게 할당 여부', example: true })
  isAssigned: boolean;
}
