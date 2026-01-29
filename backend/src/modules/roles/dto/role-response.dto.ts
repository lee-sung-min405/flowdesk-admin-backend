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

export class RoleDetailResponseDto extends RoleResponseDto {
  @ApiPropertyOptional({
    description: '역할에 할당된 권한 목록',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        permissionId: { type: 'number', example: 1 },
        displayName: { type: 'string', example: '대시보드 조회' },
      },
    },
  })
  rolePermissions?: any[];
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
