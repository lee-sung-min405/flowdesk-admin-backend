import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { tenantId: 'ASC' },
    });
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

    return this.tenantRepository.save(tenant);
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

  async updateTenantStatus(tenantId: number, isActive: boolean): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    tenant.isActive = isActive ? 1 : 0;
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
