import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../iam/entities/user.entity';
import { SafeUser } from '../types/safe-user.type';

interface JwtPayload {
  sub: number; // userSeq
  userId?: string;
  tenantName?: string;
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
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isActive === 0) throw new UnauthorizedException('User inactive');

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
    };

    return safe;
  }
}
