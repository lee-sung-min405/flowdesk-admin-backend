import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../iam/entities/user.entity';
import { Permission } from '../../iam/entities/permission.entity';
import { SafeUser } from '../types/safe-user.type';
import { AuthenticationException } from '../../../common/exceptions/base.exception';
import { PermissionUtil } from '../../../common/utils/permission.util';

interface JwtPayload {
  sub: number; // userSeq
  userId?: string;
  tenantName?: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'changeme',
    });
  }

  async validate(payload: JwtPayload): Promise<SafeUser> {
    const user = await this.userRepository.findOne({
      where: { userSeq: payload.sub },
      relations: { tenant: true },
    });
    if (!user) {
      throw new AuthenticationException('User not found for JWT token', { userSeq: payload.sub });
    }
    if (user.isActive === 0) {
      throw new AuthenticationException('User account is inactive', { userSeq: user.userSeq });
    }
    if (typeof payload.tokenVersion !== 'undefined' && payload.tokenVersion !== (user as any).tokenVersion) {
      throw new AuthenticationException(
        'Token version mismatch - token has been revoked',
        { userSeq: user.userSeq, tokenVersion: payload.tokenVersion, currentVersion: (user as any).tokenVersion },
      );
    }

    // 사용자 권한 조회
    const permissions = await this.getUserPermissions(user.userSeq);

    const { userPwd, tenant, ...rest } = user as any;
    const safe: SafeUser = {
      userSeq: rest.userSeq,
      tenantId: user.tenantId,
      tenantName: tenant?.tenantName ?? null,
      userId: rest.userId,
      userName: rest.userName,
      corpName: rest.corpName,
      userEmail: rest.userEmail ?? null,
      userTel: rest.userTel ?? null,
      userHp: rest.userHp ?? null,
      isActive: rest.isActive,
      regDtm: rest.regDtm,
      tokenVersion: (user as any).tokenVersion,
      permissions, // 권한 정보 추가
    };

    return safe;
  }

  /**
   * 사용자 권한 조회 (O(1) 조회를 위한 인덱스 생성)
   * 권한 키 형식: {page_name}.{action_name} (예: users.read, roles.delete)
   */
  private async getUserPermissions(userSeq: number): Promise<Record<string, boolean>> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.page', 'page')
      .innerJoin('permission.action', 'action')
      .innerJoin('permission.rolePermissions', 'rp')
      .innerJoin('rp.role', 'role')
      .innerJoin('role.userRoles', 'ur')
      .where('ur.userSeq = :userSeq', { userSeq })
      .andWhere('permission.isActive = :isActive', { isActive: 1 })
      .andWhere('page.isActive = :isActive', { isActive: 1 })
      .andWhere('action.isActive = :isActive', { isActive: 1 })
      .andWhere('role.isActive = :isActive', { isActive: 1 })
      .select('page.pageName', 'pageName')
      .addSelect('action.actionName', 'actionName')
      .getRawMany();

    // O(1) 조회를 위한 인덱스 생성
    const permissionIndex: Record<string, boolean> = {};
    permissions.forEach((p) => {
      const key = PermissionUtil.buildKey(p.pageName, p.actionName);
      permissionIndex[key] = true;
    });

    return permissionIndex;
  }
}
