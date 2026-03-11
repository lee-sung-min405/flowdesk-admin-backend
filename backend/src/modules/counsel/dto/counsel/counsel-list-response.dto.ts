import { ApiProperty } from '@nestjs/swagger';
import { CounselListItemDto } from './counsel-response.dto';

export class CounselPageInfoDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '전체 항목 수', example: 100 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}

export class CounselListResponseDto {
  @ApiProperty({ description: '상담 목록', type: [CounselListItemDto] })
  items: CounselListItemDto[];

  @ApiProperty({ description: '페이지네이션 정보', type: CounselPageInfoDto })
  pageInfo: CounselPageInfoDto;
}
