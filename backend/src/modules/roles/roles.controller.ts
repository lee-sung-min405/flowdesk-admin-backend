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
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { RolesService } from './roles.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { RoleResponseDto, RoleDetailResponseDto, RolePermissionResponseDto, RoleUserResponseDto } from './dto/role-response.dto';
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

  // =====================
  // Role CRUD
  // =====================
  @Get()
  @RequireAuth('roles', 'read')
  @ApiOperation({ summary: '역할 목록 조회', description: '현재 로그인한 사용자의 테넌트에 속한 역할 목록을 조회합니다.' })
  @ApiResponse({
    status: 200,
    description: '역할 목록 조회 성공',
    type: [RoleResponseDto],
  })
  async findAll(@Req() request: AuthenticatedRequest) {
    const tenantId = request.user.tenantId;
    return this.rolesService.findRoles(tenantId);
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
    return this.rolesService.getRoleById(id, request.user.tenantId);
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
    @Body('isActive') isActive: boolean,
  ) {
    return this.rolesService.updateRoleStatus(id, request.user.tenantId, isActive);
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

  // =====================
  // Role-Permission 관리
  // =====================
  @Get(':id/permissions')
  @RequireAuth('roles', 'read')
  @ApiOperation({ summary: '역할의 권한 목록 조회' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '역할의 권한 목록',
    type: [RolePermissionResponseDto],
  })
  async getPermissions(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.rolesService.getRolePermissions(id, request.user.tenantId);
  }

  @Put(':id/permissions')
  @RequireAuth('roles', 'update')
  @ApiOperation({ summary: '역할에 권한 할당 (기존 권한 대체)' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '권한 할당 성공',
    type: [RolePermissionResponseDto],
  })
  async assignPermissions(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignRolePermissions(id, request.user.tenantId, dto.permissionIds);
  }

  // =====================
  // User-Role 관리
  // =====================
  @Get(':id/users')
  @RequireAuth('roles', 'read')
  @ApiOperation({ summary: '역할이 할당된 사용자 목록 조회' })
  @ApiParam({ name: 'id', type: Number, description: '역할 ID' })
  @ApiResponse({
    status: 200,
    description: '역할이 할당된 사용자 목록',
    type: [RoleUserResponseDto],
  })
  async getRoleUsers(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.rolesService.getRoleUsers(id, request.user.tenantId);
  }

  @Post('users/:userSeq/assign')
  @RequireAuth('roles', 'update')
  @ApiOperation({ summary: '사용자에게 역할 여러 개 배정' })
  @ApiParam({ name: 'userSeq', type: Number, description: '사용자 Seq' })
  @ApiResponse({ status: 200, description: '역할 배정 성공' })
  async assignRolesToUser(
    @Req() request: AuthenticatedRequest,
    @Param('userSeq', ParseIntPipe) userSeq: number,
    @Body() dto: import('./dto/assign-roles-to-user.dto').AssignRolesToUserDto,
  ) {
    await this.rolesService.assignRolesToUser(userSeq, request.user.tenantId, dto.roleIds);
    return { success: true };
  }

  @Post('users/:userSeq/unassign')
  @RequireAuth('roles', 'update')
  @ApiOperation({ summary: '사용자에게서 역할 여러 개 해제' })
  @ApiParam({ name: 'userSeq', type: Number, description: '사용자 Seq' })
  @ApiResponse({ status: 200, description: '역할 해제 성공' })
  async unassignRolesFromUser(
    @Req() request: AuthenticatedRequest,
    @Param('userSeq', ParseIntPipe) userSeq: number,
    @Body() dto: import('./dto/assign-roles-to-user.dto').AssignRolesToUserDto,
  ) {
    await this.rolesService.unassignRolesFromUser(userSeq, request.user.tenantId, dto.roleIds);
    return { success: true };
  }
}

