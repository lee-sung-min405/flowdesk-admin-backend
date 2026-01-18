import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지 DTO
 */
export class PageDto {
  @ApiProperty({
    description: '페이지 ID',
    example: 1,
  })
  pageId: number;

  @ApiProperty({
    description: '부모 페이지 ID',
    example: null,
    nullable: true,
  })
  parentId: number | null;

  @ApiProperty({
    description: '페이지 키',
    example: 'USERS',
  })
  pageName: string;

  @ApiProperty({
    description: '페이지 경로',
    example: '/admin/users',
  })
  path: string;

  @ApiProperty({
    description: '페이지 표시명',
    example: '사용자 관리',
  })
  displayName: string;

  @ApiProperty({
    description: '페이지 설명',
    example: '사용자 목록 조회 및 관리',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
    nullable: true,
  })
  sortOrder: number | null;
}

/**
 * 액션 DTO
 */
export class ActionDto {
  @ApiProperty({
    description: '액션 ID',
    example: 1,
  })
  actionId: number;

  @ApiProperty({
    description: '액션 키',
    example: 'READ',
  })
  actionName: string;

  @ApiProperty({
    description: '액션 표시명',
    example: '조회',
    nullable: true,
  })
  displayName: string | null;
}

/**
 * 권한 DTO
 */
export class PermissionDto {
  @ApiProperty({
    description: '권한 ID',
    example: 1,
  })
  permissionId: number;

  @ApiProperty({
    description: '페이지 ID',
    example: 1,
  })
  pageId: number;

  @ApiProperty({
    description: '액션 ID',
    example: 1,
  })
  actionId: number;

  @ApiProperty({
    description: '권한 표시명',
    example: '사용자 조회',
    nullable: true,
  })
  displayName: string | null;

  @ApiProperty({
    description: '권한 설명',
    example: '사용자 목록 및 상세 정보 조회 권한',
    nullable: true,
  })
  description: string | null;
}

/**
 * 매트릭스 액션 항목 DTO
 */
export class MatrixActionDto {
  @ApiProperty({
    description: '액션 키',
    example: 'READ',
  })
  actionName: string;

  @ApiProperty({
    description: '권한 ID',
    example: 1,
  })
  permissionId: number;
}

/**
 * RBAC 카탈로그 응답 DTO
 */
export class CatalogResponseDto {
  @ApiProperty({
    description: '페이지 목록 (is_active=1, sort_order ASC, page_name ASC)',
    type: [PageDto],
  })
  pages: PageDto[];

  @ApiProperty({
    description: '액션 목록 (is_active=1, action_name ASC)',
    type: [ActionDto],
  })
  actions: ActionDto[];

  @ApiProperty({
    description: '권한 목록 (is_active=1)',
    type: [PermissionDto],
  })
  permissions: PermissionDto[];

  @ApiProperty({
    description: '페이지-액션 매트릭스 (키: page_name, 값: 해당 페이지의 액션 목록)',
    example: {
      USERS: [
        { actionName: 'READ', permissionId: 1 },
        { actionName: 'WRITE', permissionId: 2 },
      ],
      SETTINGS: [
        { actionName: 'READ', permissionId: 5 },
      ],
    },
  })
  matrix: Record<string, MatrixActionDto[]>;
}
