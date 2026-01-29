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
import { TenantsService } from './tenants.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';

@ApiTags('Tenants (슈퍼 관리자 전용)')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({
  description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
  type: StandardErrorResponseDto,
})
@ApiForbiddenResponse({
  description: '권한 없음 (AUTH101) - super.tenants 권한 필요 (슈퍼 관리자 전용)',
  type: StandardErrorResponseDto,
})
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @RequireAuth('super.tenants', 'read')
  @ApiOperation({ 
    summary: '전체 테넌트 목록 조회 (슈퍼 관리자 전용)',
    description: '슈퍼 관리자(시스템 테넌트)가 시스템의 모든 테넌트를 조회합니다.'
  })
  @ApiResponse({
    status: 200,
    description: '테넌트 목록 조회 성공',
    type: [TenantResponseDto],
  })
  async findAll() {
    return this.tenantsService.findAllTenants();
  }

  @Get(':id')
  @RequireAuth('super.tenants', 'read')
  @ApiOperation({ 
    summary: '테넌트 상세 조회 (슈퍼 관리자 전용)',
    description: '특정 테넌트의 상세 정보를 조회합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 ID' })
  @ApiResponse({
    status: 200,
    description: '테넌트 상세 정보',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '테넌트를 찾을 수 없음',
  })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findTenantById(id);
  }

  @Post()
  @RequireAuth('super.tenants', 'create')
  @ApiOperation({ 
    summary: '새 테넌트 생성 (슈퍼 관리자 전용)',
    description: '새로운 테넌트(회사/조직)를 시스템에 생성합니다.'
  })
  @ApiResponse({
    status: 201,
    description: '테넌트 생성 성공',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (예: 중복된 테넌트 이름)',
  })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Patch(':id')
  @RequireAuth('super.tenants', 'update')
  @ApiOperation({ 
    summary: '테넌트 정보 수정 (슈퍼 관리자 전용)',
    description: '테넌트의 이름, 표시명, 도메인 등을 수정합니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 ID' })
  @ApiResponse({
    status: 200,
    description: '테넌트 수정 성공',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '테넌트를 찾을 수 없음',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(id, dto);
  }

  @Patch(':id/status')
  @RequireAuth('super.tenants', 'update')
  @ApiOperation({ 
    summary: '테넌트 상태 변경 (슈퍼 관리자 전용)',
    description: '테넌트를 활성화하거나 비활성화합니다. 비활성화된 테넌트의 사용자는 로그인할 수 없습니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 ID' })
  @ApiResponse({
    status: 200,
    description: '테넌트 상태 변경 성공',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '테넌트를 찾을 수 없음',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.tenantsService.updateTenantStatus(id, dto.isActive);
  }

  @Delete(':id')
  @RequireAuth('super.tenants', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: '테넌트 삭제 (슈퍼 관리자 전용)',
    description: '테넌트를 삭제합니다. 사용자가 있는 테넌트는 삭제할 수 없습니다.'
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 ID' })
  @ApiResponse({
    status: 204,
    description: '테넌트 삭제 성공',
  })
  @ApiResponse({
    status: 400,
    description: '사용자가 있는 테넌트는 삭제할 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '테넌트를 찾을 수 없음',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.tenantsService.deleteTenant(id);
  }
}
