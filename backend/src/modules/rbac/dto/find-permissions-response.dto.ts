import { ApiProperty } from '@nestjs/swagger';

export class PermissionPageInfoDto {
  @ApiProperty({ description: '페이지 ID', example: 1 })
  pageId: number;

  @ApiProperty({ description: '페이지 이름 (시스템 코드)', example: 'users' })
  pageName: string;

  @ApiProperty({ description: '페이지 표시명', example: '사용자 관리', nullable: true })
  displayName: string | null;
}

export class PermissionActionInfoDto {
  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiProperty({ description: '액션 이름 (시스템 코드)', example: 'read' })
  actionName: string;

  @ApiProperty({ description: '액션 표시명', example: '조회', nullable: true })
  displayName: string | null;
}

export class PermissionListItemDto {
  @ApiProperty({ description: '권한 ID', example: 1 })
  permissionId: number;

  @ApiProperty({ description: '페이지 ID', example: 1 })
  pageId: number;

  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiProperty({ description: '권한 표시명', example: '사용자 조회', nullable: true })
  displayName: string | null;

  @ApiProperty({ description: '권한 설명', example: '사용자 목록 및 상세 조회 권한', nullable: true })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ type: PermissionPageInfoDto, description: '연결된 페이지 정보', nullable: true })
  page: PermissionPageInfoDto | null;

  @ApiProperty({ type: PermissionActionInfoDto, description: '연결된 액션 정보', nullable: true })
  action: PermissionActionInfoDto | null;
}

export class PermissionPaginationDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 항목 수', example: 100 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}

export class FindPermissionsResponseDto {
  @ApiProperty({ type: [PermissionListItemDto], description: '권한 목록' })
  items: PermissionListItemDto[];

  @ApiProperty({ type: PermissionPaginationDto, description: '페이지 정보' })
  pageInfo: PermissionPaginationDto;
}
