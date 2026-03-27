import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserRolesResponseDto } from './dto/update-user-roles-response.dto';
import { User } from './entities/user.entity';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @RequireAuth('users', 'read')
  @ApiOperation({
    summary: '사용자 목록 조회',
    description: `테넌트 내 사용자 목록을 페이지네이션하여 조회합니다.

**권한:** users.read

**검색/필터링:**
- q: userId, userName, corpName, userEmail 필드에서 LIKE 검색
- isActive: 0(정지) 또는 1(활성) 필터링

**정렬:**
- sort: 정렬 필드 (userSeq, userId, userName, corpName, regDtm, isActive)
- order: ASC 또는 DESC`,
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: '검색어 (userId, userName, corpName, userEmail)' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (0: 정지, 1: 활성)' })
  @ApiQuery({ name: 'sort', required: false, description: '정렬 필드', example: 'regDtm' })
  @ApiQuery({ name: 'order', required: false, description: '정렬 순서', enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiOkResponse({
    description: '사용자 목록 조회 성공',
    type: UserListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - users.read 권한 필요',
    type: StandardErrorResponseDto,
  })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('q') q?: string,
    @Query('isActive', new ParseIntPipe({ optional: true })) isActive?: number,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ): Promise<UserListResponseDto> {
    return this.usersService.findUsers(request.user.tenantId, page, limit, q, isActive, sort, order);
  }

  @Get(':id')
  @RequireAuth('users', 'read')
  @ApiOperation({
    summary: '사용자 상세 조회 (전체 역할 목록 포함)',
    description: `특정 사용자의 상세 정보와 할당 가능한 모든 역할 목록을 조회합니다.

**권한:** users.read

**Tenant 격리:** 같은 테넌트 내 사용자만 조회 가능

**응답 구조:**
- assignedRoleIds: 할당된 역할 ID 배열
- availableRoles: 전체 역할 목록 (isAssigned 플래그 포함)`,
  })
  @ApiOkResponse({
    description: '사용자 상세 조회 성공',
    type: UserDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101)',
    type: StandardErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getUserDetail(request.user.tenantId, id);
  }

  @Post()
  @RequireAuth('users', 'create')
  @ApiOperation({
    summary: '사용자 생성',
    description: `새로운 사용자를 생성합니다.

**권한:** users.create

**Tenant 격리:** 현재 로그인한 사용자의 테넌트에 사용자가 생성됩니다.

**중복 체크:** tenant_id + user_id 조합이 유니크해야 합니다.`,
  })
  @ApiCreatedResponse({
    description: '사용자 생성 성공',
    type: User,
  })
  @ApiBadRequestResponse({
    description: '유효성 검사 실패 (VAL001)',
    type: StandardErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101)',
    type: StandardErrorResponseDto,
  })
  @ApiConflictResponse({
    description: '이미 존재하는 사용자 ID (BIZ001)',
    type: StandardErrorResponseDto,
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.createUser(request.user.tenantId, createUserDto);
  }

  @Patch(':id')
  @RequireAuth('users', 'update')
  @ApiOperation({
    summary: '사용자 정보 수정 (역할 포함 가능)',
    description: `사용자 기본 정보와 역할을 수정합니다.

**권한:** users.update

**수정 불가 필드:** userId, password (별도 API 사용)

**수정 가능 필드:** 
- 기본 정보: corpName, userName, userEmail, userTel, userHp
- 역할: roleIds (선택적, 전송 시 기존 역할을 모두 교체)

**역할 수정:**
- roleIds를 포함하면 기존 역할이 모두 제거되고 새 역할로 교체됩니다
- roleIds를 생략하면 역할은 변경되지 않습니다
- 빈 배열([])을 전송하면 모든 역할이 제거됩니다`,
  })
  @ApiOkResponse({
    description: '사용자 정보 수정 성공',
    type: User,
  })
  @ApiBadRequestResponse({
    description: '유효성 검사 실패 (VAL001)',
    type: StandardErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101)',
    type: StandardErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(request.user.tenantId, id, updateUserDto);
  }

  @Patch(':id/status')
  @RequireAuth('users', 'update')
  @ApiOperation({
    summary: '사용자 상태 변경 (활성/정지)',
    description: `사용자의 활성 상태를 변경합니다.

**권한:** users.update

**상태:**
- isActive: true → 활성화 (stopDtm = null)
- isActive: false → 정지 (stopDtm = 현재시간)

**주의:** 정지된 사용자는 로그인할 수 없습니다.`,
  })
  @ApiOkResponse({
    description: '사용자 상태 변경 성공',
    type: User,
  })
  @ApiBadRequestResponse({
    description: '유효성 검사 실패 (VAL001)',
    type: StandardErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101)',
    type: StandardErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    return this.usersService.updateUserStatus(request.user.tenantId, id, updateUserStatusDto);
  }

  @Patch(':id/password')
  @RequireAuth('users', 'update')
  @ApiOperation({
    summary: '사용자 비밀번호 변경 (관리자용)',
    description: `관리자가 사용자의 비밀번호를 변경합니다.

**권한:** users.update

**보안:** 비밀번호는 bcrypt로 해싱되어 저장됩니다.

**주의:** 관리자가 직접 변경하므로 기존 비밀번호 확인 없이 변경됩니다.`,
  })
  @ApiNoContentResponse({
    description: '비밀번호 변경 성공',
  })
  @ApiBadRequestResponse({
    description: '유효성 검사 실패 (VAL001)',
    type: StandardErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101)',
    type: StandardErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ): Promise<void> {
    return this.usersService.updateUserPassword(request.user.tenantId, id, updateUserPasswordDto);
  }

  @Post(':id/invalidate-tokens')
  @RequireAuth('users', 'update')
  @ApiOperation({
    summary: '토큰 무효화 (강제 로그아웃)',
    description: `특정 사용자의 모든 토큰을 무효화하여 강제 로그아웃시킵니다.

**권한:** users.update

**동작:**
1. tokenVersion 증가 → 발급된 모든 액세스 토큰 즉시 무효화
2. 모든 리프레시 토큰 폐기

**사용 사례:** 보안 사고, 퇴사 처리 등`,
  })
  @ApiNoContentResponse({
    description: '토큰 무효화 성공',
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101)',
    type: StandardErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async invalidateTokens(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.usersService.invalidateUserTokens(request.user.tenantId, id);
  }

  @Patch(':id/roles')
  @RequireAuth('users', 'update')
  @ApiOperation({ 
    summary: '사용자의 역할 수정 (추가/제거)',
    description: `사용자에게 역할을 추가하거나 제거합니다.

**요청 본문:**
- \`add\`: 추가할 역할 ID 배열 (선택)
- \`remove\`: 제거할 역할 ID 배열 (선택)

**동작:**
- \`add\` 배열의 역할들은 사용자에게 추가됩니다 (이미 있는 역할은 무시)
- \`remove\` 배열의 역할들은 사용자에게서 제거됩니다 (없는 역할은 무시)
- 둘 다 생략하거나 빈 배열인 경우 아무 변경 없음

**사용 예시:**
\`\`\`json
// 역할 추가만
{ "add": [1, 2, 3] }

// 역할 제거만
{ "remove": [4, 5] }

// 동시에 추가 및 제거
{ "add": [1, 2], "remove": [3, 4] }
\`\`\``
  })
  @ApiParam({ name: 'id', type: Number, description: '사용자 Seq' })
  @ApiOkResponse({ 
    description: '역할 수정 성공',
    type: UpdateUserRolesResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청 (역할 ID가 유효하지 않음)',
    type: StandardErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - users:update 권한 필요',
    type: StandardErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async updateUserRoles(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<UpdateUserRolesResponseDto> {
    const tenantId = request.user.tenantId;
    
    if (dto.add && dto.add.length > 0) {
      await this.usersService.assignRolesToUser(id, tenantId, dto.add);
    }
    
    if (dto.remove && dto.remove.length > 0) {
      await this.usersService.unassignRolesFromUser(id, tenantId, dto.remove);
    }
    
    return { success: true, message: '역할이 수정되었습니다.' };
  }
}
