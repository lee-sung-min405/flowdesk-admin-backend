import { ApiProperty } from '@nestjs/swagger';

export class TenantListItemDto {
  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '테넌트 이름', example: 'company-a' })
  tenantName: string;

  @ApiProperty({ description: '테넌트 표시명', example: 'A 회사', nullable: true })
  displayName: string | null;

  @ApiProperty({ description: '도메인', example: 'company-a.com', nullable: true })
  domain: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '생성일시', example: '2026-02-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-02-17T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '사용자 수', example: 25 })
  userCount: number;
}

export class PageInfoDto {
  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '전체 항목 수', example: 45 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 3 })
  totalPages: number;
}

export class FindTenantsResponseDto {
  @ApiProperty({ description: '테넌트 목록', type: [TenantListItemDto] })
  items: TenantListItemDto[];

  @ApiProperty({ description: '페이지네이션 정보', type: PageInfoDto })
  pageInfo: PageInfoDto;
}
