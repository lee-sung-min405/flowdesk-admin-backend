import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantStatusResponseDto {
  @ApiProperty({ description: '테넌트 상태 ID', example: 1 })
  tenantStatusId: number;

  @ApiProperty({ description: '상태 그룹명', example: 'COUNSEL_STATUS' })
  statusGroup: string;

  @ApiProperty({ description: '상태 코드 (snake_case)', example: 'status_pending' })
  statusKey: string;

  @ApiProperty({ description: '상태 표시명', example: '접수대기' })
  statusName: string;

  @ApiPropertyOptional({
    description: '상태 설명',
    example: '상담 접수 대기 중',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    description: '색상 코드',
    example: '#FF5733',
    nullable: true,
  })
  color: string | null;

  @ApiProperty({ description: '정렬 순서', example: 1, nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '생성일시', example: '2026-01-26T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2026-01-26T12:00:00.000Z' })
  updatedAt: Date;
}

export class TenantStatusGroupItemDto {
  @ApiProperty({ description: '테넌트 상태 ID', example: 1 })
  tenantStatusId: number;

  @ApiProperty({ description: '상태 코드', example: 'status_pending' })
  statusKey: string;

  @ApiProperty({ description: '상태명', example: '접수대기' })
  statusName: string;

  @ApiPropertyOptional({ description: '설명', example: '상담 접수 대기 중', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: '색상', example: '#FF5733', nullable: true })
  color: string | null;

  @ApiProperty({ description: '정렬 순서', example: 1, nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: '활성 상태', example: 1 })
  isActive: number;
}

class TenantStatusGroupDto {
  @ApiProperty({ description: '그룹명', example: 'COUNSEL_STATUS' })
  statusGroup: string;

  @ApiProperty({ description: '아이템 개수', example: 5 })
  count: number;

  @ApiProperty({ description: '상태 목록', type: [TenantStatusResponseDto] })
  items: TenantStatusResponseDto[];
}

export class TenantStatusGroupedResponseDto {
  @ApiProperty({ description: '그룹별 상태 목록', type: [TenantStatusGroupDto] })
  groups: TenantStatusGroupDto[];

  @ApiProperty({ description: '전체 상태 개수', example: 15 })
  total: number;
}
