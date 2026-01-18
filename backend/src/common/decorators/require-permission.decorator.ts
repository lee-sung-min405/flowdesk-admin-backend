import { SetMetadata } from '@nestjs/common';

/**
 * 권한 메타데이터 키
 */
export const PERMISSION_KEY = 'permission';

/**
 * API 엔드포인트에 필요한 권한을 지정하는 데코레이터
 * 
 * @example
 * // 사용자 조회 권한 필요
 * @RequirePermission('users', 'read')
 * getUsers() {}
 * 
 * @example
 * // 역할 삭제 권한 필요
 * @RequirePermission('roles', 'delete')
 * deleteRole() {}
 * 
 * @param page 페이지 코드 (예: 'users', 'roles', 'boards')
 * @param action 액션 코드 (예: 'read', 'create', 'update', 'delete')
 */
export const RequirePermission = (page: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { page, action });
