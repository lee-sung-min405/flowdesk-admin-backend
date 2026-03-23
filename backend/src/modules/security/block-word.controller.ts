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
import { BlockWordService } from './block-word.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateBlockWordDto } from './dto/block-word/create-block-word.dto';
import { UpdateBlockWordDto } from './dto/block-word/update-block-word.dto';
import { BlockWordResponseDto } from './dto/block-word/block-word-response.dto';
import { BlockWordListResponseDto } from './dto/list-response.dto';
import { CheckBlockedResponseDto } from './dto/check-blocked-response.dto';
import { BulkCreateBlockWordDto, BulkCreateBlockWordResponseDto } from './dto/block-word/bulk-create-block-word.dto';
import { MatchType } from './entities/block-word.entity';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Security - Block Word')
@ApiBearerAuth('JWT')
@Controller('security/block-word')
export class BlockWordController {
  constructor(private readonly blockWordService: BlockWordService) {}

  @Get()
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: '금칙어 목록 조회',
    description: '테넌트 내 등록된 금칙어 목록을 페이지네이션, 검색, 필터링 기능과 함께 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (1부터 시작)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (최대 100)', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: '검색어 - 금칙어 또는 차단 사유에서 검색', example: '욕설' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (1: 활성, 0: 비활성)', enum: [0, 1] })
  @ApiQuery({ name: 'matchType', required: false, enum: MatchType, description: '매칭 타입 필터 (EXACT: 정확히 일치, CONTAINS: 포함, REGEX: 정규식)' })
  @ApiOkResponse({ type: BlockWordListResponseDto })
  @ApiUnauthorizedResponse({ type: StandardErrorResponseDto })
  @ApiForbiddenResponse({ type: StandardErrorResponseDto })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('isActive', new ParseIntPipe({ optional: true })) isActive?: number,
    @Query('matchType') matchType?: MatchType,
  ): Promise<BlockWordListResponseDto> {
    return this.blockWordService.findBlockWords(request.user.tenantId, page, limit, q, isActive, matchType);
  }

  @Get('check')
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: '금칙어 차단 여부 확인',
    description: `입력된 텍스트에 금칙어가 포함되어 있는지 확인합니다.\n\n**검사 방식:**\n- 활성화된(isActive=1) 금칙어만 검사\n- EXACT, CONTAINS, REGEX 모든 매칭 타입을 순차적으로 검사\n- 첫 번째 매칭되는 금칙어 정보 반환\n\n**반환 정보:**\n- 차단된 경우: 차단 사유, ID, 매칭된 단어`,
  })
  @ApiQuery({ name: 'text', required: true, description: '확인할 텍스트 (사용자 입력값, 메시지 내용 등)', example: '이것은 테스트 문장입니다' })
  @ApiOkResponse({ type: CheckBlockedResponseDto })
  async checkBlocked(
    @Req() request: AuthenticatedRequest,
    @Query('text') text: string,
  ): Promise<CheckBlockedResponseDto> {
    return this.blockWordService.checkBlocked(request.user.tenantId, text);
  }

  @Get(':id')
  @RequireAuth('security', 'read')
  @ApiOperation({
    summary: '금칙어 상세 조회',
    description: 'ID로 특정 금칙어 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '금칙어 ID (dbw_idx)' })
  @ApiOkResponse({ type: BlockWordResponseDto })
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.blockWordService.getBlockWordById(request.user.tenantId, id);
  }

  @Post()
  @RequireAuth('security', 'create')
  @ApiOperation({
    summary: '금칙어 등록',
    description: `새로운 금칙어를 등록합니다.\n\n**매칭 타입 설명:**\n- **EXACT**: 텍스트가 단어와 정확히 일치할 때만 차단\n- **CONTAINS**: 텍스트에 단어가 포함되면 차단 (가장 일반적)\n- **REGEX**: 정규표현식 패턴으로 복잡한 매칭 (변형된 욕설 등)\n\n같은 matchType과 단어 조합이 이미 등록되어 있으면 중복 오류가 발생합니다.`,
  })
  @ApiCreatedResponse({ type: BlockWordResponseDto })
  @ApiBadRequestResponse({ type: StandardErrorResponseDto })
  @ApiConflictResponse({ type: StandardErrorResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBlockWordDto,
  ) {
    return this.blockWordService.createBlockWord(request.user.tenantId, dto, request.user.userSeq);
  }
  @Post('bulk')
  @RequireAuth('security', 'create')
  @ApiOperation({
    summary: '금칙어 대량 차단 등록',
    description: `여러 금칙어를 한 번에 등록합니다.\n\n**입력 형식:**\n- 줄바꿈(\\n) 또는 쉼표(,)로 구분\n- 모든 단어에 동일한 matchType 적용\n\n**중복 처리:**\n- 입력값 내 중복은 자동 제거\n- 같은 matchType과 단어 조합이 이미 등록되어 있으면 건너뛰고 skippedWords로 반환`,
  })
  @ApiCreatedResponse({ type: BulkCreateBlockWordResponseDto })
  async bulkCreate(
    @Req() request: AuthenticatedRequest,
    @Body() bulkCreateDto: BulkCreateBlockWordDto,
  ): Promise<BulkCreateBlockWordResponseDto> {
    return this.blockWordService.bulkCreateBlockWord(
      request.user.tenantId,
      request.user.userSeq,
      bulkCreateDto.words,
      bulkCreateDto.matchType,
      bulkCreateDto.reason,
      bulkCreateDto.isActive,
    );
  }
  @Patch(':id')
  @RequireAuth('security', 'update')
  @ApiOperation({
    summary: '금칙어 정보 수정',
    description: '기존 금칙어 정보를 수정합니다. 매칭 타입, 사유, 활성 상태를 변경할 수 있습니다. (단어 자체는 수정 불가)',
  })
  @ApiParam({ name: 'id', type: Number, description: '금칙어 ID (dbw_idx)' })
  @ApiOkResponse({ type: BlockWordResponseDto })
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlockWordDto,
  ) {
    return this.blockWordService.updateBlockWord(request.user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequireAuth('security', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '금칙어 삭제',
    description: '금칙어를 완전히 삭제합니다. 삭제 후 복구할 수 없으므로, 일시적인 차단 해제는 isActive를 0으로 변경하는 것을 권장합니다.',
  })
  @ApiParam({ name: 'id', type: Number, description: '금칙어 ID (dbw_idx)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: StandardErrorResponseDto })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.blockWordService.deleteBlockWord(request.user.tenantId, id);
  }

}
