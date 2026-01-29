import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { PermissionsAdminService } from './permissions-admin.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { PageResponseDto, ActionResponseDto, PermissionResponseDto } from './dto/page-response.dto';

@ApiTags('Permissions Admin (슈퍼 관리자 전용)')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({
  description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
  type: StandardErrorResponseDto,
})
@ApiForbiddenResponse({
  description: '권한 없음 (AUTH101) - super.pages/super.actions/super.permissions 권한 필요 (슈퍼 관리자 전용)',
  type: StandardErrorResponseDto,
})
@Controller('permissions/admin')
export class PermissionsAdminController {
  constructor(private readonly permissionsAdminService: PermissionsAdminService) {}

  // =====================
  // Pages (슈퍼 관리자 전용)
  // =====================
  @Get('pages')
  @RequireAuth('super.pages', 'read')
  @ApiOperation({ 
    summary: '전체 페이지 목록 조회 (슈퍼 관리자 전용)',
    description: '시스템의 모든 페이지를 조회합니다. 페이지는 권한 체계의 기본 단위입니다.'
  })
  @ApiResponse({
    status: 200,
    description: '페이지 목록 조회 성공',
    type: [PageResponseDto],
  })
  async findAllPages() {
    return this.permissionsAdminService.findAllPages();
  }

  @Get('pages/:id')
  @RequireAuth('super.pages', 'read')
  @ApiOperation({ 
    summary: '페이지 상세 조회 (슈퍼 관리자 전용)',
    description: '특정 페이지의 상세 정보를 조회합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '페이지 ID' })
  @ApiResponse({
    status: 200,
    description: '페이지 상세 정보',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '페이지를 찾을 수 없음',
  })
  async findPageById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsAdminService.getPageById(id);
  }

  @Post('pages')
  @RequireAuth('super.pages', 'create')
  @ApiOperation({ summary: '새 페이지 생성' })
  @ApiResponse({
    status: 201,
    description: '페이지 생성 성공',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 중복된 페이지 이름)',
  })
  async createPage(@Body() dto: CreatePageDto) {
    return this.permissionsAdminService.createPage(dto);
  }

