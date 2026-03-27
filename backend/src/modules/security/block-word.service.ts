import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BlockWord, MatchType } from './entities/block-word.entity';
import { CreateBlockWordDto } from './dto/block-word/create-block-word.dto';
import { UpdateBlockWordDto } from './dto/block-word/update-block-word.dto';
import { BlockWordListResponseDto } from './dto/list-response.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class BlockWordService {
  constructor(
    @InjectRepository(BlockWord)
    private readonly blockWordRepository: Repository<BlockWord>,
  ) {}

  async findBlockWords(
    tenantId: number,
    page?: number,
    limit?: number,
    q?: string,
    isActive?: number,
    matchType?: MatchType,
  ): Promise<BlockWordListResponseDto> {
    const queryBuilder = this.blockWordRepository
      .createQueryBuilder('blockWord')
      .where('blockWord.tenantId = :tenantId', { tenantId });

    if (q) {
      queryBuilder.andWhere(
        '(blockWord.blockWord LIKE :q OR blockWord.reason LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('blockWord.isActive = :isActive', { isActive });
    }

    if (matchType) {
      queryBuilder.andWhere('blockWord.matchType = :matchType', { matchType });
    }

    queryBuilder.orderBy('blockWord.createdAt', 'DESC');

    const totalItems = await queryBuilder.getCount();

    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }

    const items = await queryBuilder.getMany();

    return {
      items,
      pageInfo: (page !== undefined && limit !== undefined) ? {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      } : {
        currentPage: 1,
        pageSize: totalItems,
        totalItems,
        totalPages: 1,
      },
    };
  }

  async findBlockWordById(tenantId: number, id: number): Promise<BlockWord | null> {
    return this.blockWordRepository.findOne({
      where: { dbwIdx: id, tenantId },
    });
  }

  async getBlockWordById(tenantId: number, id: number): Promise<BlockWord> {
    const blockWord = await this.findBlockWordById(tenantId, id);
    if (!blockWord) {
      throw new ResourceNotFoundException(
        `BlockWord not found: id=${id}, tenantId=${tenantId}`,
        '금칙어를 찾을 수 없습니다.',
        { id, tenantId },
      );
    }
    return blockWord;
  }

  async createBlockWord(tenantId: number, dto: CreateBlockWordDto, createdBy: number): Promise<BlockWord> {
    const matchType = dto.matchType ?? MatchType.CONTAINS;

    const existing = await this.blockWordRepository.findOne({
      where: { tenantId, blockWord: dto.blockWord, matchType },
    });

    if (existing) {
      throw new BusinessConflictException(
        `BlockWord already exists: blockWord=${dto.blockWord}, matchType=${matchType}, tenantId=${tenantId}`,
        '동일한 금칙어와 매칭 타입이 이미 등록되어 있습니다.',
        { blockWord: dto.blockWord, matchType, tenantId },
      );
    }

    const blockWord = this.blockWordRepository.create({
      tenantId,
      blockWord: dto.blockWord,
      matchType,
      reason: dto.reason ?? null,
      isActive: dto.isActive ?? 1,
      createdBy,
    });

    return this.blockWordRepository.save(blockWord);
  }

  async updateBlockWord(tenantId: number, id: number, dto: UpdateBlockWordDto): Promise<BlockWord> {
    const blockWord = await this.getBlockWordById(tenantId, id);

    if (dto.matchType !== undefined) blockWord.matchType = dto.matchType;
    if (dto.reason !== undefined) blockWord.reason = dto.reason;
    if (dto.isActive !== undefined) blockWord.isActive = dto.isActive;

    return this.blockWordRepository.save(blockWord);
  }

  async deleteBlockWord(tenantId: number, id: number): Promise<void> {
    const blockWord = await this.getBlockWordById(tenantId, id);
    await this.blockWordRepository.remove(blockWord);
  }

  async checkBlocked(tenantId: number, text: string): Promise<{ isBlocked: boolean; reason?: string | null; blockId?: number; matchedWord?: string }> {
    const activeWords = await this.blockWordRepository.find({
      where: { tenantId, isActive: 1 },
    });

    for (const blockWord of activeWords) {
      let isMatch = false;

      switch (blockWord.matchType) {
        case MatchType.EXACT:
          isMatch = text === blockWord.blockWord;
          break;
        case MatchType.CONTAINS:
          isMatch = text.includes(blockWord.blockWord);
          break;
        case MatchType.REGEX:
          try {
            const regex = new RegExp(blockWord.blockWord);
            isMatch = regex.test(text);
          } catch (e) {
            // 잘못된 정규식은 무시
            continue;
          }
          break;
      }

      if (isMatch) {
        return {
          isBlocked: true,
          reason: blockWord.reason,
          blockId: blockWord.dbwIdx,
          matchedWord: blockWord.blockWord,
        };
      }
    }

    return { isBlocked: false };
  }

  async bulkCreateBlockWord(
    tenantId: number,
    createdBy: number,
    wordsText: string,
    matchType: MatchType = MatchType.CONTAINS,
    reason?: string,
    isActive: number = 1,
  ): Promise<{ successCount: number; skippedCount: number; totalCount: number; skippedWords: string[] }> {
    // 단어 파싱: 줄바꿈 또는 쉼표로 구분
    const words = wordsText
      .split(/[\n,]/)
      .map((word) => word.trim()) // 공백 제거
      .filter((word) => word.length > 0); // 빈 문자열 제외

    // 중복 제거
    const uniqueWords = [...new Set(words)];
    const totalCount = uniqueWords.length;

    // 이미 등록된 단어 확인 (같은 matchType으로)
    const existingWords = await this.blockWordRepository.find({
      where: {
        tenantId,
        blockWord: In(uniqueWords),
        matchType,
      },
      select: ['blockWord'],
    });

    const existingWordSet = new Set(existingWords.map((w) => w.blockWord));
    const wordsToCreate = uniqueWords.filter((word) => !existingWordSet.has(word));
    const skippedWords = uniqueWords.filter((word) => existingWordSet.has(word));

    // 대량 등록
    if (wordsToCreate.length > 0) {
      const blockWords = wordsToCreate.map((word) => {
        const blockWord = new BlockWord();
        blockWord.tenantId = tenantId;
        blockWord.blockWord = word;
        blockWord.matchType = matchType;
        blockWord.reason = reason || null;
        blockWord.isActive = isActive;
        blockWord.createdBy = createdBy;
        return blockWord;
      });

      await this.blockWordRepository.save(blockWords);
    }

    return {
      successCount: wordsToCreate.length,
      skippedCount: skippedWords.length,
      totalCount,
      skippedWords,
    };
  }
}
