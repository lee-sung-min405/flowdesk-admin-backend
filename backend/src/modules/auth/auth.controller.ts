import { Controller, Post, Body, UseGuards, Get, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiOkResponse, 
  ApiBearerAuth, 
  ApiUnauthorizedResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import MeResponseDto from './dto/me-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { LogoutDto } from './dto/logout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ 
    summary: '로그인',
    description: '테넌트명, 사용자 ID, 비밀번호로 로그인합니다. 성공 시 액세스 토큰과 리프레시 토큰을 발급합니다.',
  })
  @ApiBody({ 
    description: '로그인 요청 (tenantName으로 테넌트 구분)', 
    type: LoginDto,
  })
  @ApiOkResponse({ 
    description: '로그인 성공 - 액세스 토큰과 리프레시 토큰 발급',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: '필수 파라미터 누락 (VAL001) - tenantName이 없는 경우',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'VAL001',
          message: 'tenantName is required',
          statusCode: 400,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/login',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: '인증 실패 (AUTH001) - 테넌트 없음, 사용자 없음, 비활성 계정, 비밀번호 불일치 등 (클라이언트에는 동일한 메시지 반환)',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH001',
          message: 'Authentication required',
          statusCode: 401,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/login',
        },
      },
    },
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto as any);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({ 
    summary: '리프레시 토큰으로 액세스 토큰 재발급',
    description: '리프레시 토큰(tokenId.secret 형식)을 검증하고 새 액세스 토큰과 리프레시 토큰을 발급합니다. 기존 리프레시 토큰은 자동으로 폐기됩니다.',
  })
  @ApiBody({ 
    description: '리프레시 토큰 요청 (형식: tokenId.secret). 서버는 secret을 검증한 뒤 새 액세스/리프레시 토큰을 발급합니다.', 
    type: RefreshRequestDto,
  })
  @ApiOkResponse({ 
    description: '토큰 재발급 성공',
    type: RefreshResponseDto,
  })
  @ApiBadRequestResponse({
    description: '필수 파라미터 누락 (VAL001) - refreshToken이 없는 경우',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'VAL001',
          message: 'refreshToken is required',
          statusCode: 400,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/refresh',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: '인증 실패 (AUTH001) - 토큰 형식 오류, 토큰 없음, 폐기된 토큰, 만료된 토큰, secret 불일치, 사용자 없음, 비활성 계정 등',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH001',
          message: 'Authentication required',
          statusCode: 401,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/refresh',
        },
      },
    },
  })
  async refresh(@Body() dto: RefreshRequestDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: '로그아웃 (리프레시 토큰 폐기)',
    description: '특정 리프레시 토큰을 폐기합니다. 소유권 검증을 수행하여 본인의 토큰만 폐기 가능합니다.',
  })
  @ApiBody({ 
    description: '폐기할 리프레시 토큰을 전송 (형식: tokenId.secret). 서버는 secret을 검증한 뒤 폐기합니다.', 
    type: LogoutDto,
  })
  @ApiOkResponse({ 
    description: '로그아웃 성공 - 리프레시 토큰 폐기됨',
    schema: {
      example: { ok: true },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: '인증 실패 (AUTH001) - 액세스 토큰 없음/만료/위조 또는 리프레시 토큰 secret 불일치',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH001',
          message: 'Authentication required',
          statusCode: 401,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/logout',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - 다른 사용자의 토큰을 폐기하려는 경우',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH101',
          message: 'Forbidden',
          statusCode: 403,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/logout',
        },
      },
    },
  })
  async logout(@Req() req: any, @Body() dto: LogoutDto) {
    const userSeq = req.user?.userSeq;
    await this.authService.revokeRefreshToken(dto.refreshToken, userSeq);
    return { ok: true };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: '모든 기기에서 로그아웃',
    description: '현재 사용자의 모든 리프레시 토큰을 폐기하고 tokenVersion을 증가시켜 이미 발급된 모든 액세스 토큰을 즉시 무효화합니다.',
  })
  @ApiOkResponse({ 
    description: '전체 로그아웃 성공 - 모든 토큰 무효화됨',
    schema: {
      example: { ok: true },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: '인증 실패 (AUTH001) - 액세스 토큰 없음/만료/위조',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH001',
          message: 'Authentication required',
          statusCode: 401,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/logout-all',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - 다른 사용자의 토큰을 폐기하려는 경우',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH101',
          message: 'Forbidden',
          statusCode: 403,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/logout-all',
        },
      },
    },
  })
  async logoutAll(@Req() req: any) {
    const userSeq = req.user?.userSeq;
    if (!userSeq) return { ok: false };
    await this.authService.revokeAllRefreshTokens(userSeq, userSeq);
    return { ok: true };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('signup')
  @ApiOperation({ 
    summary: '회원가입 (회사 + 관리자 계정 생성)',
    description: `새로운 회사(Tenant)와 관리자 계정을 동시에 생성합니다.

**프로세스:**
1. 이메일 중복 체크 (전체 시스템)
2. 회사명 중복 체크
3. 새 Tenant 생성
4. 관리자 계정 생성 (즉시 활성화)

**이후 단계:**
- 로그인하여 액세스 토큰 발급 (/auth/login)
- POST /users API로 팀원 추가 (관리자 권한 필요)`,
  })
  @ApiBody({ 
    description: '회원가입 요청 (회사 정보 + 관리자 정보)', 
    type: SignupDto,
  })
  @ApiOkResponse({ 
    description: '회원가입 성공',
    type: SignupResponseDto,
  })
  @ApiBadRequestResponse({
    description: '유효성 검사 실패 (VAL001)',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'VAL001',
          message: 'Validation failed',
          details: [
            '비밀번호는 영문, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.',
            '회사명은 최소 2자 이상이어야 합니다.'
          ],
          statusCode: 400,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-19T12:34:56.789Z',
          path: '/auth/signup',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: '이메일 또는 회사명 중복 (BIZ001)',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'BIZ001',
          message: '이미 사용 중인 이메일입니다.',
          statusCode: 409,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-19T12:34:56.789Z',
          path: '/auth/signup',
        },
      },
    },
  })
  async signup(@Body() dto: SignupDto): Promise<SignupResponseDto> {
    return this.authService.signup(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: '토큰 기반 사용자 정보 및 권한 조회',
    description: `액세스 토큰에서 추출한 현재 로그인 사용자의 정보와 권한을 반환합니다.

**응답 구조:**
- user: 사용자 기본 정보
- roles: 사용자의 역할 목록 (예: ["ADMIN", "USER_MANAGER"])
- permissions: 빠른 권한 체크용 인덱스 (O(1) 조회)
  * 예: { "dashboard.read": true, "users.delete": true }
- menuTree: 권한 기반 필터링된 메뉴 트리 구조
  * 사용자가 접근 가능한 페이지만 포함
  * 계층 구조 유지 (부모-자식 관계)

**사용 사례:**
- 프론트엔드에서 버튼/메뉴 표시 제어
- 라우터 가드 (페이지 접근 제어)
- 권한 기반 UI 렌더링
- 네비게이션 메뉴 생성`,
  })
  @ApiOkResponse({ 
    description: '사용자 정보 및 권한 조회 성공', 
    type: MeResponseDto,
  })
  @ApiUnauthorizedResponse({ 
    description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조, 사용자 없음, 비활성 계정, tokenVersion 불일치 등',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH001',
          message: 'Authentication required',
          statusCode: 401,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/me',
        },
      },
    },
  })
  async me(@Req() req: any): Promise<MeResponseDto> {
    const { permissions, ...user } = req.user;
    
    const roles = await this.authService.getUserRoles(user.userSeq);
    const menuTree = await this.authService.getUserMenuTree(user.userSeq);
    
    return {
      user,
      roles,
      permissions,
      menuTree,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: '비밀번호 변경 (본인)',
    description: `로그인된 사용자가 자신의 비밀번호를 변경합니다.

**처리 규칙:**
1. 현재 비밀번호가 일치해야 합니다
2. 새 비밀번호와 확인 비밀번호가 일치해야 합니다
3. 새 비밀번호는 현재 비밀번호와 달라야 합니다
4. 비밀번호는 8자 이상, 영문/숫자/특수문자 조합이어야 합니다`,
  })
  @ApiBody({ 
    description: '비밀번호 변경 요청', 
    type: ChangePasswordDto,
  })
  @ApiNoContentResponse({ 
    description: '비밀번호 변경 성공',
  })
  @ApiBadRequestResponse({
    description: '유효성 검사 실패 (VAL001) - 비밀번호 형식 오류, 새 비밀번호 불일치, 현재 비밀번호와 동일',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'VAL001',
          message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
          statusCode: 400,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-26T12:34:56.789Z',
          path: '/auth/change-password',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ 
    description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조 또는 현재 비밀번호 불일치',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'AUTH001',
          message: 'Authentication required',
          statusCode: 401,
        },
        meta: {
          requestId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          timestamp: '2026-01-26T12:34:56.789Z',
          path: '/auth/change-password',
        },
      },
    },
  })
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    const { userSeq, tenantId } = req.user;
    await this.authService.changePassword(
      userSeq,
      tenantId,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }
}
