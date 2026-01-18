import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionUtil } from '../utils/permission.util';
import { AuthorizationException } from '../exceptions/base.exception';

/**
 * 권한 검증 Guard
 * 
 * @RequirePermission 데코레이터로 지정된 권한을 검증합니다.
 * request.user.permissions에서 권한을 확인하며, 권한이 없으면 AuthorizationException을 발생시킵니다.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 메타데이터에서 필요한 권한 정보 추출
    const permissionMetadata = this.reflector.getAllAndOverride<{
      page: string;
      action: string;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    // 권한 메타데이터가 없으면 통과 (데코레이터 미사용 시)
    if (!permissionMetadata) {
      return true;
    }

    const { page, action } = permissionMetadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 사용자 정보가 없으면 인증 오류 (JwtAuthGuard 먼저 실행되어야 함)
    if (!user) {
      throw new AuthorizationException(
        '인증되지 않은 사용자입니다.',
        {
          requiredPermission: PermissionUtil.buildKey(page, action),
        },
      );
    }

    // 사용자 권한 확인
    const permissionKey = PermissionUtil.buildKey(page, action);
    const hasPermission = user.permissions && user.permissions[permissionKey] === true;

    if (!hasPermission) {
      throw new AuthorizationException(
        `권한이 없습니다: ${permissionKey}`,
        {
          requiredPermission: permissionKey,
          userSeq: user.userSeq,
          availablePermissions: user.permissions ? Object.keys(user.permissions).filter(k => user.permissions[k]) : [],
        },
      );
    }

    return true;
  }
}
