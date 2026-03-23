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
import { BlockHpService } from './block-hp.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateBlockHpDto } from './dto/block-hp/create-block-hp.dto';
import { UpdateBlockHpDto } from './dto/block-hp/update-block-hp.dto';
import { BlockHpResponseDto } from './dto/block-hp/block-hp-response.dto';
import { BlockHpListResponseDto } from './dto/list-response.dto';
import { CheckBlockedResponseDto } from './dto/check-blocked-response.dto';
import { BulkCreateBlockHpDto, BulkCreateBlockHpResponseDto } from './dto/block-hp/bulk-create-block-hp.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Security - Block HP')
@ApiBearerAuth('JWT')
@Controller('security/block-hp')
export class BlockHpController {
  constructor(private readonly blockHpService: BlockHpService) {}

  @Get()
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: '휴대폰 차단 목록 조회',
    description: '테넌트 내 차단된 휴대폰 번호 목록을 페이지네이션, 검색, 필터링 기능과 함께 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (1부터 시작)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (최대 100)', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: '검색어 - 휴대폰 번호 또는 차단 사유에서 검색', example: '0101234' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (1: 활성, 0: 비활성)', enum: [0, 1] })
  @ApiOkResponse({ type: BlockHpListResponseDto })
  @ApiUnauthorizedResponse({ type: StandardErrorResponseDto })
  @ApiForbiddenResponse({ type: StandardErrorResponseDto })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('isActive', new ParseIntPipe({ optional: true })) isActive?: number,
  ): Promise<BlockHpListResponseDto> {
    return this.blockHpService.findBlockHps(request.user.tenantId, page, limit, q, isActive);
  }

  @Get('check')
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: '휴대폰 차단 여부 확인',
    description: '특정 휴대폰 번호가 차단되어 있는지 확인합니다. 활성화된(isActive=1) 차단만 검사합니다. 차단된 경우 차단 사유와 ID를 함께 반환합니다.',
  })
  @ApiQuery({ name: 'hp', required: true, description: '확인할 휴대폰 번호 (하이픈 없이 입력 권장)', example: '01012345678' })
  @ApiOkResponse({ type: CheckBlockedResponseDto })
  async checkBlocked(
    @Req() request: AuthenticatedRequest,
    @Query('hp') hp: string,
  ): Promise<CheckBlockedResponseDto> {
    return this.blockHpService.checkBlocked(request.user.tenantId, hp);
  }

  @Get(':id')
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: '휴대폰 차단 상세 조회',
    description: 'ID로 특정 휴대폰 차단 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '차단 휴대폰 ID (dbh_idx)' })
  @ApiOkResponse({ type: BlockHpResponseDto })
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.blockHpService.getBlockHpById(request.user.tenantId, id);
  }

  @Post()
  @RequireAuth('security', 'create')
  @ApiOperation({
    summary: '휴대폰 차단 등록',
    description: '새로운 휴대폰 번호를 차단 목록에 등록합니다. 하이픈 포함/미포함 모두 가능합니다. 이미 등록된 번호는 중복 오류가 발생합니다.',
  })
  @ApiCreatedResponse({ type: BlockHpResponseDto })
  @ApiBadRequestResponse({ type: StandardErrorResponseDto })
  @ApiConflictResponse({ type: StandardErrorResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBlockHpDto,
  ) {
    return this.blockHpService.createBlockHp(request.user.tenantId, dto, request.user.userSeq);
  }

  @Post('bulk')
  @RequireAuth('security', 'create')
  @ApiOperation({
    summary: '휴대폰 대량 차단 등록',
    description: `여러 전화번호를 한 번에 등록합니다.\n\n**입력 형식:**\n- 줄바꿈(\\n) 또는 쉼표(,)로 구분\n- 하이픈(-)은 자동으로 제거됨\n\n**중복 처리:**\n- 입력값 내 중복은 자동 제거\n- 이미 등록된 번호는 건너뛰고 skippedPhones로 반환`,
  })
  @ApiCreatedResponse({ type: BulkCreateBlockHpResponseDto })
  async bulkCreate(
    @Req() request: AuthenticatedRequest,
    @Body() bulkCreateDto: BulkCreateBlockHpDto,
  ): Promise<BulkCreateBlockHpResponseDto> {
    return this.blockHpService.bulkCreateBlockHp(
      request.user.tenantId,
      request.user.userSeq,
      bulkCreateDto.phones,
      bulkCreateDto.reason,
      bulkCreateDto.isActive,
    );
  }

  @Patch(':id')
  @RequireAuth('security', 'update')
  @ApiOperation({
    summary: '휴대폰 차단 정보 수정',
    description: '기존 휴대폰 차단 정보를 수정합니다. 전화번호, 사유, 활성 상태를 변경할 수 있습니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '차단 휴대폰 ID (dbh_idx)' })
  @ApiOkResponse({ type: BlockHpResponseDto })
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlockHpDto,
  ) {
    return this.blockHpService.updateBlockHp(request.user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequireAuth('security', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '휴대폰 차단 삭제',
    description: '휴대폰 차단 정보를 완전히 삭제합니다. 삭제 후 복구할 수 없으므로, 일시적인 차단 해제는 isActive를 0으로 변경하는 것을 권장합니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '차단 휴대폰 ID (dbh_idx)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.blockHpService.deleteBlockHp(request.user.tenantId, id);
  }

}
