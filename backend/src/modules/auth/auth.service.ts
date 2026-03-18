import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantStatus } from '../tenants/entities/tenant-status.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
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
import { MenuTreeNodeDto } from './dto/me-response.dto';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { PermissionUtil } from '../../common/utils/permission.util';

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
    private readonly dataSource: DataSource,
  ) {}

  private toSafeUser(user: User) {
    const { userPwd, tokenVersion, ...rest } = user as any;
    return rest;
  }

  async validateUserByTenant(
    tenantId: number,
    userId: string,
    password: string,
  ): Promise<User> {
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

    return user;
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

    const rawUser = await this.validateUserByTenant(tenant.tenantId, payload.userId, payload.password);

    const jwtPayload = {
      sub: rawUser.userSeq,
      tenantName: tenant.tenantName,
      userId: rawUser.userId,
      tokenVersion: (rawUser as any).tokenVersion ?? 0,
    };

    const expiresIn = String(this.configService.get<string | number>('JWT_EXPIRES_IN') || '3600s');
    const accessToken = this.jwtService.sign(jwtPayload);

    const refresh = await this.createRefreshToken(rawUser.userSeq);

    return {
      accessToken,
      expiresIn,
      user: this.toSafeUser(rawUser),
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

  async getUserRoles(userSeq: number): Promise<string[]> {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.userRoles', 'ur')
      .where('ur.userSeq = :userSeq', { userSeq })
      .andWhere('role.isActive = :isActive', { isActive: 1 })
      .orderBy('role.roleName', 'ASC')
      .getMany();

    return roles.map(role => role.roleName);
  }

  async getUserPermissions(userSeq: number): Promise<{
    permissions: Record<string, boolean>;
  }> {
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

    const permissionsIndex: Record<string, boolean> = {};
    permissions.forEach(p => {
      const key = PermissionUtil.buildKey(p.pageName, p.actionName);
      permissionsIndex[key] = true;
    });

    return {
      permissions: permissionsIndex,
    };
  }

  async getUserMenuTree(userSeq: number): Promise<MenuTreeNodeDto[]> {
    const { permissions } = await this.getUserPermissions(userSeq);

    const pages = await this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.page', 'page')
      .where('page.isActive = :isActive', { isActive: 1 })
      .select('page.pageId', 'pageId')
      .addSelect('page.pageName', 'pageName')
      .addSelect('page.displayName', 'displayName')
      .addSelect('page.path', 'path')
      .addSelect('page.sortOrder', 'sortOrder')
      .addSelect('page.parentId', 'parentId')
      .distinct(true)
      .orderBy('page.sortOrder', 'ASC')
      .addOrderBy('page.pageName', 'ASC')
      .getRawMany();

    const accessiblePages = pages.filter(page => {
      const permissionKey = `${page.pageName}.read`;
      return permissions[permissionKey] === true;
    });

    return this.buildMenuTree(accessiblePages);
  }

  private buildMenuTree(pages: any[]): MenuTreeNodeDto[] {
    const map = new Map<number, MenuTreeNodeDto>();
    const roots: MenuTreeNodeDto[] = [];

    pages.forEach(page => {
      map.set(page.pageId, {
        pageName: page.pageName,
        displayName: page.displayName,
        path: page.path,
        order: page.sortOrder ?? null,
        children: []
      });
    });

    pages.forEach(page => {
      const node = map.get(page.pageId);
      if (page.parentId && map.has(page.parentId)) {
        map.get(page.parentId)!.children.push(node!);
      } else {
        roots.push(node!);
      }
    });

    return roots;
  }

  async signup(dto: SignupDto): Promise<SignupResponseDto> {
    return await this.dataSource.transaction(async (manager) => {

      const existingUser = await manager.findOne(User, {
        where: { userId: dto.email },
      });
      
      if (existingUser) {
        throw new BusinessConflictException(
          `Email already exists: ${dto.email}`,
          '이미 사용 중인 이메일입니다.',
          { email: dto.email },
        );
      }

      const existingTenant = await manager.findOne(Tenant, {
        where: { tenantName: dto.companyName },
      });

      if (existingTenant) {
        throw new BusinessConflictException(
          `Company name already exists: ${dto.companyName}`,
          '이미 사용 중인 회사명입니다.',
          { companyName: dto.companyName },
        );
      }

      const tenant = await manager.save(Tenant, {
        tenantName: dto.companyName,
        displayName: dto.companyName,
        isActive: 1,
      });

      const defaultStatuses = [
        { statusGroup: 'counsel', statusKey: 'NEW',         statusName: '신규 접수', sortOrder: 1 },
        { statusGroup: 'counsel', statusKey: 'DUPLICATE',   statusName: '중복',      sortOrder: 2 },
        { statusGroup: 'counsel', statusKey: 'IN_PROGRESS', statusName: '진행중',    sortOrder: 3 },
        { statusGroup: 'counsel', statusKey: 'SCHEDULED',   statusName: '예약',      sortOrder: 4 },
        { statusGroup: 'counsel', statusKey: 'CONTACTED',   statusName: '상담완료',  sortOrder: 5 },
      ];
      
      await manager.save(
        TenantStatus,
        defaultStatuses.map((s) =>
          manager.create(TenantStatus, { ...s, tenantId: tenant.tenantId, isActive: 1 }),
        ),
      );

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const admin = await manager.save(User, {
        userId: dto.email,
        userPwd: hashedPassword,
        tenantId: tenant.tenantId,
        userName: dto.adminName,
        corpName: dto.companyName,
        userEmail: dto.email,
        userHp: dto.phone || null,
        userTel: null,
        isActive: 1,
        tokenVersion: 0,
      });

      return {
        message: '회원가입이 완료되었습니다.',
        tenant: {
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
        },
        admin: {
          userSeq: admin.userSeq,
          userId: admin.userId,
          userName: admin.userName,
        },
      };
    });
  }
  
  async changePassword(
    userSeq: number,
    tenantId: number,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    if (newPassword !== confirmPassword) {
      throw new ValidationException(
        'Password confirmation mismatch',
        '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new AuthenticationException('User not found', { userSeq, tenantId });
    }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.userPwd);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationException('Current password is incorrect', { userSeq });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.userPwd);
    if (isSameAsOld) {
      throw new ValidationException(
        'New password same as current',
        '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.userPwd = hashedPassword;
    await this.userRepository.save(user);

    this.logger.log(`Password changed for userSeq: ${userSeq}`);
  }

  async updateMyProfile(
    tenantId: number,
    userSeq: number,
    dto: UpdateMyProfileDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new AuthenticationException('User not found', { userSeq, tenantId });
    }

    if (dto.corpName !== undefined) user.corpName = dto.corpName;
    if (dto.userName !== undefined) user.userName = dto.userName;
    if (dto.userEmail !== undefined) user.userEmail = dto.userEmail;
    if (dto.userTel !== undefined) user.userTel = dto.userTel;
    if (dto.userHp !== undefined) user.userHp = dto.userHp;

    const savedUser = await this.userRepository.save(user);

    return this.toSafeUser(savedUser) as User;
  }
}
