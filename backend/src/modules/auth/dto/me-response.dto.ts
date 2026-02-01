import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class MenuTreeNodeDto {
  @ApiProperty({ description: '페이지 이름', example: 'users' })
  pageName: string;

  @ApiProperty({ description: '표시 이름', example: '사용자 관리' })
  displayName: string;

  @ApiProperty({ description: '경로', example: '/users', nullable: true })
  path: string | null;

  @ApiProperty({ description: '정렬 순서', example: 1, nullable: true })
  order: number | null;

  @ApiProperty({ description: '자식 메뉴', type: [MenuTreeNodeDto] })
  children: MenuTreeNodeDto[];
}

export class MeResponseDto {
  @ApiProperty({ description: '토큰에서 확인된 사용자 정보', type: () => UserDto })
  user: UserDto;

  @ApiProperty({ 
    description: '사용자의 역할 목록',
    example: ['ADMIN', 'USER_MANAGER'],
    type: [String]
  })
  roles: string[];

  @ApiProperty({
    description: '권한 체크용 인덱스 (O(1) 조회) - 메뉴/버튼 표시 제어에 사용',
    example: {
      'users.read': true,
      'users.create': true,
      'roles.read': true,
      'roles.delete': true
    },
    type: 'object',
    additionalProperties: { type: 'boolean' }
  })
  permissions: Record<string, boolean>;

  @ApiProperty({
    description: '사용자 접근 가능한 메뉴 트리 (권한 기반 필터링됨) - 사이드바 렌더링에 사용',
    example: [
      {
        pageName: 'users',
        displayName: '사용자 관리',
        path: '/users',
        order: 1,
        children: []
      },
      {
        pageName: 'roles',
        displayName: '역할 관리',
        path: '/roles',
        order: 2,
        children: []
      }
    ],
    type: [MenuTreeNodeDto]
  })
  menuTree: MenuTreeNodeDto[];
}

export default MeResponseDto;
