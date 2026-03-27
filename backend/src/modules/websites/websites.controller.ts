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
import { WebsitesService } from './websites.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { UpdateWebsiteStatusDto } from './dto/update-website-status.dto';
import { WebsiteResponseDto } from './dto/website-response.dto';
import { WebsiteListResponseDto } from './dto/website-list-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Websites')
@ApiBearerAuth('JWT')
@Controller('websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get()
  @RequireAuth('websites', 'read')
  @ApiOperation({
    summary: '웹사이트 목록 조회',
    description: `테넌트 내 웹사이트 목록을 페이지네이션하여 조회합니다.

**권한:** websites.read

**검색/필터링:**
- q: webCode, webUrl, webTitle, userSeq 필드에서 LIKE 검색
- isActive: 0(비활성) 또는 1(활성) 필터링

**정렬:**
- sort: 정렬 필드 (webCode, webUrl, webTitle, createdAt, updatedAt, isActive)
- order: ASC 또는 DESC`,
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', example: 20 })
  @ApiQuery({ name: 'q', required: false, description: '검색어 (webCode, webUrl, webTitle)' })
  @ApiQuery({ name: 'isActive', required: false, description: '활성 상태 필터 (0: 비활성, 1: 활성)' })
  @ApiQuery({ name: 'sort', required: false, description: '정렬 필드', example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, description: '정렬 순서', enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiOkResponse({
    description: '웹사이트 목록 조회 성공',
    type: WebsiteListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
    type: StandardErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: '권한 없음 (AUTH101) - websites.read 권한 필요',
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
  ): Promise<WebsiteListResponseDto> {
    const result = await this.websitesService.findWebsites(request.user.tenantId, page, limit, q, isActive, sort, order);
    return {
      ...result,
      items: result.items.map((website) => ({
        webCode: website.webCode,
        userSeq: website.userSeq,
        userName: website.user?.userName ?? null,
        webUrl: website.webUrl,
        webTitle: website.webTitle,
        webImg: website.webImg,
        webDesc: website.webDesc,
        webMemo: website.webMemo,
        isActive: website.isActive,
        duplicateAllowAfterDays: website.duplicateAllowAfterDays,
        tenantId: website.tenantId,
        createdAt: website.createdAt,
        updatedAt: website.updatedAt,
      })),
    };
  }

  @Get(':webCode')
  @RequireAuth('websites', 'read')
  @ApiOperation({
    summary: '웹사이트 상세 조회',
    description: `특정 웹사이트의 상세 정보를 조회합니다.

**권한:** websites.read

**Tenant 격리:** 같은 테넌트 내 웹사이트만 조회 가능`,
  })
  @ApiParam({ name: 'webCode', type: String, description: '웹사이트 코드' })
  @ApiOkResponse({
    description: '웹사이트 상세 조회 성공',
    type: WebsiteResponseDto,
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
    description: '웹사이트를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('webCode') webCode: string,
  ): Promise<WebsiteResponseDto> {
    const website = await this.websitesService.getWebsiteDetail(request.user.tenantId, webCode);
    return {
      webCode: website.webCode,
      userSeq: website.userSeq,
      userName: website.user?.userName ?? null,
      webUrl: website.webUrl,
      webTitle: website.webTitle,
      webImg: website.webImg,
      webDesc: website.webDesc,
      webMemo: website.webMemo,
      isActive: website.isActive,
      duplicateAllowAfterDays: website.duplicateAllowAfterDays,
      tenantId: website.tenantId,
      createdAt: website.createdAt,
      updatedAt: website.updatedAt,
    };
  }

  @Post()
  @RequireAuth('websites', 'create')
  @ApiOperation({
    summary: '웹사이트 생성',
    description: `새로운 웹사이트를 생성합니다.

**권한:** websites.create

**Tenant 격리:** 현재 로그인한 사용자의 테넌트에 웹사이트가 생성됩니다.

**중복 체크:** tenant_id + web_code 조합이 유니크해야 합니다.`,
  })
  @ApiCreatedResponse({
    description: '웹사이트 생성 성공',
    type: WebsiteResponseDto,
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
    description: '이미 존재하는 웹사이트 코드 (BIZ001)',
    type: StandardErrorResponseDto,
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createWebsiteDto: CreateWebsiteDto,
  ): Promise<WebsiteResponseDto> {
    return this.websitesService.createWebsite(request.user.tenantId, createWebsiteDto);
  }

  @Patch(':webCode')
  @RequireAuth('websites', 'update')
  @ApiOperation({
    summary: '웹사이트 정보 수정',
    description: `웹사이트 정보를 수정합니다.

**권한:** websites.update

**수정 불가 필드:** webCode (기본키)

**수정 가능 필드:** userSeq, webUrl, webTitle, webImg, webDesc, webMemo, isActive, duplicateAllowAfterDays`,
  })
  @ApiParam({ name: 'webCode', type: String, description: '웹사이트 코드' })
  @ApiOkResponse({
    description: '웹사이트 수정 성공',
    type: WebsiteResponseDto,
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
    description: '웹사이트를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('webCode') webCode: string,
    @Body() updateWebsiteDto: UpdateWebsiteDto,
  ): Promise<WebsiteResponseDto> {
    return this.websitesService.updateWebsite(request.user.tenantId, webCode, updateWebsiteDto);
  }

  @Patch(':webCode/status')
  @RequireAuth('websites', 'update')
  @ApiOperation({
    summary: '웹사이트 상태 변경',
    description: `웹사이트를 활성화하거나 비활성화합니다.

**권한:** websites.update`,
  })
  @ApiParam({ name: 'webCode', type: String, description: '웹사이트 코드' })
  @ApiOkResponse({
    description: '웹사이트 상태 변경 성공',
    type: WebsiteResponseDto,
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
    description: '웹사이트를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('webCode') webCode: string,
    @Body() dto: UpdateWebsiteStatusDto,
  ): Promise<WebsiteResponseDto> {
    return this.websitesService.updateWebsiteStatus(request.user.tenantId, webCode, dto.isActive);
  }

  @Delete(':webCode')
  @RequireAuth('websites', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '웹사이트 삭제',
    description: `웹사이트를 삭제합니다.

**권한:** websites.delete

**주의:** 삭제된 웹사이트는 복구할 수 없습니다.`,
  })
  @ApiParam({ name: 'webCode', type: String, description: '웹사이트 코드' })
  @ApiNoContentResponse({
    description: '웹사이트 삭제 성공',
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
    description: '웹사이트를 찾을 수 없음 (RES001)',
    type: StandardErrorResponseDto,
  })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('webCode') webCode: string,
  ): Promise<void> {
    await this.websitesService.deleteWebsite(request.user.tenantId, webCode);
  }
}
