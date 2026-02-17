import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { RolesService } from './roles.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRoleStatusDto } from './dto/update-role-status.dto';
import { ModifyPermissionsDto } from './dto/modify-permissions.dto';
import { CopyPermissionsDto } from './dto/copy-permissions.dto';
import { FindRolesResponseDto } from './dto/find-roles-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { RoleResponseDto, RoleDetailResponseDto, RolePermissionResponseDto, RoleUserResponseDto } from './dto/role-response.dto';
import { ModifyPermissionsResponseDto } from './dto/modify-permissions-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Roles')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({
  description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
  type: StandardErrorResponseDto,
})
@ApiForbiddenResponse({
  description: '권한 없음 (AUTH101) - roles 권한 필요',
  type: StandardErrorResponseDto,
})
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequireAuth('roles', 'read')
  @ApiOperation({ 
    summary: '역할 목록 조회', 
    description: `현재 로그인한 사용자의 테넌트에 속한 역할 목록을 조회합니다.

**필터링:**
- q: 검색어 (roleName, displayName, description에서 검색)
- isActive: 활성 상태 (1: 활성, 0: 비활성)

**정렬:**
- sort: 정렬 필드 (roleId, roleName, displayName, createdAt, updatedAt)
- order: 정렬 순서 (ASC, DESC)

**페이지네이션:**
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 항목 수 (기본값: 20)

**응답:**
- items: 역할 목록 (userCount, permissionCount 포함)
- pageInfo: 페이지네이션 정보` 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값: 20)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: '검색어' })
  @ApiQuery({ name: 'isActive', required: false, type: Number, enum: [0, 1], description: '활성 상태' })
  @ApiQuery({ name: 'sort', required: false, type: String, enum: ['roleId', 'roleName', 'displayName', 'createdAt', 'updatedAt'], description: '정렬 필드' })
  @ApiQuery({ name: 'order', required: false, type: String, enum: ['ASC', 'DESC'], description: '정렬 순서' })
  @ApiResponse({
    status: 200,
    description: '역할 목록 조회 성공',
    type: FindRolesResponseDto,
  })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('q') q?: string,
    @Query('isActive') isActive?: number,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.rolesService.findRoles(
      request.user.tenantId,
      page,
      limit,
      q,
      isActive,
      sort,
      order,
    );
  }

  @Get(':id')
  @RequireAuth('roles', 'read')
  @ApiOperation({ summary: '역할 상세 조회' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '역할 상세 정보 (권한 포함)',
    type: RoleDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '역할을 찾을 수 없음',
  })
  async findById(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.rolesService.getRoleByIdWithPermissions(id, request.user.tenantId);
  }

  @Post()
  @RequireAuth('roles', 'create')
  @ApiOperation({ summary: '새 역할 생성' })
  @ApiResponse({
    status: 201,
    description: '역할 생성 성공',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 중복된 역할 이름)',
  })
  async create(@Req() request: AuthenticatedRequest, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto, request.user.tenantId);
  }

  @Patch(':id')
  @RequireAuth('roles', 'update')
  @ApiOperation({ summary: '역할 정보 수정' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '역할 수정 성공',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '역할을 찾을 수 없음',
  })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, request.user.tenantId, dto);
  }

  @Patch(':id/status')
  @RequireAuth('roles', 'update')
  @ApiOperation({ summary: '역할 상태 변경 (활성화/비활성화)' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '역할 상태 변경 성공',
    type: RoleResponseDto,
  })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleStatusDto,
  ) {
    return this.rolesService.updateRoleStatus(id, request.user.tenantId, dto.isActive);
  }

  @Delete(':id')
  @RequireAuth('roles', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '역할 삭제' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 204,
    description: '역할 삭제 성공',
  })
  @ApiResponse({
    status: 400,
    description: '사용자에게 할당된 역할은 삭제할 수 없음',
  })
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    await this.rolesService.deleteRole(id, request.user.tenantId);
  }

  @Put(':id/permissions')
  @RequireAuth('roles', 'update')
  @ApiOperation({ 
    summary: '다른 역할의 권한 복사', 
    description: '원본 역할(sourceRoleId)의 권한을 대상 역할로 복사합니다. 대상 역할의 기존 권한은 모두 제거되고 원본 역할의 권한으로 대체됩니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '권한을 받을 대상 역할 ID' })
  @ApiResponse({
    status: 200,
    description: '권한 복사 성공',
    type: RoleDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '대상 역할 또는 원본 역할을 찾을 수 없음',
  })
  @ApiResponse({
    status: 400,
    description: '원본 역할에 할당된 권한이 없음',
  })
  async copyPermissions(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CopyPermissionsDto,
  ) {
    return this.rolesService.copyRolePermissions(id, request.user.tenantId, dto.sourceRoleId);
  }

  @Patch(':id/permissions')
  @RequireAuth('roles', 'update')
  @ApiOperation({ 
    summary: '역할의 권한 추가/제거 (증분 업데이트)', 
    description: '명시된 권한만 추가하거나 제거합니다. PATCH 의미론에 따라 부분 업데이트를 수행합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '권한 수정 성공 - 추가/제거된 권한 정보 반환',
    type: ModifyPermissionsResponseDto,
  })
  async modifyPermissions(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifyPermissionsDto,
  ) {
    return this.rolesService.modifyRolePermissions(
      id,
      request.user.tenantId,
      dto.add || [],
      dto.remove || [],
    );
  }
}

