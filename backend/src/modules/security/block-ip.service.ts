import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BlockIp } from './entities/block-ip.entity';
import { CreateBlockIpDto } from './dto/create-block-ip.dto';
import { UpdateBlockIpDto } from './dto/update-block-ip.dto';
import { BlockIpListResponseDto } from './dto/list-response.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class BlockIpService {
  constructor(
    @InjectRepository(BlockIp)
    private readonly blockIpRepository: Repository<BlockIp>,
  ) {}

  async findBlockIps(
    tenantId: number,
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
  ): Promise<BlockIpListResponseDto> {
    const queryBuilder = this.blockIpRepository
      .createQueryBuilder('blockIp')
      .where('blockIp.tenantId = :tenantId', { tenantId });

    if (q) {
      queryBuilder.andWhere(
        '(blockIp.blockIp LIKE :q OR blockIp.reason LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('blockIp.isActive = :isActive', { isActive });
    }

    queryBuilder.orderBy('blockIp.createdAt', 'DESC');

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

  async findBlockIpById(tenantId: number, id: number): Promise<BlockIp | null> {
    return this.blockIpRepository.findOne({
      where: { dbiIdx: id, tenantId },
    });
  }

  async getBlockIpById(tenantId: number, id: number): Promise<BlockIp> {
    const blockIp = await this.findBlockIpById(tenantId, id);
    if (!blockIp) {
      throw new ResourceNotFoundException(
        `BlockIp not found: id=${id}, tenantId=${tenantId}`,
        '차단 IP를 찾을 수 없습니다.',
        { id, tenantId },
      );
    }
    return blockIp;
  }

  async createBlockIp(tenantId: number, dto: CreateBlockIpDto, createdBy: number): Promise<BlockIp> {
    const existing = await this.blockIpRepository.findOne({
      where: { tenantId, blockIp: dto.blockIp },
    });

    if (existing) {
      throw new BusinessConflictException(
        `BlockIp already exists: blockIp=${dto.blockIp}, tenantId=${tenantId}`,
        '이미 등록된 IP 주소입니다.',
        { blockIp: dto.blockIp, tenantId },
      );
    }

    const blockIp = this.blockIpRepository.create({
      tenantId,
      blockIp: dto.blockIp,
      reason: dto.reason ?? null,
      isActive: dto.isActive ?? 1,
      createdBy,
    });

    return this.blockIpRepository.save(blockIp);
  }

  async updateBlockIp(tenantId: number, id: number, dto: UpdateBlockIpDto): Promise<BlockIp> {
    const blockIp = await this.getBlockIpById(tenantId, id);

    if (dto.reason !== undefined) blockIp.reason = dto.reason;
    if (dto.isActive !== undefined) blockIp.isActive = dto.isActive;

    return this.blockIpRepository.save(blockIp);
  }

  async deleteBlockIp(tenantId: number, id: number): Promise<void> {
    const blockIp = await this.getBlockIpById(tenantId, id);
    await this.blockIpRepository.remove(blockIp);
  }

  async checkBlocked(tenantId: number, ip: string): Promise<{ isBlocked: boolean; reason?: string | null; blockId?: number }> {
    const blockIp = await this.blockIpRepository.findOne({
      where: { tenantId, blockIp: ip, isActive: 1 },
    });

    if (blockIp) {
      return {
        isBlocked: true,
        reason: blockIp.reason,
        blockId: blockIp.dbiIdx,
      };
    }

    return { isBlocked: false };
  }

  async bulkCreateBlockIp(
    tenantId: number,
    createdBy: number,
    ipsText: string,
    reason?: string,
    isActive: number = 1,
  ): Promise<{ successCount: number; skippedCount: number; totalCount: number; skippedIps: string[] }> {
    // IP 주소 파싱: 줄바꿈 또는 쉼표로 구분
    const ips = ipsText
      .split(/[\n,]/)
      .map((ip) => ip.trim()) // 공백 제거
      .filter((ip) => ip.length > 0); // 빈 문자열 제외

    // 중복 제거
    const uniqueIps = [...new Set(ips)];
    const totalCount = uniqueIps.length;

    // 이미 등록된 IP 확인
    const existingIps = await this.blockIpRepository.find({
      where: {
        tenantId,
        blockIp: In(uniqueIps),
      },
      select: ['blockIp'],
    });

    const existingIpSet = new Set(existingIps.map((i) => i.blockIp));
    const ipsToCreate = uniqueIps.filter((ip) => !existingIpSet.has(ip));
    const skippedIps = uniqueIps.filter((ip) => existingIpSet.has(ip));

    // 대량 등록
    if (ipsToCreate.length > 0) {
      const blockIps = ipsToCreate.map((ip) => {
        const blockIp = new BlockIp();
        blockIp.tenantId = tenantId;
        blockIp.blockIp = ip;
        blockIp.reason = reason || null;
        blockIp.isActive = isActive;
        blockIp.createdBy = createdBy;
        return blockIp;
      });

      await this.blockIpRepository.save(blockIps);
    }

    return {
      successCount: ipsToCreate.length,
      skippedCount: skippedIps.length,
      totalCount,
      skippedIps,
    };
  }
}
