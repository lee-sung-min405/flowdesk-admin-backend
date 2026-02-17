import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ description: '역할 ID', example: 1 })
  roleId: number;

  @ApiProperty({ description: '역할 코드명', example: 'admin' })
  roleName: string;

  @ApiPropertyOptional({ description: '역할 표시명', example: '관리자' })
  displayName: string | null;

  @ApiPropertyOptional({ description: '역할 설명', example: '시스템 관리자 역할' })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}

export class PermissionSummaryDto {
  @ApiProperty({ description: '권한 ID', example: 1 })
  permissionId: number;

  @ApiProperty({ description: '권한 표시명', example: '슈퍼 대시보드 조회' })
  displayName: string;

  @ApiPropertyOptional({ description: '권한 설명', example: '시스템 전체 통계 조회' })
  description: string | null;

  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiProperty({ description: '액션명', example: 'read' })
  actionName: string;

  @ApiPropertyOptional({ description: '액션 표시명', example: '조회' })
  actionDisplayName: string | null;
}

export class PagePermissionsDto {
  @ApiProperty({ description: '페이지 ID', example: 2 })
  pageId: number;

  @ApiProperty({ description: '페이지명', example: 'super_dashboard' })
  pageName: string;

  @ApiPropertyOptional({ description: '페이지 표시명', example: '슈퍼 대시보드' })
  pageDisplayName: string | null;

  @ApiProperty({ 
    description: '해당 페이지의 권한 목록', 
    type: [PermissionSummaryDto] 
  })
  permissions: PermissionSummaryDto[];
}

export class AssignedUserDto {
  @ApiProperty({ description: '사용자 Seq', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '사용자 ID', example: 'admin' })
  userId: string;

  @ApiProperty({ description: '사용자명', example: '홍길동' })
  userName: string;

  @ApiProperty({ description: '이메일', example: 'admin@example.com' })
  email: string;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '역할 할당일시', example: '2026-02-17T12:00:00.000Z' })
  assignedAt: Date;
}

export class RoleDetailResponseDto extends RoleResponseDto {
  @ApiProperty({
    description: '역할에 할당된 권한 목록 (페이지별 그룹화)',
    type: [PagePermissionsDto],
  })
  permissionsByPage: PagePermissionsDto[];

  @ApiProperty({
    description: '해당 역할에 할당된 사용자 목록',
    type: [AssignedUserDto],
  })
  assignedUsers: AssignedUserDto[];
}

export class RolePermissionResponseDto {
  @ApiProperty({ description: '권한 ID', example: 1 })
  permissionId: number;

  @ApiPropertyOptional({ description: '권한 표시명', example: '대시보드 조회' })
  displayName: string | null;

  @ApiPropertyOptional({
    description: '페이지 정보',
    type: 'object',
    properties: {
      pageId: { type: 'number', example: 1 },
      pageName: { type: 'string', example: 'dashboard' },
      displayName: { type: 'string', example: '대시보드' },
    },
  })
  page?: any;

  @ApiPropertyOptional({
    description: '액션 정보',
    type: 'object',
    properties: {
      actionId: { type: 'number', example: 1 },
      actionName: { type: 'string', example: 'read' },
      displayName: { type: 'string', example: '조회' },
    },
  })
  action?: any;
}

export class RoleUserResponseDto {
  @ApiProperty({ description: '사용자 순번', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '사용자 ID', example: 'admin' })
  userId: string;

  @ApiPropertyOptional({ description: '사용자 이름', example: '홍길동' })
  userName: string | null;

  @ApiPropertyOptional({ description: '이메일', example: 'admin@example.com' })
  userEmail: string | null;
}
