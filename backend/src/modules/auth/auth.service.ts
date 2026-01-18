import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../iam/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepository: Repository<RefreshToken>,
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
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isActive === 0) throw new ForbiddenException('User inactive');

    const match = await bcrypt.compare(password, user.userPwd);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.toSafeUser(user as any);
  }

  async login(payload: { tenantName: string; userId: string; password: string }) {
    if (!payload.tenantName) {
      throw new UnauthorizedException('tenantName is required');
    }

    const tenant = await this.tenantRepository.findOne({ where: { tenantName: payload.tenantName } });
    if (!tenant) throw new UnauthorizedException('Invalid tenant');

    const safeUser = await this.validateUserByTenant(tenant.tenantId, payload.userId, payload.password);

    const jwtPayload = {
      sub: (safeUser as any).userSeq,
      tenantName: tenant.tenantName,
      userId: (safeUser as any).userId,
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
    if (!refreshToken) throw new UnauthorizedException('refreshToken required');
    const parts = refreshToken.split('.');
    if (parts.length !== 2) throw new UnauthorizedException('Invalid refresh token');
    const [tokenId, secret] = parts;

    const rec = await this.refreshRepository.findOne({ where: { tokenId } });
    if (!rec) throw new UnauthorizedException('Invalid refresh token');
    if (rec.revoked === 1) throw new UnauthorizedException('Refresh token revoked');
    if (rec.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Refresh token expired');

    const ok = await bcrypt.compare(secret, rec.tokenHash);
    if (!ok) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.userRepository.findOne({ where: { userSeq: rec.userSeq }, relations: { tenant: true } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isActive === 0) throw new UnauthorizedException('User inactive');

      const updateResult = await this.refreshRepository
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revoked: 1 })
        .where('token_id = :tokenId AND revoked = 0', { tokenId })
        .execute();

      if (!updateResult.affected || updateResult.affected === 0) {
        throw new UnauthorizedException('Refresh token already used or revoked');
      }

    const newRefresh = await this.createRefreshToken(user.userSeq);

    const jwtPayload = {
      sub: user.userSeq,
      tenantName: user.tenant?.tenantName ?? null,
      userId: user.userId,
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
    if (!ok) throw new UnauthorizedException('Invalid refresh token');
    if (typeof requesterUserSeq !== 'undefined' && rec.userSeq !== requesterUserSeq) {
      throw new UnauthorizedException('Not allowed to revoke this token');
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
      throw new UnauthorizedException('Not allowed to revoke tokens for this user');
    }
    await this.refreshRepository.update({ userSeq }, { revoked: 1 });
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
      throw new BadRequestException('tenantName is required');
    }

    const tenant = await this.tenantRepository.findOne({ where: { tenantName: payload.tenantName } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const tenantId = tenant.tenantId;

    const exists = await this.userRepository.findOne({ where: { tenantId, userId: payload.userId } });
    if (exists) throw new ConflictException('User already exists');

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
}
