import { ApiProperty } from '@nestjs/swagger';

export class PageInfoDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '전체 항목 수', example: 150 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 8 })
  totalPages: number;
}

export class ListResponseDto<T> {
  @ApiProperty({ description: '응답 데이터 배열', isArray: true })
  items: T[];

  @ApiProperty({ description: '페이지네이션 정보', type: PageInfoDto })
  pageInfo: PageInfoDto;
}
