import { Controller, Post, Body, UseGuards, Get, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiUnauthorizedResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import MeResponseDto from './dto/me-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 사용자 ID 또는 비밀번호' })
  @ApiBody({ description: '로그인 요청 (tenantName으로 테넌트 구분)', type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto as any);
  }

  @Post('refresh')
  @ApiOperation({ summary: '리프레시 토큰으로 액세스 토큰 재발급' })
  @ApiBody({ description: '리프레시 토큰 요청 (형식: tokenId.secret). 서버는 secret을 검증한 뒤 새 액세스/리프레시 토큰을 발급합니다.', type: RefreshRequestDto })
  @ApiUnauthorizedResponse({ description: '유효하지 않거나 만료된 리프레시 토큰' })
  @ApiOkResponse({ type: RefreshResponseDto })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async refresh(@Body() dto: RefreshRequestDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃 (리프레시 토큰 폐기)' })
  @ApiUnauthorizedResponse({ description: '유효하지 않거나 소유권이 없는 토큰입니다.' })
  @ApiOkResponse({ description: '리프레시 토큰이 폐기됩니다.' })
  @ApiBody({ description: '폐기할 리프레시 토큰을 전송 (형식: tokenId.secret). 서버는 secret을 검증한 뒤 폐기합니다.', type: LogoutDto })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Body() dto: LogoutDto) {
    const userSeq = req.user?.userSeq;
    await this.authService.revokeRefreshToken(dto.refreshToken, userSeq);
    return { ok: true };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '모든 기기에서 로그아웃 (현재 사용자의 모든 리프레시 토큰 폐기)' })
  @ApiBearerAuth('JWT')
  @ApiUnauthorizedResponse({ description: '유효하지 않거나 권한이 없습니다.' })
  @ApiOkResponse({ description: '모든 리프레시 토큰이 폐기되고, 사용자 tokenVersion이 증가하여 이미 발급된 액세스 토큰은 즉시 무효화됩니다.' })
  async logoutAll(@Req() req: any) {
    const userSeq = req.user?.userSeq;
    if (!userSeq) return { ok: false };
    await this.authService.revokeAllRefreshTokens(userSeq, userSeq);
    return { ok: true };
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ description: '회원가입 요청 (tenantName으로 테넌트 구분)', type: RegisterDto })
  @ApiOkResponse({ type: RegisterResponseDto })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto as any);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '토큰 기반 사용자 정보' })
  @ApiBearerAuth('JWT')
  @ApiUnauthorizedResponse({ description: '유효하지 않은 또는 만료된 토큰' })
  @ApiOkResponse({ description: '토큰으로 확인된 사용자 정보', type: MeResponseDto })
  async me(@Req() req: any) {
    return { user: req.user };
  }
}
