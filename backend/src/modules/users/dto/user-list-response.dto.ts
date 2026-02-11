import { ApiProperty } from '@nestjs/swagger';
import { UserListItemDto } from './user-list-item.dto';
import { PageInfoDto } from './list-response.dto';

export class UserListResponseDto {
  @ApiProperty({ 
    description: '사용자 목록', 
    type: [UserListItemDto] 
  })
  items: UserListItemDto[];

  @ApiProperty({ 
    description: '페이지네이션 정보', 
    type: PageInfoDto 
  })
  pageInfo: PageInfoDto;
}