  @Patch('pages/:id')
  @RequireAuth('super.pages', 'update')
  @ApiOperation({ summary: '페이지 정보 수정' })
  @ApiParam({ name: 'id', type: Number, description: '페이지 ID' })
  @ApiResponse({
    status: 200,
    description: '페이지 수정 성공',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '페이지를 찾을 수 없음',
  })
  async updatePage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePageDto,
  ) {
    return this.permissionsAdminService.updatePage(id, dto);
  }

  @Patch('pages/:id/status')
  @RequireAuth('super.pages', 'update')
  @ApiOperation({ summary: '페이지 상태 변경 (활성화/비활성화)' })
  @ApiParam({ name: 'id', type: Number, description: '페이지 ID' })
  @ApiResponse({
    status: 200,
    description: '페이지 상태 변경 성공',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '페이지를 찾을 수 없음',
  })
  async updatePageStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.permissionsAdminService.updatePageStatus(id, dto.isActive);
  }

  @Delete('pages/:id')
  @RequireAuth('super.pages', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '페이지 삭제' })
  @ApiParam({ name: 'id', type: Number, description: '페이지 ID' })
  @ApiResponse({
    status: 204,
    description: '페이지 삭제 성공',
  })
  @ApiResponse({
    status: 400,
    description: '하위 페이지나 권한이 있는 페이지는 삭제할 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '페이지를 찾을 수 없음',
  })
  async deletePage(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsAdminService.deletePage(id);
  }

  // =====================
  // Actions
  // =====================
  @Get('actions')
  @RequireAuth('super.actions', 'read')
  @ApiOperation({ summary: '전체 액션 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '액션 목록 조회 성공',
    type: [ActionResponseDto],
  })
  async findAllActions() {
    return this.permissionsAdminService.findAllActions();
  }

  @Get('actions/:id')
  @RequireAuth('super.actions', 'read')
  @ApiOperation({ summary: '액션 상세 조회' })
  @ApiParam({ name: 'id', type: Number, description: '액션 ID' })
  @ApiResponse({
    status: 200,
    description: '액션 상세 정보',
    type: ActionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '액션을 찾을 수 없음',
  })
  async findActionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsAdminService.getActionById(id);
  }

  @Post('actions')
  @RequireAuth('super.actions', 'create')
  @ApiOperation({ summary: '새 액션 생성' })
  @ApiResponse({
    status: 201,
    description: '액션 생성 성공',
    type: ActionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 중복된 액션 이름)',
  })
  async createAction(@Body() dto: CreateActionDto) {
    return this.permissionsAdminService.createAction(dto);
  }

  @Patch('actions/:id')
  @RequireAuth('super.actions', 'update')
  @ApiOperation({ summary: '액션 정보 수정' })
  @ApiParam({ name: 'id', type: Number, description: '액션 ID' })
  @ApiResponse({
    status: 200,
    description: '액션 수정 성공',
    type: ActionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '액션을 찾을 수 없음',
  })
  async updateAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActionDto,
  ) {
    return this.permissionsAdminService.updateAction(id, dto);
  }

  @Patch('actions/:id/status')
  @RequireAuth('super.actions', 'update')
  @ApiOperation({ summary: '액션 상태 변경 (활성화/비활성화)' })
  @ApiParam({ name: 'id', type: Number, description: '액션 ID' })
  @ApiResponse({
    status: 200,
    description: '액션 상태 변경 성공',
    type: ActionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '액션을 찾을 수 없음',
  })
  async updateActionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.permissionsAdminService.updateActionStatus(id, dto.isActive);
  }

  @Delete('actions/:id')
  @RequireAuth('super.actions', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '액션 삭제' })
  @ApiParam({ name: 'id', type: Number, description: '액션 ID' })
  @ApiResponse({
    status: 204,
    description: '액션 삭제 성공',
  })
  @ApiResponse({
    status: 400,
    description: '권한이 연결된 액션은 삭제할 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '액션을 찾을 수 없음',
  })
  async deleteAction(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsAdminService.deleteAction(id);
  }

  // =====================
  // Permissions
  // =====================
  @Get('permissions')
  @RequireAuth('super.permissions', 'read')
  @ApiOperation({ summary: '전체 권한 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '권한 목록 조회 성공',
    type: [PermissionResponseDto],
  })
  async findAllPermissions() {
    return this.permissionsAdminService.findAllPermissions();
  }

  @Get('permissions/:id')
  @RequireAuth('super.permissions', 'read')
  @ApiOperation({ summary: '권한 상세 조회' })
  @ApiParam({ name: 'id', type: Number, description: '권한 ID' })
  @ApiResponse({
    status: 200,
    description: '권한 상세 정보',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '권한을 찾을 수 없음',
  })
  async findPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsAdminService.getPermissionById(id);
  }

  @Post('permissions')
  @RequireAuth('super.permissions', 'create')
  @ApiOperation({ summary: '새 권한 생성' })
  @ApiResponse({
    status: 201,
    description: '권한 생성 성공',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 중복된 권한)',
  })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionsAdminService.createPermission(dto);
  }

  @Patch('permissions/:id')
  @RequireAuth('super.permissions', 'update')
  @ApiOperation({ summary: '권한 정보 수정' })
  @ApiParam({ name: 'id', type: Number, description: '권한 ID' })
  @ApiResponse({
    status: 200,
    description: '권한 수정 성공',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '권한을 찾을 수 없음',
  })
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsAdminService.updatePermission(id, dto);
  }

  @Patch('permissions/:id/status')
  @RequireAuth('super.permissions', 'update')
  @ApiOperation({ summary: '권한 상태 변경 (활성화/비활성화)' })
  @ApiParam({ name: 'id', type: Number, description: '권한 ID' })
  @ApiResponse({
    status: 200,
    description: '권한 상태 변경 성공',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '권한을 찾을 수 없음',
  })
  async updatePermissionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.permissionsAdminService.updatePermissionStatus(id, dto.isActive);
  }

  @Delete('permissions/:id')
  @RequireAuth('super.permissions', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '권한 삭제' })
  @ApiParam({ name: 'id', type: Number, description: '권한 ID' })
  @ApiResponse({
    status: 204,
    description: '권한 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '권한을 찾을 수 없음',
  })
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsAdminService.deletePermission(id);
  }
}
