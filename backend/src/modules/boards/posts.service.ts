import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, DeleteState } from './entities/post.entity';
import { BoardsService } from './boards.service';
import { CreatePostDto } from './dto/post/create-post.dto';
import { UpdatePostDto } from './dto/post/update-post.dto';
import { PostListItemDto } from './dto/post/post-list-item.dto';
import { PostDetailDto } from './dto/post/post-detail.dto';
import { PostListResponseDto } from './dto/post/post-list-response.dto';
import { ResourceNotFoundException } from '../../common/exceptions/base.exception';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly boardsService: BoardsService,
  ) {}

  async create(
    tenantId: number,
    userSeq: number,
    boardId: number,
    dto: CreatePostDto,
  ): Promise<PostDetailDto> {
    // board 존재 + tenant 귀속 검증 (없으면 ResourceNotFoundException)
    await this.boardsService.getBoardById(tenantId, boardId);

    const post = this.postRepository.create({
      boardId,
      tenantId,
      userSeq,
      title: dto.title,
      content: dto.content,
      isNotice: dto.isNotice ?? 0,
      isActive: 1,
      deleteState: DeleteState.N,
      startDtm: dto.startDtm ? new Date(dto.startDtm) : null,
      endDtm: dto.endDtm ? new Date(dto.endDtm) : null,
      deletedAt: null,
    });

    const saved = await this.postRepository.save(post);
    return this.toDetail(saved);
  }

  async findPosts(
    tenantId: number,
    boardId: number,
    page: number,
    limit: number,
  ): Promise<PostListResponseDto> {
    // board 존재 + tenant 귀속 검증
    await this.boardsService.getBoardById(tenantId, boardId);

    // IDX_72f9903e6eebcbeb5e0be069a0 (tenant_id, is_active, is_notice, created_at) 활용
    // IDX_09a47ccdc7a71e08e14c760cf1 (board_id, tenant_id) 활용
    const now = new Date();
    const [posts, totalItems] = await this.postRepository
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.isActive = 1')
      .andWhere('p.deleteState = :deleteState', { deleteState: DeleteState.N })
      .andWhere('p.boardId = :boardId', { boardId })
      .andWhere('(p.startDtm IS NULL OR p.startDtm <= :now)', { now })
      .andWhere('(p.endDtm IS NULL OR p.endDtm >= :now)', { now })
      .orderBy('p.isNotice', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: posts.map((p) => this.toListItem(p)),
      pageInfo: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getPostById(tenantId: number, boardId: number, postId: number): Promise<PostDetailDto> {
    const post = await this.postRepository.findOne({
      where: { postId, boardId, tenantId, deleteState: DeleteState.N },
    });
    if (!post) {
      throw new ResourceNotFoundException(
        `Post not found: postId=${postId}, boardId=${boardId}, tenantId=${tenantId}`,
        '게시글을 찾을 수 없습니다.',
        { postId, boardId, tenantId },
      );
    }
    return this.toDetail(post);
  }

  async updatePost(tenantId: number, boardId: number, postId: number, dto: UpdatePostDto): Promise<PostDetailDto> {
    const post = await this.postRepository.findOne({
      where: { postId, boardId, tenantId, deleteState: DeleteState.N },
    });
    if (!post) {
      throw new ResourceNotFoundException(
        `Post not found: postId=${postId}, boardId=${boardId}, tenantId=${tenantId}`,
        '게시글을 찾을 수 없습니다.',
        { postId, boardId, tenantId },
      );
    }

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.isNotice !== undefined) post.isNotice = dto.isNotice;
    if (dto.isActive !== undefined) post.isActive = dto.isActive;
    if (dto.startDtm !== undefined) post.startDtm = dto.startDtm ? new Date(dto.startDtm) : null;
    if (dto.endDtm !== undefined) post.endDtm = dto.endDtm ? new Date(dto.endDtm) : null;

    const saved = await this.postRepository.save(post);
    return this.toDetail(saved);
  }

  /**
   * 게시글 소프트 삭제
   * - delete_state = 'Y'
   * - deleted_at = NOW()
   * - 물리 삭제 없음, 데이터 보존
   */
  async deletePost(tenantId: number, boardId: number, postId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { postId, boardId, tenantId, deleteState: DeleteState.N },
    });
    if (!post) {
      throw new ResourceNotFoundException(
        `Post not found: postId=${postId}, boardId=${boardId}, tenantId=${tenantId}`,
        '게시글을 찾을 수 없습니다.',
        { postId, boardId, tenantId },
      );
    }

    post.deleteState = DeleteState.Y;
    post.deletedAt = new Date();
    await this.postRepository.save(post);
  }

  private toListItem(post: Post): PostListItemDto {
    return {
      postId: post.postId,
      boardId: post.boardId,
      userSeq: post.userSeq,
      title: post.title,
      isNotice: post.isNotice,
      isActive: post.isActive,
      startDtm: post.startDtm,
      endDtm: post.endDtm,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private toDetail(post: Post): PostDetailDto {
    return {
      postId: post.postId,
      boardId: post.boardId,
      userSeq: post.userSeq,
      title: post.title,
      content: post.content,
      isNotice: post.isNotice,
      isActive: post.isActive,
      startDtm: post.startDtm,
      endDtm: post.endDtm,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
