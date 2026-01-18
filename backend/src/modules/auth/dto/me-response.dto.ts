import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class ActionDetailDto {
  @ApiProperty({ description: '권한 ID' })
  permissionId: number;

  @ApiProperty({ description: '액션 ID' })
  actionId: number;

  @ApiProperty({ description: '액션 이름 (예: read, create)' })
  actionName: string;

  @ApiProperty({ description: '액션 표시 이름 (예: 조회, 생성)' })
  actionDisplayName: string;
}

export class PageNodeDto {
  @ApiProperty({ description: '페이지 ID' })
  pageId: number;

  @ApiProperty({ description: '페이지 이름' })
  pageName: string;

  @ApiProperty({ description: '페이지 표시 이름' })
  pageDisplayName: string;

  @ApiProperty({ description: '페이지 경로' })
  pagePath: string;

  @ApiProperty({ description: '정렬 순서', nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: '부모 페이지 ID', nullable: true })
  parentId: number | null;

  @ApiProperty({ description: '트리 깊이' })
  depth: number;

  @ApiProperty({ description: '페이지의 액션 목록', type: [ActionDetailDto] })
  actions: ActionDetailDto[];

  @ApiProperty({ description: '자식 페이지 목록', type: [PageNodeDto] })
  children: PageNodeDto[];
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
    description: '빠른 권한 체크용 인덱스 (O(1) 조회)',
    example: {
      'dashboard.read': true,
      'system.users.create': true,
      'system.users.delete': true
    },
    type: 'object',
    additionalProperties: { type: 'boolean' }
  })
  permissions: Record<string, boolean>;

  @ApiProperty({
    description: '페이지별 액션 배열 (Flat 구조)',
    example: {
      'dashboard': ['read'],
      'system.users': ['read', 'create', 'update', 'delete']
    },
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } }
  })
  pagePermissions: Record<string, string[]>;

  @ApiProperty({
    description: '권한 상세 정보 (트리 구조)',
    type: [PageNodeDto]
  })
  permissionDetails: PageNodeDto[];
}

export default MeResponseDto;
