import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantStatus } from './entities/tenant-status.entity';
import { User } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/tenant/create-tenant.dto';
import { UpdateTenantDto } from './dto/tenant/update-tenant.dto';
import { FindTenantsResponseDto, TenantListItemDto, PageInfoDto } from './dto/tenant/find-tenants-response.dto';
import {
  ResourceNotFoundException,
  BusinessConflictException,
  ValidationException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantStatus)
    private readonly tenantStatusRepository: Repository<TenantStatus>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findTenants(
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
    sort: string = 'tenantId',
    order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<FindTenantsResponseDto> {
    const queryBuilder = this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoin(User, 'user', 'user.tenantId = tenant.tenantId');

    // 검색어 필터 (tenantName, displayName, domain)
    if (q) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('tenant.tenantName LIKE :q', { q: `%${q}%` })
            .orWhere('tenant.displayName LIKE :q', { q: `%${q}%` })
            .orWhere('tenant.domain LIKE :q', { q: `%${q}%` });
        })
      );
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('tenant.isActive = :isActive', { isActive });
    }

    // 전체 개수 조회 (페이지네이션용)
    const totalItems = await queryBuilder.getCount();

    // 정렬
    const allowedSortFields = ['tenantId', 'tenantName', 'displayName', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'tenantId';
    queryBuilder.orderBy(`tenant.${sortField}`, order);

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // COUNT 집계 추가
    queryBuilder
      .select([
        'tenant',
        'COUNT(DISTINCT user.userSeq) as userCount'
      ])
      .groupBy('tenant.tenantId');

    const result = await queryBuilder.getRawAndEntities();

    const items: TenantListItemDto[] = result.entities.map((tenant, index) => ({
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      displayName: tenant.displayName,
      domain: tenant.domain,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      userCount: parseInt(result.raw[index].userCount || '0'),
    }));

    const totalPages = Math.ceil(totalItems / limit);

    const pageInfo: PageInfoDto = {
      currentPage: page,
      pageSize: limit,
      totalItems,
      totalPages,
    };

    return { items, pageInfo };
  }

  async findTenantById(tenantId: number): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { tenantId },
    });
  }

  async getTenantById(tenantId: number): Promise<Tenant> {
    const tenant = await this.findTenantById(tenantId);
    if (!tenant) {
      throw new ResourceNotFoundException(
        `테넌트 ID ${tenantId}를 찾을 수 없습니다 (DB 조회 실패)`,
        `테넌트 ID ${tenantId}를 찾을 수 없습니다`,
        { tenantId }
      );
    }
    return tenant;
  }

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    const existingTenant = await this.tenantRepository.findOne({
      where: { tenantName: dto.tenantName },
    });

    if (existingTenant) {
      throw new BusinessConflictException(
        `테넌트 이름 '${dto.tenantName}'이 이미 존재합니다 (tenant_id: ${existingTenant.tenantId})`,
        `테넌트 이름 '${dto.tenantName}'이 이미 존재합니다`,
        { tenantName: dto.tenantName, existingTenantId: existingTenant.tenantId }
      );
    }

    const tenant = this.tenantRepository.create({
      tenantName: dto.tenantName,
      displayName: dto.displayName ?? null,
      domain: dto.domain ?? null,
      isActive: dto.isActive ?? 1,
    });

    const saved = await this.tenantRepository.save(tenant);

    // 기본 상담 상태 자동 생성
    const defaultStatuses = [
      { statusKey: 'NEW',        statusName: '신규 접수', sortOrder: 1 },
      { statusKey: 'DUPLICATE',  statusName: '중복',      sortOrder: 2 },
      { statusKey: 'IN_PROGRESS',statusName: '진행중',    sortOrder: 3 },
      { statusKey: 'SCHEDULED',  statusName: '예약',      sortOrder: 4 },
      { statusKey: 'CONTACTED',  statusName: '상담완료',  sortOrder: 5 },
    ];
    await this.tenantStatusRepository.save(
      defaultStatuses.map((s) =>
        this.tenantStatusRepository.create({
          tenantId: saved.tenantId,
          statusGroup: 'counsel',
          isActive: 1,
          ...s,
        }),
      ),
    );

    return saved;
  }

  async updateTenant(tenantId: number, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    if (dto.tenantName && dto.tenantName !== tenant.tenantName) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { tenantName: dto.tenantName },
      });
      if (existingTenant) {
        throw new BusinessConflictException(
          `테넌트 이름 '${dto.tenantName}'이 이미 존재합니다 (tenant_id: ${existingTenant.tenantId})`,
          `테넌트 이름 '${dto.tenantName}'이 이미 존재합니다`,
          { tenantName: dto.tenantName, existingTenantId: existingTenant.tenantId }
        );
      }
    }

    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  async updateTenantStatus(tenantId: number, isActive: number): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    tenant.isActive = isActive;
    return this.tenantRepository.save(tenant);
  }

  async deleteTenant(tenantId: number): Promise<void> {
    const tenant = await this.getTenantById(tenantId);

    const userCount = await this.userRepository.count({
      where: { tenantId },
    });

    if (userCount > 0) {
      throw new ValidationException(
        `테넌트 ID ${tenantId}는 ${userCount}명의 사용자를 가지고 있어 삭제 불가 (users.tenant_id 참조 존재)`,
        `${userCount}명의 사용자가 있는 테넌트는 삭제할 수 없습니다. 먼저 사용자를 제거하거나 재할당하세요.`,
        { tenantId, userCount }
      );
    }

    await this.tenantRepository.remove(tenant);
  }
}
