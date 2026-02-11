import { ApiProperty } from '@nestjs/swagger';

export class TenantStatusResponseDto {
  @ApiProperty({ description: '상태 ID', example: 1 })
  tenantStatusId: number;

  @ApiProperty({ description: '테넌트 ID', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '상태 그룹', example: 'counsel' })
  statusGroup: string;

  @ApiProperty({ description: '상태 키', example: 'in_progress' })
  statusKey: string;

  @ApiProperty({ description: '상태 표시명', example: '진행중' })
  statusName: string;

  @ApiProperty({ description: '상태 설명', example: '상담이 진행 중인 상태입니다', nullable: true })
  description: string | null;

  @ApiProperty({ description: '상태 색상 (HEX)', example: '#3B82F6', nullable: true })
  color: string | null;

  @ApiProperty({ description: '정렬 순서', example: 1, nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: '활성 여부 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '생성일시', example: '2026-02-11T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-02-11T10:00:00.000Z' })
  updatedAt: Date;
}

export class TenantStatusGroupItemDto {
  @ApiProperty({ description: '상태 그룹명', example: 'counsel' })
  statusGroup: string;

  @ApiProperty({ description: '해당 그룹의 항목 수', example: 5 })
  count: number;

  @ApiProperty({ type: [TenantStatusResponseDto], description: '해당 그룹의 상태 목록' })
  items: TenantStatusResponseDto[];
}

export class TenantStatusGroupedResponseDto {
  @ApiProperty({
    type: [TenantStatusGroupItemDto],
    description: '상태 그룹별 목록',
  })
  groups: TenantStatusGroupItemDto[];

  @ApiProperty({ description: '전체 항목 수', example: 10 })
  total: number;
}
