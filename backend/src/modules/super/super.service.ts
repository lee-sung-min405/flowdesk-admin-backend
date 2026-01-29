import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Page } from '../rbac/entities/page.entity';
import { Action } from '../rbac/entities/action.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class SuperService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Action)
    private readonly actionRepository: Repository<Action>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * 슈퍼 관리자 대시보드 통계 조회
   */
  async getDashboardStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalPages: number;
    totalActions: number;
    totalPermissions: number;
    totalRoles: number;
  }> {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalPages,
      totalActions,
      totalPermissions,
      totalRoles,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { isActive: 1 } }),
      this.userRepository.count(),
      this.pageRepository.count(),
      this.actionRepository.count(),
      this.permissionRepository.count(),
      this.roleRepository.count(),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalPages,
      totalActions,
      totalPermissions,
      totalRoles,
    };
  }
}
