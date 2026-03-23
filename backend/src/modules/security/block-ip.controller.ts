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
  DefaultValuePipe,
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
import { BlockIpService } from './block-ip.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateBlockIpDto } from './dto/block-ip/create-block-ip.dto';
import { UpdateBlockIpDto } from './dto/block-ip/update-block-ip.dto';
import { BlockIpResponseDto } from './dto/block-ip/block-ip-response.dto';
import { BlockIpListResponseDto } from './dto/list-response.dto';
import { CheckBlockedResponseDto } from './dto/check-blocked-response.dto';
import { BulkCreateBlockIpDto, BulkCreateBlockIpResponseDto } from './dto/block-ip/bulk-create-block-ip.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Security - Block IP')
@ApiBearerAuth('JWT')
@Controller('security/block-ip')
export class BlockIpController {
  constructor(private readonly blockIpService: BlockIpService) {}

  @Get()
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: 'IP 차단 목록 조회',
    description: '테넌트 내 차단된 IP 목록을 페이지네이션, 검색, 필터링 기능과 함께 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (1부터 시작)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (최대 100)', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: '검색어 - IP 주소 또는 차단 사유에서 검색', example: '192.168' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (1: 활성, 0: 비활성)', enum: [0, 1] })
  @ApiOkResponse({ type: BlockIpListResponseDto })
  @ApiUnauthorizedResponse({ type: StandardErrorResponseDto })
  @ApiForbiddenResponse({ type: StandardErrorResponseDto })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('isActive', new ParseIntPipe({ optional: true })) isActive?: number,
  ): Promise<BlockIpListResponseDto> {
    return this.blockIpService.findBlockIps(request.user.tenantId, page, limit, q, isActive);
  }

  @Get('check')
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: 'IP 차단 여부 확인',
    description: '특정 IP가 차단되어 있는지 확인합니다. 활성화된(isActive=1) 차단만 검사합니다. 차단된 경우 차단 사유와 ID를 함께 반환합니다.',
  })
  @ApiQuery({ name: 'ip', required: true, description: '확인할 IP 주소 (IPv4 또는 IPv6)', example: '192.168.1.100' })
  @ApiOkResponse({ type: CheckBlockedResponseDto })
  async checkBlocked(
    @Req() request: AuthenticatedRequest,
    @Query('ip') ip: string,
  ): Promise<CheckBlockedResponseDto> {
    return this.blockIpService.checkBlocked(request.user.tenantId, ip);
  }

  @Get(':id')
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: 'IP 차단 상세 조회',
    description: 'ID로 특정 IP 차단 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '차단 IP ID (dbi_idx)' })
  @ApiOkResponse({ type: BlockIpResponseDto })
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.blockIpService.getBlockIpById(request.user.tenantId, id);
  }

  @Post()
  @RequireAuth('security', 'create')
  @ApiOperation({
    summary: 'IP 차단 등록',
    description: '새로운 IP 주소를 차단 목록에 등록합니다. IPv4와 IPv6 모두 지원합니다. 이미 등록된 IP는 중복 오류가 발생합니다.',
  })
  @ApiCreatedResponse({ type: BlockIpResponseDto })
  @ApiBadRequestResponse({ type: StandardErrorResponseDto })
  @ApiConflictResponse({ type: StandardErrorResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBlockIpDto,
  ) {
    return this.blockIpService.createBlockIp(request.user.tenantId, dto, request.user.userSeq);
  }

  @Post('bulk')
  @RequireAuth('security', 'create')
  @ApiOperation({
    summary: 'IP 대량 차단 등록',
    description: `여러 IP 주소를 한 번에 등록합니다.\n\n**입력 형식:**\n- 줄바꿈(\\n) 또는 쉼표(,)로 구분\n- IPv4와 IPv6 주소 모두 지원\n\n**중복 처리:**\n- 입력값 내 중복은 자동 제거\n- 이미 등록된 IP는 건너뛰고 skippedIps로 반환`,
  })
  @ApiCreatedResponse({ type: BulkCreateBlockIpResponseDto })
  async bulkCreate(
    @Req() request: AuthenticatedRequest,
    @Body() bulkCreateDto: BulkCreateBlockIpDto,
  ): Promise<BulkCreateBlockIpResponseDto> {
    return this.blockIpService.bulkCreateBlockIp(
      request.user.tenantId,
      request.user.userSeq,
      bulkCreateDto.ips,
      bulkCreateDto.reason,
      bulkCreateDto.isActive,
    );
  }

  @Patch(':id')
  @RequireAuth('security', 'update')
  @ApiOperation({
    summary: 'IP 차단 정보 수정',
    description: '기존 IP 차단 정보를 수정합니다. IP 주소, 사유, 활성 상태를 변경할 수 있습니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '차단 IP ID (dbi_idx)' })
  @ApiOkResponse({ type: BlockIpResponseDto })
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlockIpDto,
  ) {
    return this.blockIpService.updateBlockIp(request.user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequireAuth('security', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'IP 차단 삭제',
    description: 'IP 차단 정보를 완전히 삭제합니다. 삭제 후 복구할 수 없으므로, 일시적인 차단 해제는 isActive를 0으로 변경하는 것을 권장합니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '차단 IP ID (dbi_idx)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.blockIpService.deleteBlockIp(request.user.tenantId, id);
  }

}
