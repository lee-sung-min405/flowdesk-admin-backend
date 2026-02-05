import { ApiProperty } from '@nestjs/swagger';

export class PageInfoDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지 당 항목 수', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '전체 항목 수', example: 100 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}
