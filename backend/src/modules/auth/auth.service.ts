import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../iam/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Permission } from '../iam/entities/permission.entity';
import { Role } from '../iam/entities/role.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';
import {
  AuthenticationException,
  AuthorizationException,
  ValidationException,
  BusinessConflictException,
} from '../../common/exceptions/base.exception';
import { PageNodeDto, ActionDetailDto } from './dto/me-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private toSafeUser(user: User) {
    const { userPwd, ...rest } = user as any;
    return rest;
  }

  async validateUserByTenant(
    tenantId: number,
    userId: string,
    password: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { tenantId, userId },
    });
    if (!user) {
      throw new AuthenticationException('User not found', { tenantId, userId });
    }
    if (user.isActive === 0) {
      throw new AuthenticationException('User inactive', { userSeq: user.userSeq });
    }

    const match = await bcrypt.compare(password, user.userPwd);
    if (!match) {
      throw new AuthenticationException('Invalid password', { userSeq: user.userSeq });
    }

    return this.toSafeUser(user as any);
  }

  async login(payload: { tenantName: string; userId: string; password: string }) {
    if (!payload.tenantName) {
      throw new ValidationException(
        'tenantName missing in request',
        'tenantName is required',
      );
    }

    const tenant = await this.tenantRepository.findOne({ where: { tenantName: payload.tenantName } });
    if (!tenant) {
      throw new AuthenticationException('Tenant not found', { tenantName: payload.tenantName });
    }

    const safeUser = await this.validateUserByTenant(tenant.tenantId, payload.userId, payload.password);

    const jwtPayload = {
      sub: (safeUser as any).userSeq,
      tenantName: tenant.tenantName,
      userId: (safeUser as any).userId,
      tokenVersion: (safeUser as any).tokenVersion ?? 0,
    };

    const expiresIn = String(this.configService.get<string | number>('JWT_EXPIRES_IN') || '3600s');
    const accessToken = this.jwtService.sign(jwtPayload);

    const refresh = await this.createRefreshToken((safeUser as any).userSeq);

    return {
      accessToken,
      expiresIn,
      user: safeUser,
      refreshToken: refresh.raw,
      refreshExpiresAt: refresh.expiresAt.toISOString(),
    };
  }

  private async createRefreshToken(userSeq: number) {
    const tokenId = randomUUID();
    const secret = randomBytes(64).toString('hex');
    const hash = await bcrypt.hash(secret, 10);
    const ttl = Number(this.configService.get<number>('REFRESH_EXPIRES_DAYS') || 7);
    const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000);

    const rec = this.refreshRepository.create({
      tokenId,
      tokenHash: hash,
      userSeq,
      expiresAt,
      revoked: 0,
    } as any);
    await this.refreshRepository.save(rec as any);

    return { raw: `${tokenId}.${secret}`, expiresAt };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new ValidationException(
        'refreshToken missing in request',
        'refreshToken is required',
      );
    }
    const parts = refreshToken.split('.');
    if (parts.length !== 2) {
      throw new AuthenticationException('Invalid refresh token format', { refreshToken });
    }
    const [tokenId, secret] = parts;

    const rec = await this.refreshRepository.findOne({ where: { tokenId } });
    if (!rec) {
      throw new AuthenticationException('Refresh token not found', { tokenId });
    }
    if (rec.revoked === 1) {
      throw new AuthenticationException('Refresh token already revoked', { tokenId });
    }
    if (rec.expiresAt.getTime() < Date.now()) {
      throw new AuthenticationException('Refresh token expired', { tokenId, expiresAt: rec.expiresAt });
    }

    const ok = await bcrypt.compare(secret, rec.tokenHash);
    if (!ok) {
      throw new AuthenticationException('Invalid refresh token secret', { tokenId });
    }

    const user = await this.userRepository.findOne({ where: { userSeq: rec.userSeq }, relations: { tenant: true } });
    if (!user) {
      throw new AuthenticationException('User not found for refresh token', { userSeq: rec.userSeq });
    }
    if (user.isActive === 0) {
      throw new AuthenticationException('User account is inactive', { userSeq: user.userSeq });
    }

      const updateResult = await this.refreshRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revoked: 1 })
        .where('token_id = :tokenId AND revoked = 0', { tokenId })
        .execute();

      if (!updateResult.affected || updateResult.affected === 0) {
        throw new AuthenticationException('Refresh token already used or revoked', { tokenId });
      }

    const newRefresh = await this.createRefreshToken(user.userSeq);

    const jwtPayload = {
      sub: user.userSeq,
      tenantName: user.tenant?.tenantName ?? null,
      userId: user.userId,
      tokenVersion: (user as any).tokenVersion ?? 0,
    };
    const accessToken = this.jwtService.sign(jwtPayload);
    const expiresIn = String(this.configService.get<string | number>('JWT_EXPIRES_IN') || '3600s');

    return {
      accessToken,
      expiresIn,
      refreshToken: newRefresh.raw,
      refreshExpiresAt: newRefresh.expiresAt.toISOString(),
    };
  }

  async revokeRefreshToken(refreshToken: string, requesterUserSeq?: number) {
    if (!refreshToken) return;
    const parts = refreshToken.split('.');
    if (parts.length !== 2) return;
    const [tokenId, secret] = parts;
    const rec = await this.refreshRepository.findOne({ where: { tokenId } });
    if (!rec) return;
    const ok = await bcrypt.compare(secret, rec.tokenHash);
    if (!ok) {
      throw new AuthenticationException('Invalid refresh token secret', { tokenId });
    }
    if (typeof requesterUserSeq !== 'undefined' && rec.userSeq !== requesterUserSeq) {
      throw new AuthorizationException(
        'User not allowed to revoke this token',
        { requesterUserSeq, tokenOwnerSeq: rec.userSeq, tokenId },
      );
    }
      // Atomically mark revoked only if not already revoked
      const updateResult = await this.refreshRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revoked: 1 })
        .where('token_id = :tokenId AND revoked = 0', { tokenId })
        .execute();

      // If affected === 0, the token was already revoked; treat as success (idempotent)
      if (updateResult.affected === 0) {
        return; // Idempotent success
      }
  }

  async revokeAllRefreshTokens(userSeq: number, requesterUserSeq?: number) {
    if (!userSeq) return;
    if (typeof requesterUserSeq !== 'undefined' && userSeq !== requesterUserSeq) {
      throw new AuthorizationException(
        'User not allowed to revoke tokens for this user',
        { requesterUserSeq, targetUserSeq: userSeq },
      );
    }
    await this.refreshRepository.update({ userSeq }, { revoked: 1 });

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ tokenVersion: () => 'token_version + 1' })
      .where('user_seq = :userSeq', { userSeq })
      .execute();
  }

  async register(payload: {
    tenantName: string;
    userId: string;
    password: string;
    corpName: string;
    userName: string;
    userEmail?: string;
    userTel?: string;
    userHp?: string;
  }) {
    if (!payload.tenantName) {
      throw new ValidationException(
        'tenantName missing in registration request',
        'tenantName is required',
      );
    }

    const tenant = await this.tenantRepository.findOne({ where: { tenantName: payload.tenantName } });
    if (!tenant) {
      throw new ValidationException(
        'Tenant not found during registration',
        'Invalid tenant',
        { tenantName: payload.tenantName },
      );
    }

    const tenantId = tenant.tenantId;

    const exists = await this.userRepository.findOne({ where: { tenantId, userId: payload.userId } });
    if (exists) {
      throw new BusinessConflictException(
        `User already exists: tenantId=${tenantId}, userId=${payload.userId}`,
        'User already exists',
        { tenantId, userId: payload.userId },
      );
    }

    const hashed = await bcrypt.hash(payload.password, 10);

    const user = this.userRepository.create({
      tenantId,
      userId: payload.userId,
      userPwd: hashed,
      corpName: payload.corpName,
      userName: payload.userName,
      userEmail: payload.userEmail ?? null,
      userTel: payload.userTel ?? null,
      userHp: payload.userHp ?? null,
      isActive: 1,
    });

    const saved = await this.userRepository.save(user as any);

    const { userPwd, ...safe } = saved as any;
    return safe;
  }

  async getUserRoles(userSeq: number): Promise<string[]> {
    try {
      const roles = await this.roleRepository
        .createQueryBuilder('role')
        .innerJoin('role.userRoles', 'ur')
        .where('ur.userSeq = :userSeq', { userSeq })
        .andWhere('role.isActive = :isActive', { isActive: 1 })
        .orderBy('role.roleName', 'ASC')
        .getMany();

      return roles.map(role => role.roleName);
    } catch (error) {
      this.logger.error(`Failed to get user roles for userSeq ${userSeq}`, error);
      throw error;
    }
  }

  async getUserPermissions(userSeq: number): Promise<{
    permissions: Record<string, boolean>;
    pagePermissions: Record<string, string[]>;
    permissionDetails: PageNodeDto[];
  }> {
    try {
      const permissions = await this.permissionRepository
        .createQueryBuilder('permission')
        .innerJoinAndSelect('permission.page', 'page')
        .innerJoinAndSelect('permission.action', 'action')
        .innerJoin('permission.rolePermissions', 'rp')
        .innerJoin('rp.role', 'role')
        .innerJoin('role.userRoles', 'ur')
        .where('ur.userSeq = :userSeq', { userSeq })
        .andWhere('permission.isActive = :isActive', { isActive: 1 })
        .andWhere('page.isActive = :isActive', { isActive: 1 })
        .andWhere('action.isActive = :isActive', { isActive: 1 })
        .andWhere('role.isActive = :isActive', { isActive: 1 })
        .orderBy('CASE WHEN page.sortOrder IS NULL THEN 1 ELSE 0 END', 'ASC')
        .addOrderBy('page.sortOrder', 'ASC')
        .addOrderBy('page.pageName', 'ASC')
        .addOrderBy('action.actionName', 'ASC')
        .getMany();

      this.logger.log(`Retrieved ${permissions.length} permissions for userSeq ${userSeq}`);

      const pageMap = new Map<number, any>();

      permissions.forEach(permission => {
        const { page, action } = permission;

        if (!pageMap.has(page.pageId)) {
          pageMap.set(page.pageId, {
            pageId: page.pageId,
            pageName: page.pageName,
            pageDisplayName: page.displayName,
            pagePath: page.path,
            sortOrder: page.sortOrder ?? null,
            parentId: page.parentId,
            depth: 0,
            actions: [],
            children: [],
          });
        }

        pageMap.get(page.pageId).actions.push({
          permissionId: permission.permissionId,
          actionId: action.actionId,
          actionName: action.actionName,
          actionDisplayName: action.displayName,
        });
      });

      const buildTree = (parentId: number | null, depth: number = 0): PageNodeDto[] => {
        const children = Array.from(pageMap.values())
          .filter(page => page.parentId === parentId)
          .sort((a, b) => {
            if (a.sortOrder === null && b.sortOrder === null) {
              return a.pageName.localeCompare(b.pageName);
            }
            if (a.sortOrder === null) return 1;
            if (b.sortOrder === null) return -1;
            if (a.sortOrder !== b.sortOrder) {
              return a.sortOrder - b.sortOrder;
            }
            return a.pageName.localeCompare(b.pageName);
          })
          .map(page => ({
            ...page,
            depth,
            children: buildTree(page.pageId, depth + 1),
          }));

        return children;
      };

      const permissionDetails = buildTree(null);

      // 4. permissions 인덱스 생성 (빠른 조회용)
      const permissionsIndex: Record<string, boolean> = {};
      const pagePermissionsMap: Record<string, string[]> = {};

      const traverse = (pages: PageNodeDto[], parentPath = '') => {
        pages.forEach(page => {
          const fullPath = parentPath 
            ? `${parentPath}.${page.pageName}` 
            : page.pageName;

          // pagePermissions 생성
          if (page.actions.length > 0) {
            pagePermissionsMap[fullPath] = page.actions.map(a => a.actionName);

            // permissions 인덱스 생성
            page.actions.forEach(action => {
              permissionsIndex[`${fullPath}.${action.actionName}`] = true;
            });
          }

          // 자식 페이지 순회
          if (page.children.length > 0) {
            traverse(page.children, fullPath);
          }
        });
      };

      traverse(permissionDetails);

      return {
        permissions: permissionsIndex,
        pagePermissions: pagePermissionsMap,
        permissionDetails,
      };
    } catch (error) {
      this.logger.error(`Failed to get user permissions for userSeq ${userSeq}`, error);
      throw error;
    }
  }
}
