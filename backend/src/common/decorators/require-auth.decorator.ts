import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from './require-permission.decorator';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { PermissionUtil } from '../utils/permission.util';

/**
 * JWT 인증 + 권한 검증을 한번에 적용하는 컴포지트 데코레이터
 * 
 * @example
 * // 사용자 조회 권한 필요
 * @RequireAuth('users', 'read')
 * getUsers() {}
 * 
 * @example
 * // 역할 삭제 권한 필요
 * @RequireAuth('roles', 'delete')
 * deleteRole() {}
 * 
 * @param page 페이지 코드 (예: 'users', 'roles', 'boards')
 * @param action 액션 코드 (예: 'read', 'create', 'update', 'delete')
 */
export function RequireAuth(page: string, action: string) {
  const permissionKey = PermissionUtil.buildKey(page, action);
  
  return applyDecorators(
    // JWT 인증 적용
    UseGuards(JwtAuthGuard, PermissionGuard),
    
    // 권한 메타데이터 설정
    RequirePermission(page, action),
    
    // Swagger 문서화
    ApiBearerAuth('JWT'),
    ApiUnauthorizedResponse({
      description: '인증되지 않은 요청 - JWT 토큰이 없거나 만료되었거나 위조되었습니다',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          errorCode: { type: 'string', example: 'AUTH001' },
          message: { type: 'string', example: '인증에 실패했습니다.' },
          timestamp: { type: 'string', example: '2026-01-18T12:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
        },
      },
    }),
    ApiForbiddenResponse({
      description: `권한이 없는 요청 - 필요한 권한: ${permissionKey}`,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          errorCode: { type: 'string', example: 'AUTH101' },
          message: { type: 'string', example: `권한이 없습니다: ${permissionKey}` },
          timestamp: { type: 'string', example: '2026-01-18T12:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
        },
      },
    }),
  );
}
