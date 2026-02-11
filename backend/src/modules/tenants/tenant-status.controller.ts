import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
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
import { TenantStatusService } from './tenant-status.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateTenantStatusDto } from './dto/create-tenant-status.dto';
import { UpdateTenantStatusItemDto } from './dto/update-tenant-status-item.dto';
import { UpdateTenantStatusActiveDto } from './dto/update-tenant-status-active.dto';
import { TenantStatusResponseDto, TenantStatusGroupedResponseDto } from './dto/tenant-status-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Tenant Status')
@ApiBearerAuth('JWT')
@Controller('tenants/status')
export class TenantStatusController {
  constructor(private readonly tenantStatusService: TenantStatusService) {}

  @Get()
  @RequireAuth('tenants.status', 'read')
  @ApiOperation({
    summary: '테넌트 커스텀 상태 목록 조회',
    description: `테넌트별로 정의한 커스텀 상태 목록을 statusGroup별로 그룹핑하여 조회합니다.

**권한:** tenants.status.read

**필터링:**
- statusGroup: 상태 그룹별 필터링 (counsel, order, ticket 등)
- isActive: 활성 상태 필터 (0: 비활성, 1: 활성)
- q: 상태명, 상태키, 설명에서 LIKE 검색

**응답 구조:** groups 배열 내 statusGroup별로 items가 묶여서 반환됩니다.

**정렬:** status_group ASC, sort_order ASC, created_at ASC`,
  })
  @ApiQuery({ name: 'statusGroup', required: false, description: '상태 그룹 필터', example: 'counsel' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (0: 비활성, 1: 활성)' })
  @ApiQuery({ name: 'q', required: false, description: '검색어 - 상태명, 상태키, 설명에서 검색', example: '진행' })
  @ApiOkResponse({
    description: '테넌트 상태 목록 조회 성공 (statusGroup별 그룹핑)',
    type: TenantStatusGroupedResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001)',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - tenants.status.read 권한 필요',
    type: StandardErrorResponseDto,
  })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('statusGroup') statusGroup?: string,
    @Query('isActive') isActive?: string,
    @Query('q') q?: string,
  ): Promise<TenantStatusGroupedResponseDto> {
    const isActiveValue = isActive !== undefined ? Number(isActive) : undefined;
    return this.tenantStatusService.findTenantStatuses(
      request.user.tenantId,
      statusGroup,
      isActiveValue,
      q,
    );
  }

  @Get(':id')
  @RequireAuth('tenants.status', 'read')
  @ApiOperation({
    summary: '테넌트 상태 상세 조회',
    description: `특정 테넌트 상태의 상세 정보를 조회합니다.

**권한:** tenants.status.read

**Tenant 격리:** 자신의 테넌트 상태만 조회 가능`,
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 상태 ID (tenant_status_id)' })
  @ApiOkResponse({
    description: '테넌트 상태 조회 성공',
    type: TenantStatusResponseDto,
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
    description: '테넌트 상태를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TenantStatusResponseDto> {
    return this.tenantStatusService.getTenantStatusById(request.user.tenantId, id);
  }

  @Post()
  @RequireAuth('tenants.status', 'create')
  @ApiOperation({
    summary: '테넌트 상태 생성',
    description: `새로운 테넌트 커스텀 상태를 생성합니다.

**권한:** tenants.status.create

**중복 체크:** tenant_id + status_group + status_key 조합이 유니크해야 합니다.

**색상 코드:** HEX 형식 (#RRGGBB)만 허용됩니다.

**상태 키 규칙:** 영문 소문자, 숫자, 언더스코어(_)만 사용 가능`,
  })
  @ApiCreatedResponse({
    description: '테넌트 상태 생성 성공',
    type: TenantStatusResponseDto,
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
    description: '이미 존재하는 상태 키 (BIZ001)',
    type: StandardErrorResponseDto,
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createDto: CreateTenantStatusDto,
  ): Promise<TenantStatusResponseDto> {
    return this.tenantStatusService.createTenantStatus(request.user.tenantId, createDto);
  }

  @Patch(':id')
  @RequireAuth('tenants.status', 'update')
  @ApiOperation({
    summary: '테넌트 상태 수정',
    description: `테넌트 상태 정보를 수정합니다.

**권한:** tenants.status.update

**수정 불가 필드:** tenant_id, status_group, status_key (식별자는 변경 불가)

**수정 가능 필드:** status_name, description, color, sort_order, is_active`,
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 상태 ID (tenant_status_id)' })
  @ApiOkResponse({
    description: '테넌트 상태 수정 성공',
    type: TenantStatusResponseDto,
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
    description: '테넌트 상태를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTenantStatusItemDto,
  ): Promise<TenantStatusResponseDto> {
    return this.tenantStatusService.updateTenantStatus(request.user.tenantId, id, updateDto);
  }

  @Patch(':id/status')
  @RequireAuth('tenants.status', 'update')
  @ApiOperation({
    summary: '테넌트 상태 활성화 여부 변경',
    description: `테넌트 상태를 활성화하거나 비활성화합니다.

**권한:** tenants.status.update`,
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 상태 ID (tenant_status_id)' })
  @ApiOkResponse({
    description: '테넌트 상태 활성화 여부 변경 성공',
    type: TenantStatusResponseDto,
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
    description: '테넌트 상태를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantStatusActiveDto,
  ): Promise<TenantStatusResponseDto> {
    return this.tenantStatusService.updateTenantStatusActive(request.user.tenantId, id, dto.isActive);
  }

  @Delete(':id')
  @RequireAuth('tenants.status', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '테넌트 상태 삭제',
    description: `테넌트 상태를 삭제합니다.

**권한:** tenants.status.delete

**주의:** 
- 삭제된 상태는 복구할 수 없습니다.
- 해당 상태를 사용 중인 데이터가 있다면 참조 무결성 오류가 발생할 수 있습니다.
- 일시적인 비활성화는 PATCH /:id 로 isActive를 0으로 변경하세요.`,
  })
  @ApiParam({ name: 'id', type: Number, description: '테넌트 상태 ID (tenant_status_id)' })
  @ApiNoContentResponse({
    description: '테넌트 상태 삭제 성공',
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
    description: '테넌트 상태를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.tenantStatusService.deleteTenantStatus(request.user.tenantId, id);
  }
}
