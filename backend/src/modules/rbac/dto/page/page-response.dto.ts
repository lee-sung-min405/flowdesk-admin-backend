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
