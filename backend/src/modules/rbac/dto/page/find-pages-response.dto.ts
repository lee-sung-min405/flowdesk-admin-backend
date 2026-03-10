import { ApiProperty } from '@nestjs/swagger';

export class PageListItemDto {
  @ApiProperty({ description: '페이지 ID', example: 1 })
  pageId: number;

  @ApiProperty({ description: '부모 페이지 ID', example: null, nullable: true })
  parentId: number | null;

  @ApiProperty({ description: '페이지 이름 (시스템 코드)', example: 'super' })
  pageName: string;

  @ApiProperty({ description: '페이지 경로', example: '/super' })
  path: string;

  @ApiProperty({ description: '페이지 표시명', example: '슈퍼 관리자' })
  displayName: string;

  @ApiProperty({ description: '페이지 설명', example: '슈퍼 관리자 전용 기능', nullable: true })
  description: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '정렬 순서', example: 1, nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: '하위 페이지 수', example: 5 })
  childCount: number;

  @ApiProperty({ description: '연결된 권한 수', example: 15 })
  permissionCount: number;

  @ApiProperty({ description: '부모 페이지 정보', nullable: true })
  parent?: {
    pageId: number;
    pageName: string;
    displayName: string;
  } | null;
}

export class PageInfoDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 항목 수', example: 100 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}

export class FindPagesResponseDto {
  @ApiProperty({ type: [PageListItemDto], description: '페이지 목록' })
  items: PageListItemDto[];

  @ApiProperty({ type: PageInfoDto, description: '페이지 정보' })
  pageInfo: PageInfoDto;
}
