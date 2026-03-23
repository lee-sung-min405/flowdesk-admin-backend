import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Website } from './entities/website.entity';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class WebsitesService {
  constructor(
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
  ) {}

  async findWebsites(
    tenantId: number,
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
    sort: string = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ items: Website[]; pageInfo: { currentPage: number; pageSize: number; totalItems: number; totalPages: number } }> {
    const queryBuilder = this.websiteRepository
      .createQueryBuilder('website')
      .leftJoinAndSelect('website.user', 'user')
      .where('website.tenantId = :tenantId', { tenantId });

    // 검색 조건 (webCode, webUrl, webTitle, userSeq)
    if (q) {
      queryBuilder.andWhere(
        '(website.webCode LIKE :q OR website.webUrl LIKE :q OR website.webTitle LIKE :q OR website.userSeq LIKE :q)',
        { q: `%${q}%` },
      );
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('website.isActive = :isActive', { isActive });
    }

    // 정렬
    const allowedSortFields = ['webCode', 'webUrl', 'webTitle', 'createdAt', 'updatedAt', 'isActive'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    queryBuilder.orderBy(`website.${sortField}`, order);

    // 페이지네이션
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

  async findWebsiteByCode(tenantId: number, webCode: string): Promise<Website | null> {
    return this.websiteRepository.findOne({
      where: { webCode, tenantId },
    });
  }

  async getWebsiteByCode(tenantId: number, webCode: string): Promise<Website> {
    const website = await this.findWebsiteByCode(tenantId, webCode);
    if (!website) {
      throw new ResourceNotFoundException(
        `Website not found: webCode=${webCode}, tenantId=${tenantId}`,
        '웹사이트를 찾을 수 없습니다.',
        { webCode, tenantId },
      );
    }
    return website;
  }

  async getWebsiteDetail(tenantId: number, webCode: string): Promise<Website> {
    const website = await this.websiteRepository.findOne({
      where: { webCode, tenantId },
      relations: { user: true },
    });
    if (!website) {
      throw new ResourceNotFoundException(
        `Website not found: webCode=${webCode}, tenantId=${tenantId}`,
        '웹사이트를 찾을 수 없습니다.',
        { webCode, tenantId },
      );
    }
    return website;
  }

  async createWebsite(tenantId: number, dto: CreateWebsiteDto): Promise<Website> {
    let webCode: string = '';

    if (dto.webCode) {
      const existingWebsite = await this.findWebsiteByCode(tenantId, dto.webCode);
      if (existingWebsite) {
        throw new BusinessConflictException(
          `Website code already exists: webCode=${dto.webCode}, tenantId=${tenantId}`,
          '이미 존재하는 웹사이트 코드입니다.',
          { webCode: dto.webCode, tenantId },
        );
      }
      webCode = dto.webCode;
    } else {
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        webCode = `WEB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const existingWebsite = await this.findWebsiteByCode(tenantId, webCode);
        if (!existingWebsite) break;
        if (attempt === maxAttempts - 1) {
          throw new BusinessConflictException(
            `Failed to generate unique webCode after ${maxAttempts} attempts`,
            '웹사이트 코드 생성에 실패했습니다. 다시 시도해주세요.',
            { tenantId },
          );
        }
      }
    }

    const website = this.websiteRepository.create({
      webCode,
      userSeq: dto.userSeq,
      webUrl: dto.webUrl,
      webTitle: dto.webTitle ?? null,
      webImg: dto.webImg ?? null,
      webDesc: dto.webDesc ?? null,
      webMemo: dto.webMemo ?? null,
      isActive: dto.isActive ?? 1,
      duplicateAllowAfterDays: dto.duplicateAllowAfterDays ?? 30,
      tenantId,
    });

    return this.websiteRepository.save(website);
  }

  async updateWebsite(
    tenantId: number,
    webCode: string,
    dto: UpdateWebsiteDto,
  ): Promise<Website> {
    const website = await this.getWebsiteByCode(tenantId, webCode);

    // 업데이트할 필드 적용
    if (dto.userSeq !== undefined) website.userSeq = dto.userSeq;
    if (dto.webUrl !== undefined) website.webUrl = dto.webUrl;
    if (dto.webTitle !== undefined) website.webTitle = dto.webTitle;
    if (dto.webImg !== undefined) website.webImg = dto.webImg;
    if (dto.webDesc !== undefined) website.webDesc = dto.webDesc;
    if (dto.webMemo !== undefined) website.webMemo = dto.webMemo;
    if (dto.isActive !== undefined) website.isActive = dto.isActive;
    if (dto.duplicateAllowAfterDays !== undefined) {
      website.duplicateAllowAfterDays = dto.duplicateAllowAfterDays;
    }

    return this.websiteRepository.save(website);
  }

  async updateWebsiteStatus(
    tenantId: number,
    webCode: string,
    isActive: number,
  ): Promise<Website> {
    const website = await this.getWebsiteByCode(tenantId, webCode);
    website.isActive = isActive;
    return this.websiteRepository.save(website);
  }

  async deleteWebsite(tenantId: number, webCode: string): Promise<void> {
    const website = await this.getWebsiteByCode(tenantId, webCode);
    await this.websiteRepository.remove(website);
  }
}
