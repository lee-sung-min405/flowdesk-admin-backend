import { ApiProperty } from '@nestjs/swagger';

export class ActionListItemDto {
  @ApiProperty({ description: '액션 ID', example: 1 })
  actionId: number;

  @ApiProperty({ description: '액션 이름 (시스템 코드)', example: 'read' })
  actionName: string;

  @ApiProperty({ description: '액션 표시명', example: '조회', nullable: true })
  displayName: string | null;

  @ApiProperty({ description: '활성 상태 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '연결된 권한 수', example: 15 })
  permissionCount: number;
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

export class FindActionsResponseDto {
  @ApiProperty({ type: [ActionListItemDto], description: '액션 목록' })
  items: ActionListItemDto[];

  @ApiProperty({ type: PageInfoDto, description: '페이지 정보' })
  pageInfo: PageInfoDto;
}
