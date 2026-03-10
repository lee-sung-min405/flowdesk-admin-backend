import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
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
import { PermissionsAdminService } from './permissions-admin.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreatePageDto } from './dto/page/create-page.dto';
import { UpdatePageDto } from './dto/page/update-page.dto';
import { CreateActionDto } from './dto/action/create-action.dto';
import { UpdateActionDto } from './dto/action/update-action.dto';
import { CreatePermissionDto } from './dto/permission/create-permission.dto';
import { UpdatePermissionDto } from './dto/permission/update-permission.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FindActionsResponseDto } from './dto/action/find-actions-response.dto';
import { FindPagesResponseDto } from './dto/page/find-pages-response.dto';
import { FindPermissionsResponseDto } from './dto/permission/find-permissions-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { PageResponseDto } from './dto/page/page-response.dto';
import { ActionResponseDto } from './dto/action/action-response.dto';
import { PermissionResponseDto } from './dto/permission/permission-response.dto';

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

  @Get('pages')
  @RequireAuth('super.pages', 'read')
  @ApiOperation({ 
    summary: '페이지 목록 조회 (슈퍼 관리자 전용)',
    description: `
시스템의 모든 페이지를 조회합니다. RBAC 권한 체계의 기본 단위인 페이지 목록을 관리할 수 있습니다.

**주요 기능:**
- 페이지네이션 지원 (page, limit)
- 검색 기능 (페이지명, 표시명, 설명에서 검색)
- 계층 구조 정렬 (부모 → 자식 순서)
- 다양한 필터링 옵션

**정렬 방식:**
- \`sort=sortOrder\` (기본값): 계층 구조 유지하며 정렬
  - 부모 페이지들을 sortOrder로 정렬
  - 각 부모 바로 아래 자식 페이지들을 sortOrder로 정렬
  - 결과: 부모 → 자식들 → 다음 부모 → 자식들...
- 다른 필드로 정렬 시: 계층 무시하고 해당 필드로 정렬

**응답 데이터:**
- childCount: 자식 페이지 개수
- permissionCount: 해당 페이지의 권한 개수
- parent: 부모 페이지 정보 (최상위 페이지는 null)
    `.trim()
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: '페이지 번호 (기본값: 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: '페이지당 항목 수 (기본값: 20)',
    example: 20
  })
  @ApiQuery({ 
    name: 'q', 
    required: false, 
    type: String, 
    description: '검색어 - 페이지명(pageName), 표시명(displayName), 설명(description)에서 부분 일치 검색',
    example: '관리'
  })
  @ApiQuery({ 
    name: 'parentId', 
    required: false, 
    type: String, 
    description: `부모 페이지 필터
- "all" (기본값): 전체 페이지 조회
- "null": 최상위 페이지만 조회 (parentId가 null인 페이지)
- 숫자: 특정 부모의 자식 페이지만 조회 (예: "1"은 pageId=1의 자식들만)`,
    examples: {
      all: { value: 'all', description: '전체 페이지' },
      topLevel: { value: 'null', description: '최상위 페이지만' },
      children: { value: '1', description: 'pageId=1의 자식 페이지만' }
    }
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Number, 
    description: '활성화 상태 필터 (0: 비활성, 1: 활성)',
    enum: [0, 1],
    example: 1
  })
  @ApiQuery({ 
    name: 'sort', 
    required: false, 
    type: String, 
    description: `정렬 필드 (기본값: sortOrder)
- sortOrder: 계층 구조 유지하며 정렬 (권장)
- pageId: 페이지 ID로 정렬
- pageName: 페이지명으로 정렬
- displayName: 표시명으로 정렬
- isActive: 활성화 상태로 정렬
- childCount: 자식 페이지 수로 정렬
- permissionCount: 권한 개수로 정렬`,
    enum: ['sortOrder', 'pageId', 'pageName', 'displayName', 'isActive', 'childCount', 'permissionCount'],
    example: 'sortOrder'
  })
  @ApiQuery({ 
    name: 'order', 
    required: false, 
    enum: ['ASC', 'DESC'], 
    description: '정렬 순서 (ASC: 오름차순, DESC: 내림차순, 기본값: ASC)',
    example: 'ASC'
  })
  @ApiResponse({
    status: 200,
    description: '페이지 목록 조회 성공',
    type: FindPagesResponseDto,
  })
  async findAllPages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('parentId') parentId: string = 'all',
    @Query('isActive') isActive?: string,
    @Query('sort') sort: string = 'sortOrder',
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ) {
    // parentId 파싱: 'null' 또는 'all'은 그대로, 숫자는 parseInt
    let parsedParentId: number | 'all' | 'null' | undefined = parentId as 'all' | 'null';
    if (parentId && parentId !== 'null' && parentId !== 'all') {
      const numericParentId = parseInt(parentId);
      if (!isNaN(numericParentId)) {
        parsedParentId = numericParentId;
      }
    }

    return this.permissionsAdminService.findAllPages(
      page,
      limit,
      q,
      parsedParentId,
      isActive !== undefined ? parseInt(isActive) : undefined,
      sort,
      order,
    );
  }

  @Get('pages/:id')
  @RequireAuth('super.pages', 'read')
  @ApiOperation({ 
    summary: '페이지 상세 조회 (슈퍼 관리자 전용)',
    description: '특정 페이지의 상세 정보를 조회합니다. 하위 페이지 목록도 함께 반환됩니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '페이지 ID' })
  @ApiResponse({
    status: 200,
    description: '페이지 상세 정보 (하위 페이지 포함)',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '페이지를 찾을 수 없음',
  })
  async findPageById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsAdminService.getPageByIdWithChildren(id);
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

  @Get('actions')
  @RequireAuth('super.actions', 'read')
  @ApiOperation({ 
    summary: '전체 액션 목록 조회',
    description: '페이지네이션, 검색, 필터링, 정렬 기능을 지원하는 액션 목록을 조회합니다.'
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (1부터 시작)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (최대 100)', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: '검색어 - 액션 이름 또는 표시명에서 검색', example: 'read' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (1: 활성, 0: 비활성)', enum: [0, 1] })
  @ApiQuery({ name: 'sort', required: false, description: '정렬 필드', enum: ['actionId', 'actionName', 'displayName', 'isActive', 'permissionCount'], example: 'actionId' })
  @ApiQuery({ name: 'order', required: false, description: '정렬 방향', enum: ['ASC', 'DESC'], example: 'ASC' })
  @ApiResponse({
    status: 200,
    description: '액션 목록 조회 성공',
    type: FindActionsResponseDto,
  })
  async findAllActions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('isActive', new ParseIntPipe({ optional: true })) isActive?: number,
    @Query('sort', new DefaultValuePipe('actionId')) sort?: string,
    @Query('order', new DefaultValuePipe('ASC')) order?: 'ASC' | 'DESC',
  ): Promise<FindActionsResponseDto> {
    return this.permissionsAdminService.findAllActions(page, limit, q, isActive, sort, order);
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

  @Get('permissions')
  @RequireAuth('super.permissions', 'read')
  @ApiOperation({
    summary: '전체 권한 목록 조회 (슈퍼 관리자 전용)',
    description: `
시스템의 모든 권한(페이지 + 액션 조합)을 조회합니다.

**주요 기능:**
- 페이지네이션 지원 (page, limit)
- Like 검색 (권한 표시명, 설명, 페이지명, 액션명에서 검색)
- 페이지별 필터 (pageId)
- 액션별 필터 (actionId)
- 상태별 필터 (isActive)
- 다양한 정렬 옵션

**응답 데이터:**
- page: 연결된 페이지 정보 (pageId, pageName, displayName)
- action: 연결된 액션 정보 (actionId, actionName, displayName)
    `.trim()
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값: 20)', example: 20 })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: '검색어 - 권한 표시명, 설명, 페이지명, 액션명에서 부분 일치 검색',
    example: '조회'
  })
  @ApiQuery({ name: 'pageId', required: false, type: Number, description: '페이지 ID 필터 - 특정 페이지에 연결된 권한만 조회', example: 1 })
  @ApiQuery({ name: 'actionId', required: false, type: Number, description: '액션 ID 필터 - 특정 액션에 연결된 권한만 조회', example: 1 })
  @ApiQuery({ name: 'isActive', required: false, type: Number, description: '활성화 상태 필터 (1: 활성, 0: 비활성)', enum: [0, 1], example: 1 })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: '정렬 필드 (기본값: permissionId)',
    enum: ['permissionId', 'pageId', 'actionId', 'displayName', 'isActive'],
    example: 'permissionId'
  })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: '정렬 순서 (기본값: ASC)', example: 'ASC' })
  @ApiResponse({
    status: 200,
    description: '권한 목록 조회 성공',
    type: FindPermissionsResponseDto,
  })
  async findAllPermissions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('pageId', new ParseIntPipe({ optional: true })) pageId?: number,
    @Query('actionId', new ParseIntPipe({ optional: true })) actionId?: number,
    @Query('isActive', new ParseIntPipe({ optional: true })) isActive?: number,
    @Query('sort', new DefaultValuePipe('permissionId')) sort?: string,
    @Query('order', new DefaultValuePipe('ASC')) order?: 'ASC' | 'DESC',
  ): Promise<FindPermissionsResponseDto> {
    return this.permissionsAdminService.findAllPermissions(page, limit, q, pageId, actionId, isActive, sort, order);
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
