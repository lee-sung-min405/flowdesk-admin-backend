import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 Guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
