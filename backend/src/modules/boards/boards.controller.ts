import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { BoardsService } from './boards.service';
import { PostsService } from './posts.service';
import { CreateBoardDto } from './dto/board/create-board.dto';
import { UpdateBoardDto } from './dto/board/update-board.dto';
import { BoardListItemDto } from './dto/board/board-list-item.dto';
import { BoardListResponseDto } from './dto/board/board-list-response.dto';
import { CreatePostDto } from './dto/post/create-post.dto';
import { UpdatePostDto } from './dto/post/update-post.dto';
import { PostListResponseDto } from './dto/post/post-list-response.dto';
import { PostDetailDto } from './dto/post/post-detail.dto';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Boards')
@ApiBearerAuth('JWT')
@Controller('boards')
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly postsService: PostsService,
  ) {}

  // ──────────────────────────────────────────
  // Board CRUD
  // ──────────────────────────────────────────

  @Post()
  @RequireAuth('board_types', 'create')
  @ApiOperation({
    summary: '게시판 생성',
    description: `테넌트 내 게시판을 생성합니다.

**권한:** board_types.create

**제약:**
- \`boardKey\`는 테넌트 내에서 유일해야 합니다
- \`boardKey\`는 slug 형식 (소문자, 숫자, 하이픈만 허용)`,
  })
  @ApiCreatedResponse({ description: '게시판 생성 성공', type: BoardListItemDto })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 (VAL001)', type: StandardErrorResponseDto })
  @ApiConflictResponse({ description: '중복된 boardKey (BIZ001)', type: StandardErrorResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBoardDto,
  ): Promise<BoardListItemDto> {
    const board = await this.boardsService.create(request.user.tenantId, dto);
    return this.boardsService.toBoardDto(board);
  }

  @Get()
  @RequireAuth('board_types', 'read')
  @ApiOperation({
    summary: '게시판 목록 조회',
    description: `테넌트 내 전체 게시판 목록을 정렬 순서대로 조회합니다.

**권한:** board_types.read

**정렬:** 활성(isActive DESC) → sortOrder ASC (null 후순위) → boardId ASC`,
  })
  @ApiOkResponse({ description: '게시판 목록 조회 성공', type: BoardListResponseDto })
  async findBoards(@Req() request: AuthenticatedRequest): Promise<BoardListResponseDto> {
    return this.boardsService.findBoards(request.user.tenantId);
  }

  @Get(':boardId')
  @RequireAuth('board_types', 'read')
  @ApiOperation({
    summary: '게시판 상세 조회',
    description: `특정 게시판의 상세 정보를 조회합니다.

**권한:** board_types.read

**Tenant 격리:** 같은 테넌트 내 게시판만 조회 가능`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiOkResponse({ description: '게시판 상세 조회 성공', type: BoardListItemDto })
  @ApiNotFoundResponse({ description: '게시판 없음 (RES001)', type: StandardErrorResponseDto })
  async getBoard(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
  ): Promise<BoardListItemDto> {
    const board = await this.boardsService.getBoardById(request.user.tenantId, boardId);
    return this.boardsService.toBoardDto(board);
  }

  @Patch(':boardId')
  @RequireAuth('board_types', 'update')
  @ApiOperation({
    summary: '게시판 수정',
    description: `게시판 정보를 수정합니다.

**권한:** board_types.update

**수정 가능 필드:** name, description, sortOrder, isActive`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiOkResponse({ description: '게시판 수정 성공', type: BoardListItemDto })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 (VAL001)', type: StandardErrorResponseDto })
  @ApiNotFoundResponse({ description: '게시판 없음 (RES001)', type: StandardErrorResponseDto })
  async updateBoard(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: UpdateBoardDto,
  ): Promise<BoardListItemDto> {
    const board = await this.boardsService.updateBoard(request.user.tenantId, boardId, dto);
    return this.boardsService.toBoardDto(board);
  }

  @Delete(':boardId')
  @RequireAuth('board_types', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '게시판 비활성화',
    description: `게시판을 비활성화합니다 (\`isActive = 0\`).

⚠️ **물리 삭제가 아닙니다.** 데이터는 보존됩니다.

**권한:** board_types.delete`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiNoContentResponse({ description: '게시판 비활성화 성공' })
  @ApiNotFoundResponse({ description: '게시판 없음 (RES001)', type: StandardErrorResponseDto })
  async deactivateBoard(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
  ): Promise<void> {
    await this.boardsService.deactivateBoard(request.user.tenantId, boardId);
  }

  // ──────────────────────────────────────────
  // Post CRUD: /boards/:boardId/posts
  // ──────────────────────────────────────────

  @Post(':boardId/posts')
  @RequireAuth('boards.posts', 'create')
  @ApiOperation({
    summary: '게시글 생성',
    description: `특정 게시판에 게시글을 생성합니다.

**권한:** boards.posts.create

**검증:**
- boardId가 같은 테넌트 내에 존재해야 합니다
- 작성자(userSeq)는 인증 토큰에서 자동 추출됩니다

**공지글 지정:** \`isNotice: 1\` 설정 시 목록 최상단에 고정됩니다

**게시 기간:** \`startDtm\` / \`endDtm\` 미설정 시 즉시 노출 / 기간 제한 없음`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiCreatedResponse({ description: '게시글 생성 성공', type: PostDetailDto })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 (VAL001)', type: StandardErrorResponseDto })
  @ApiNotFoundResponse({ description: '게시판 없음 (RES001)', type: StandardErrorResponseDto })
  async createPost(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: CreatePostDto,
  ): Promise<PostDetailDto> {
    return this.postsService.create(request.user.tenantId, request.user.userSeq, boardId, dto);
  }

  @Get(':boardId/posts')
  @RequireAuth('boards.posts', 'read')
  @ApiOperation({
    summary: '게시글 목록 조회',
    description: `특정 게시판의 게시글 목록을 조회합니다.

**권한:** boards.posts.read

**조회 조건:**
- \`delete_state = 'N'\` (소프트 삭제 제외)
- \`is_active = 1\`
- \`start_dtm <= NOW() or IS NULL\`
- \`end_dtm >= NOW() or IS NULL\`

**정렬:** 공지글 상단 고정 (\`isNotice DESC\`) → 최신순 (\`createdAt DESC\`)

**인덱스:** \`IDX_72f9903e6eebcbeb5e0be069a0\` (tenant_id, is_active, is_notice, created_at)`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값: 20)', example: 20 })
  @ApiOkResponse({ description: '게시글 목록 조회 성공', type: PostListResponseDto })
  @ApiNotFoundResponse({ description: '게시판 없음 (RES001)', type: StandardErrorResponseDto })
  async findPosts(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PostListResponseDto> {
    return this.postsService.findPosts(request.user.tenantId, boardId, page, limit);
  }

  @Get(':boardId/posts/:postId')
  @RequireAuth('boards.posts', 'read')
  @ApiOperation({
    summary: '게시글 상세 조회',
    description: `게시글 상세 정보를 조회합니다.

**권한:** boards.posts.read

**조회 조건:**
- \`delete_state = 'N'\` (소프트 삭제된 글 제외)
- 같은 테넌트 내 게시글만 조회 가능 (Tenant 격리)`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiParam({ name: 'postId', type: 'integer', description: '게시글 ID' })
  @ApiOkResponse({ description: '게시글 상세 조회 성공', type: PostDetailDto })
  @ApiNotFoundResponse({ description: '게시판 또는 게시글 없음 (RES001)', type: StandardErrorResponseDto })
  async getPost(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<PostDetailDto> {
    return this.postsService.getPostById(request.user.tenantId, boardId, postId);
  }

  @Patch(':boardId/posts/:postId')
  @RequireAuth('boards.posts', 'update')
  @ApiOperation({
    summary: '게시글 수정',
    description: `게시글 내용을 수정합니다.

**권한:** boards.posts.update

**수정 가능 필드:** title, content, isNotice, isActive, startDtm, endDtm

**주의:** 소프트 삭제된 게시글은 수정 불가 (RES001 반환)`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiParam({ name: 'postId', type: 'integer', description: '게시글 ID' })
  @ApiOkResponse({ description: '게시글 수정 성공', type: PostDetailDto })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 (VAL001)', type: StandardErrorResponseDto })
  @ApiNotFoundResponse({ description: '게시판 또는 게시글 없음 (RES001)', type: StandardErrorResponseDto })
  async updatePost(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: UpdatePostDto,
  ): Promise<PostDetailDto> {
    return this.postsService.updatePost(request.user.tenantId, boardId, postId, dto);
  }

  @Delete(':boardId/posts/:postId')
  @RequireAuth('boards.posts', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '게시글 삭제 (소프트 삭제)',
    description: `게시글을 소프트 삭제합니다.

⚠️ **물리 삭제가 아닙니다.** \`delete_state = 'Y'\`, \`deleted_at = NOW()\` 처리됩니다.

**권한:** boards.posts.delete

**삭제 후:** 목록 및 상세 조회에서 제외됩니다`,
  })
  @ApiParam({ name: 'boardId', type: 'integer', description: '게시판 ID' })
  @ApiParam({ name: 'postId', type: 'integer', description: '게시글 ID' })
  @ApiNoContentResponse({ description: '게시글 소프트 삭제 성공' })
  @ApiNotFoundResponse({ description: '게시판 또는 게시글 없음 (RES001)', type: StandardErrorResponseDto })
  async deletePost(
    @Req() request: AuthenticatedRequest,
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<void> {
    await this.postsService.deletePost(request.user.tenantId, boardId, postId);
  }
}
