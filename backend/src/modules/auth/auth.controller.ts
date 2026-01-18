import { Controller, Post, Body, UseGuards, Get, Req, UsePipes, ValidationPipe } from '@nestjs/common';
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
} from '@nestjs/swagger';
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
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/login',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto as any);
  }

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
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/refresh',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
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
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/logout',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
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

  @Post('register')
  @ApiOperation({ 
    summary: '회원가입',
    description: '새로운 사용자를 등록합니다. tenantName으로 테넌트를 구분하며, 동일 테넌트 내에서 userId는 고유해야 합니다.',
  })
  @ApiBody({ 
    description: '회원가입 요청 (tenantName으로 테넌트 구분)', 
    type: RegisterDto,
  })
  @ApiOkResponse({ 
    description: '회원가입 성공',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: '필수 파라미터 누락 (VAL001) - tenantName이 없거나 유효하지 않은 테넌트',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'VAL001',
          message: 'Invalid tenant',
          statusCode: 400,
        },
        meta: {
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/register',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: '비즈니스 충돌 (BIZ001) - 해당 테넌트에 이미 동일한 userId가 존재하는 경우',
    type: StandardErrorResponseDto,
    schema: {
      example: {
        error: {
          code: 'BIZ001',
          message: 'User already exists',
          statusCode: 409,
        },
        meta: {
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/register',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto as any);
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
- pagePermissions: 페이지별 액션 배열 (Flat 구조)
  * 예: { "users": ["read", "create", "update", "delete"] }
- permissionDetails: 권한 상세 정보 (트리 구조)
  * 페이지 계층 구조 포함
  * 각 페이지별 액션 상세 정보

**사용 사례:**
- 프론트엔드에서 버튼/메뉴 표시 제어
- 라우터 가드 (페이지 접근 제어)
- 권한 기반 UI 렌더링`,
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
          timestamp: '2026-01-18T12:34:56.789Z',
          path: '/auth/me',
        },
      },
    },
  })
  async me(@Req() req: any): Promise<MeResponseDto> {
    const user = req.user;
    
    const roles = await this.authService.getUserRoles(user.userSeq);
    
    const { permissions, pagePermissions, permissionDetails } = 
      await this.authService.getUserPermissions(user.userSeq);
    
    return {
      user,
      roles,
      permissions,
      pagePermissions,
      permissionDetails,
    };
  }
}
