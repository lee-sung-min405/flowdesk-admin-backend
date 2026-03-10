import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { CreateBoardDto } from './dto/board/create-board.dto';
import { UpdateBoardDto } from './dto/board/update-board.dto';
import { BoardListItemDto } from './dto/board/board-list-item.dto';
import { BoardListResponseDto } from './dto/board/board-list-response.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async create(tenantId: number, dto: CreateBoardDto): Promise<Board> {
    const exists =
      (await this.boardRepository
        .createQueryBuilder('b')
        .where('b.tenantId = :tenantId', { tenantId })
        .andWhere('b.boardKey = :boardKey', { boardKey: dto.boardKey })
        .getCount()) > 0;

    if (exists) {
      throw new BusinessConflictException(
        `Board key already exists: tenantId=${tenantId}, boardKey=${dto.boardKey}`,
        `이미 사용 중인 게시판 키입니다: ${dto.boardKey}`,
        { tenantId, boardKey: dto.boardKey },
      );
    }

    const board = this.boardRepository.create({
      tenantId,
      boardKey: dto.boardKey,
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? null,
      isActive: 1,
    });

    return this.boardRepository.save(board);
  }

  async findBoards(tenantId: number): Promise<BoardListResponseDto> {
    // IDX_afcb662bfddd83f3ed926a8429 (tenant_id, is_active, sort_order) 활용
    const boards = await this.boardRepository
      .createQueryBuilder('b')
      .where('b.tenantId = :tenantId', { tenantId })
      .orderBy('b.isActive', 'DESC')
      .addOrderBy('CASE WHEN b.sort_order IS NULL THEN 1 ELSE 0 END', 'ASC')
      .addOrderBy('b.sortOrder', 'ASC')
      .addOrderBy('b.boardId', 'ASC')
      .getMany();

    return { items: boards.map((b) => this.toBoardDto(b)) };
  }

  async getBoardById(tenantId: number, boardId: number): Promise<Board> {
    // IDX_add1595932585efab539b5fc68 (board_id, tenant_id) 활용
    const board = await this.boardRepository.findOne({ where: { boardId, tenantId } });
    if (!board) {
      throw new ResourceNotFoundException(
        `Board not found: boardId=${boardId}, tenantId=${tenantId}`,
        '게시판을 찾을 수 없습니다.',
        { boardId, tenantId },
      );
    }
    return board;
  }

  async updateBoard(tenantId: number, boardId: number, dto: UpdateBoardDto): Promise<Board> {
    const board = await this.getBoardById(tenantId, boardId);

    if (dto.name !== undefined) board.name = dto.name;
    if (dto.description !== undefined) board.description = dto.description;
    if (dto.sortOrder !== undefined) board.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) board.isActive = dto.isActive;

    return this.boardRepository.save(board);
  }

  /**
   * 게시판 비활성화 (소프트 삭제 - isActive = 0)
   * 물리 삭제 없음, 데이터 보존
   */
  async deactivateBoard(tenantId: number, boardId: number): Promise<void> {
    const board = await this.getBoardById(tenantId, boardId);
    board.isActive = 0;
    await this.boardRepository.save(board);
  }

  toBoardDto(board: Board): BoardListItemDto {
    return {
      boardId: board.boardId,
      boardKey: board.boardKey,
      name: board.name,
      description: board.description,
      isActive: board.isActive,
      sortOrder: board.sortOrder,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}
