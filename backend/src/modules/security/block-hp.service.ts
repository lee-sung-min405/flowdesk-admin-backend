import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BlockHp } from './entities/block-hp.entity';
import { CreateBlockHpDto } from './dto/block-hp/create-block-hp.dto';
import { UpdateBlockHpDto } from './dto/block-hp/update-block-hp.dto';
import { BlockHpListResponseDto } from './dto/list-response.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class BlockHpService {
  constructor(
    @InjectRepository(BlockHp)
    private readonly blockHpRepository: Repository<BlockHp>,
  ) {}

  async findBlockHps(
    tenantId: number,
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
  ): Promise<BlockHpListResponseDto> {
    const queryBuilder = this.blockHpRepository
      .createQueryBuilder('blockHp')
      .where('blockHp.tenantId = :tenantId', { tenantId });

    if (q) {
      queryBuilder.andWhere(
        '(blockHp.blockHp LIKE :q OR blockHp.reason LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('blockHp.isActive = :isActive', { isActive });
    }

    queryBuilder.orderBy('blockHp.createdAt', 'DESC');

    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const items = await queryBuilder.skip(offset).take(limit).getMany();

    return {
      items,
      pageInfo: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findBlockHpById(tenantId: number, id: number): Promise<BlockHp | null> {
    return this.blockHpRepository.findOne({
      where: { dbhIdx: id, tenantId },
    });
  }

  async getBlockHpById(tenantId: number, id: number): Promise<BlockHp> {
    const blockHp = await this.findBlockHpById(tenantId, id);
    if (!blockHp) {
      throw new ResourceNotFoundException(
        `BlockHp not found: id=${id}, tenantId=${tenantId}`,
        '차단 휴대폰 번호를 찾을 수 없습니다.',
        { id, tenantId },
      );
    }
    return blockHp;
  }

  async createBlockHp(tenantId: number, dto: CreateBlockHpDto, createdBy: number): Promise<BlockHp> {
    const existing = await this.blockHpRepository.findOne({
      where: { tenantId, blockHp: dto.blockHp },
    });

    if (existing) {
      throw new BusinessConflictException(
        `BlockHp already exists: blockHp=${dto.blockHp}, tenantId=${tenantId}`,
        '이미 등록된 휴대폰 번호입니다.',
        { blockHp: dto.blockHp, tenantId },
      );
    }

    const blockHp = this.blockHpRepository.create({
      tenantId,
      blockHp: dto.blockHp,
      reason: dto.reason ?? null,
      isActive: dto.isActive ?? 1,
      createdBy,
    });

    return this.blockHpRepository.save(blockHp);
  }

  async updateBlockHp(tenantId: number, id: number, dto: UpdateBlockHpDto): Promise<BlockHp> {
    const blockHp = await this.getBlockHpById(tenantId, id);

    if (dto.reason !== undefined) blockHp.reason = dto.reason;
    if (dto.isActive !== undefined) blockHp.isActive = dto.isActive;

    return this.blockHpRepository.save(blockHp);
  }

  async deleteBlockHp(tenantId: number, id: number): Promise<void> {
    const blockHp = await this.getBlockHpById(tenantId, id);
    await this.blockHpRepository.remove(blockHp);
  }

  async checkBlocked(tenantId: number, hp: string): Promise<{ isBlocked: boolean; reason?: string | null; blockId?: number }> {
    const blockHp = await this.blockHpRepository.findOne({
      where: { tenantId, blockHp: hp, isActive: 1 },
    });

    if (blockHp) {
      return {
        isBlocked: true,
        reason: blockHp.reason,
        blockId: blockHp.dbhIdx,
      };
    }

    return { isBlocked: false };
  }

  async bulkCreateBlockHp(
    tenantId: number,
    createdBy: number,
    phonesText: string,
    reason?: string,
    isActive: number = 1,
  ): Promise<{ successCount: number; skippedCount: number; totalCount: number; skippedPhones: string[] }> {
    // 전화번호 파싱: 줄바꿈 또는 쉼표로 구분
    const phones = phonesText
      .split(/[\n,]/)
      .map((phone) => phone.trim().replace(/-/g, '')) // 하이픈 제거 및 공백 제거
      .filter((phone) => phone.length > 0); // 빈 문자열 제외

    // 중복 제거
    const uniquePhones = [...new Set(phones)];
    const totalCount = uniquePhones.length;

    // 이미 등록된 전화번호 확인
    const existingPhones = await this.blockHpRepository.find({
      where: {
        tenantId,
        blockHp: In(uniquePhones),
      },
      select: ['blockHp'],
    });

    const existingPhoneSet = new Set(existingPhones.map((p) => p.blockHp));
    const phonesToCreate = uniquePhones.filter((phone) => !existingPhoneSet.has(phone));
    const skippedPhones = uniquePhones.filter((phone) => existingPhoneSet.has(phone));

    // 대량 등록
    if (phonesToCreate.length > 0) {
      const blockHps = phonesToCreate.map((phone) => {
        const blockHp = new BlockHp();
        blockHp.tenantId = tenantId;
        blockHp.blockHp = phone;
        blockHp.reason = reason || null;
        blockHp.isActive = isActive;
        blockHp.createdBy = createdBy;
        return blockHp;
      });

      await this.blockHpRepository.save(blockHps);
    }

    return {
      successCount: phonesToCreate.length,
      skippedCount: skippedPhones.length,
      totalCount,
      skippedPhones,
    };
  }
}
