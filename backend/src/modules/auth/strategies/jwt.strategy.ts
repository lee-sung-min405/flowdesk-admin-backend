import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../iam/entities/user.entity';
import { SafeUser } from '../types/safe-user.type';
import { AuthenticationException } from '../../../common/exceptions/base.exception';

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
    };

    return safe;
  }
}
