import { ApiProperty } from '@nestjs/swagger';
import { BoardListItemDto } from './board-list-item.dto';

export class BoardListResponseDto {
  @ApiProperty({ description: '게시판 목록', type: [BoardListItemDto] })
  items: BoardListItemDto[];
}
