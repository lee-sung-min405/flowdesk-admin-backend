import { ApiProperty } from '@nestjs/swagger';
import { PostListItemDto } from './post-list-item.dto';

export class PostPageInfoDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '전체 항목 수', example: 53 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 3 })
  totalPages: number;
}

export class PostListResponseDto {
  @ApiProperty({ description: '게시글 목록', type: [PostListItemDto] })
  items: PostListItemDto[];

  @ApiProperty({ description: '페이지네이션 정보', type: PostPageInfoDto })
  pageInfo: PostPageInfoDto;
}
