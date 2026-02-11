import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantStatus } from './entities/tenant-status.entity';
import { CreateTenantStatusDto } from './dto/create-tenant-status.dto';
import { UpdateTenantStatusItemDto } from './dto/update-tenant-status-item.dto';
import { TenantStatusResponseDto, TenantStatusGroupedResponseDto } from './dto/tenant-status-response.dto';
import {
  ResourceNotFoundException,
  BusinessConflictException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class TenantStatusService {
  constructor(
    @InjectRepository(TenantStatus)
    private readonly tenantStatusRepository: Repository<TenantStatus>,
  ) {}
    
  async findTenantStatuses(
    tenantId: number,
    statusGroup?: string,
    isActive?: number,
    q?: string,
  ): Promise<TenantStatusGroupedResponseDto> {
    const queryBuilder = this.tenantStatusRepository
      .createQueryBuilder('ts')
      .where('ts.tenant_id = :tenantId', { tenantId });

    // statusGroup 필터
    if (statusGroup) {
      queryBuilder.andWhere('ts.status_group = :statusGroup', { statusGroup });
    }

    // isActive 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('ts.is_active = :isActive', { isActive });
    }

    // 검색어 필터 (status_name, status_key, description)
    if (q) {
      queryBuilder.andWhere(
        '(ts.status_name LIKE :search OR ts.status_key LIKE :search OR ts.description LIKE :search)',
        { search: `%${q}%` },
      );
    }

    // 정렬: status_group ASC, sort_order ASC, created_at ASC
    queryBuilder
      .orderBy('ts.status_group', 'ASC')
      .addOrderBy('ts.sort_order', 'ASC')
      .addOrderBy('ts.created_at', 'ASC');

    const items = await queryBuilder.getMany();

    // statusGroup별로 그룹핑
    const groupMap = new Map<string, TenantStatusResponseDto[]>();
    for (const item of items) {
      const group = item.statusGroup;
      if (!groupMap.has(group)) {
        groupMap.set(group, []);
      }
      groupMap.get(group)!.push(item);
    }

    const groups = Array.from(groupMap.entries()).map(([statusGroup, items]) => ({
      statusGroup,
      count: items.length,
      items,
    }));

    return {
      groups,
      total: items.length,
    };
  }

  async findTenantStatusById(tenantId: number, statusId: number): Promise<TenantStatus | null> {
    return this.tenantStatusRepository.findOne({
      where: { tenantStatusId: statusId, tenantId },
    });
  }

  async getTenantStatusById(tenantId: number, statusId: number): Promise<TenantStatus> {
    const status = await this.findTenantStatusById(tenantId, statusId);
    if (!status) {
      throw new ResourceNotFoundException(
        `테넌트 상태를 찾을 수 없습니다 (ID: ${statusId})`,
        `TenantStatus not found (ID: ${statusId}, tenantId: ${tenantId})`,
      );
    }
    return status;
  }

  async createTenantStatus(
    tenantId: number,
    dto: CreateTenantStatusDto,
  ): Promise<TenantStatusResponseDto> {
    // 중복 체크: tenant_id + status_group + status_key
    const existing = await this.tenantStatusRepository.findOne({
      where: {
        tenantId,
        statusGroup: dto.statusGroup,
        statusKey: dto.statusKey,
      },
    });

    if (existing) {
      throw new BusinessConflictException(
        `이미 존재하는 상태 키입니다 (statusGroup: ${dto.statusGroup}, statusKey: ${dto.statusKey})`,
        `TenantStatus already exists (tenantId: ${tenantId}, statusGroup: ${dto.statusGroup}, statusKey: ${dto.statusKey})`,
      );
    }

    const status = this.tenantStatusRepository.create({
      tenantId,
      ...dto,
      isActive: dto.isActive ?? 1,
    });

    const saved = await this.tenantStatusRepository.save(status);
    return saved;
  }

  async updateTenantStatus(
    tenantId: number,
    statusId: number,
    dto: UpdateTenantStatusItemDto,
  ): Promise<TenantStatusResponseDto> {
    const status = await this.getTenantStatusById(tenantId, statusId);

    // 수정 가능한 필드만 업데이트
    if (dto.statusName !== undefined) status.statusName = dto.statusName;
    if (dto.description !== undefined) status.description = dto.description;
    if (dto.color !== undefined) status.color = dto.color;
    if (dto.sortOrder !== undefined) status.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) status.isActive = dto.isActive;

    const updated = await this.tenantStatusRepository.save(status);
    return updated;
  }

  async updateTenantStatusActive(
    tenantId: number,
    statusId: number,
    isActive: number,
  ): Promise<TenantStatusResponseDto> {
    const status = await this.getTenantStatusById(tenantId, statusId);
    status.isActive = isActive ? 1 : 0;
    const updated = await this.tenantStatusRepository.save(status);
    return updated;
  }

  /**
   * 테넌트 상태 삭제
   */
  async deleteTenantStatus(tenantId: number, statusId: number): Promise<void> {
    const status = await this.getTenantStatusById(tenantId, statusId);
    await this.tenantStatusRepository.remove(status);
  }
}
