import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PageChildDto {
  @ApiProperty({ description: '페이지 ID', example: 2 })
  pageId: number;

  @ApiProperty({ description: '페이지 코드명', example: 'dashboard' })
  pageName: string;

  @ApiProperty({ description: '페이지 경로', example: '/dashboard' })
  path: string;

  @ApiProperty({ description: '페이지 표시명', example: '대시보드' })
  displayName: string;

  @ApiPropertyOptional({ description: '페이지 설명', example: '메인 대시보드 페이지' })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  sortOrder: number | null;
}

export class PageResponseDto {
  @ApiProperty({ description: '페이지 ID', example: 1 })
  pageId: number;

  @ApiPropertyOptional({ description: '상위 페이지 ID', example: null })
  parentId: number | null;

  @ApiProperty({ description: '페이지 코드명', example: 'dashboard' })
  pageName: string;

  @ApiProperty({ description: '페이지 경로', example: '/dashboard' })
  path: string;

  @ApiProperty({ description: '페이지 표시명', example: '대시보드' })
  displayName: string;

  @ApiPropertyOptional({ description: '페이지 설명', example: '메인 대시보드 페이지' })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  sortOrder: number | null;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: '하위 페이지 목록', 
    type: [PageChildDto],
    example: []
  })
  children?: PageChildDto[];
}

export class ActionResponseDto {
  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiProperty({ description: '액션 코드명', example: 'read' })
  actionName: string;

  @ApiPropertyOptional({ description: '액션 표시명', example: '조회' })
  displayName: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}

export class PermissionResponseDto {
  @ApiProperty({ description: '권한 ID', example: 1 })
  permissionId: number;

  @ApiProperty({ description: '페이지 ID', example: 1 })
  pageId: number;

  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiPropertyOptional({ description: '권한 표시명', example: '대시보드 조회' })
  displayName: string | null;

  @ApiPropertyOptional({ description: '권한 설명', example: '대시보드 페이지 조회 권한' })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;

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
