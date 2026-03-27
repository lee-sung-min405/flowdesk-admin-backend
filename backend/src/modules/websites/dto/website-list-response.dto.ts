import { ApiProperty } from '@nestjs/swagger';
import { WebsiteResponseDto } from './website-response.dto';

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

export class WebsiteListResponseDto {
  @ApiProperty({ 
    description: '웹사이트 목록', 
    type: [WebsiteResponseDto] 
  })
  items: WebsiteResponseDto[];

  @ApiProperty({ 
    description: '페이지 정보', 
    type: PageInfoDto,
  })
  pageInfo: PageInfoDto;
}
