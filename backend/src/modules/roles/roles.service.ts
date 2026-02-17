import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ModifyPermissionsResponseDto } from './dto/modify-permissions-response.dto';
import { FindRolesResponseDto, RoleListItemDto, PageInfoDto } from './dto/find-roles-response.dto';
import { 
  ResourceNotFoundException, 
  BusinessConflictException,
  ValidationException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findRoles(
    tenantId: number,
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
    sort: string = 'roleId',
    order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<FindRolesResponseDto> {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoin('role.userRoles', 'userRole')
      .leftJoin('role.rolePermissions', 'rolePermission')
      .where('role.tenantId = :tenantId', { tenantId });

    // 검색어 필터 (roleName, displayName, description)
    if (q) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('role.roleName LIKE :q', { q: `%${q}%` })
            .orWhere('role.displayName LIKE :q', { q: `%${q}%` })
            .orWhere('role.description LIKE :q', { q: `%${q}%` });
        })
      );
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('role.isActive = :isActive', { isActive });
    }

    // 전체 개수 조회 (페이지네이션용)
    const totalItems = await queryBuilder.getCount();

    // 정렬
    const allowedSortFields = ['roleId', 'roleName', 'displayName', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'roleId';
    queryBuilder.orderBy(`role.${sortField}`, order);

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // COUNT 집계 추가
    queryBuilder
      .select([
        'role',
        'COUNT(DISTINCT userRole.userSeq) as userCount',
        'COUNT(DISTINCT rolePermission.permissionId) as permissionCount'
      ])
      .groupBy('role.roleId');

    const result = await queryBuilder.getRawAndEntities();

    const items: RoleListItemDto[] = result.entities.map((role, index) => ({
      roleId: role.roleId,
      roleName: role.roleName,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      tenantId: role.tenantId,
      userCount: parseInt(result.raw[index].userCount || '0'),
      permissionCount: parseInt(result.raw[index].permissionCount || '0'),
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

  async findRoleById(roleId: number, tenantId: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { roleId, tenantId },
    });
  }

  async getRoleById(roleId: number, tenantId: number): Promise<Role> {
    const role = await this.findRoleById(roleId, tenantId);
    if (!role) {
      throw new ResourceNotFoundException(
        `역할 ID ${roleId}를 찾을 수 없습니다 (tenantId: ${tenantId}, DB 조회 실패)`,
        `역할 ID ${roleId}를 찾을 수 없습니다`,
        { roleId, tenantId }
      );
    }
    return role;
  }

  async getRoleByIdWithPermissions(roleId: number, tenantId: number) {
    const role = await this.roleRepository.findOne({
      where: { roleId, tenantId },
      relations: { 
        rolePermissions: { 
          permission: { 
            page: true, 
            action: true 
          } 
        },
        userRoles: {
          user: true
        }
      }
    });
    if (!role) {
      throw new ResourceNotFoundException(
        `역할 ID ${roleId}를 찾을 수 없습니다 (tenantId: ${tenantId}, DB 조회 실패)`,
        `역할 ID ${roleId}를 찾을 수 없습니다`,
        { roleId, tenantId }
      );
    }

    // 페이지별로 권한 그룹화 (page, action 정보 포함)
    const permissionsByPageMap = new Map<number, { pageName: string; pageDisplayName: string | null; permissions: any[] }>();
    
    role.rolePermissions?.forEach(rp => {
      const pageId = rp.permission.pageId;
      if (!permissionsByPageMap.has(pageId)) {
        permissionsByPageMap.set(pageId, {
          pageName: rp.permission.page.pageName,
          pageDisplayName: rp.permission.page.displayName,
          permissions: []
        });
      }
      permissionsByPageMap.get(pageId)!.permissions.push({
        permissionId: rp.permission.permissionId,
        displayName: rp.permission.displayName,
        description: rp.permission.description,
        actionId: rp.permission.actionId,
        actionName: rp.permission.action.actionName,
        actionDisplayName: rp.permission.action.displayName,
      });
    });

    // Map을 배열로 변환 및 정렬
    const permissionsByPage = Array.from(permissionsByPageMap.entries())
      .map(([pageId, data]) => ({
        pageId,
        pageName: data.pageName,
        pageDisplayName: data.pageDisplayName,
        permissions: data.permissions.sort((a, b) => a.actionId - b.actionId), // actionId 순으로 정렬
      }))
      .sort((a, b) => a.pageId - b.pageId); // pageId 순으로 정렬

    // 할당된 사용자 목록 정리
    const assignedUsers = role.userRoles?.map(ur => ({
      userSeq: ur.user.userSeq,
      userId: ur.user.userId,
      userName: ur.user.userName,
      email: ur.user.userEmail,
      isActive: ur.user.isActive,
      assignedAt: ur.createdAt,
    })) || [];

    return {
      roleId: role.roleId,
      roleName: role.roleName,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      tenantId: role.tenantId,
      permissionsByPage,
      assignedUsers
    };
  }

  async create(dto: CreateRoleDto, tenantId: number): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { roleName: dto.roleName, tenantId },
    });

    if (existingRole) {
      throw new BusinessConflictException(
        `역할 이름 '${dto.roleName}'이 테넌트 ${tenantId}에 이미 존재합니다 (role_id: ${existingRole.roleId})`,
        `역할 이름 '${dto.roleName}'이 해당 테넌트에 이미 존재합니다`,
        { roleName: dto.roleName, tenantId, existingRoleId: existingRole.roleId }
      );
    }

    const role = this.roleRepository.create({
      roleName: dto.roleName,
      displayName: dto.displayName ?? null,
      description: dto.description ?? null,
      tenantId,
      isActive: 1,
    });

    return this.roleRepository.save(role);
  }

  async updateRole(roleId: number, tenantId: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(roleId, tenantId);

    if (dto.roleName && dto.roleName !== role.roleName) {
      const existingRole = await this.roleRepository.findOne({
        where: { roleName: dto.roleName, tenantId: role.tenantId },
      });
      if (existingRole) {
        throw new BusinessConflictException(
          `역할 이름 '${dto.roleName}'이 테넌트 ${role.tenantId}에 이미 존재합니다 (role_id: ${existingRole.roleId})`,
          `역할 이름 '${dto.roleName}'이 해당 테넌트에 이미 존재합니다`,
          { roleName: dto.roleName, tenantId: role.tenantId, existingRoleId: existingRole.roleId }
        );
      }
    }

    Object.assign(role, dto);
    return this.roleRepository.save(role);
  }

  async updateRoleStatus(roleId: number, tenantId: number, isActive: number): Promise<Role> {
    const role = await this.getRoleById(roleId, tenantId);
    role.isActive = isActive;
    return this.roleRepository.save(role);
  }

  async deleteRole(roleId: number, tenantId: number): Promise<void> {
    const role = await this.getRoleById(roleId, tenantId);

    const userRoleCount = await this.userRoleRepository.count({
      where: { roleId },
    });

    if (userRoleCount > 0) {
      throw new ValidationException(
        `역할 ID ${roleId}는 ${userRoleCount}명의 사용자에게 할당되어 삭제 불가 (user_roles 참조 존재)`,
        `${userRoleCount}명의 사용자에게 할당된 역할은 삭제할 수 없습니다. 먼저 할당을 해제하세요.`,
        { roleId, userRoleCount }
      );
    }

    await this.rolePermissionRepository.delete({ roleId });

    await this.roleRepository.remove(role);
  }

  async copyRolePermissions(
    targetRoleId: number,
    tenantId: number,
    sourceRoleId: number,
  ): Promise<Role> {
    const targetRole = await this.getRoleById(targetRoleId, tenantId);

    const sourceRole = await this.getRoleById(sourceRoleId, tenantId);

    const sourcePermissions = await this.rolePermissionRepository.find({
      where: { roleId: sourceRoleId },
      select: { permissionId: true },
    });

    if (sourcePermissions.length === 0) {
      throw new ValidationException(
        `원본 역할 ID ${sourceRoleId}에 할당된 권한이 없습니다`,
        `원본 역할에 권한이 없어 복사할 수 없습니다`,
        { sourceRoleId, targetRoleId }
      );
    }

    const permissionIds = sourcePermissions.map(rp => rp.permissionId);

    await this.rolePermissionRepository.delete({ roleId: targetRoleId });

    const newPermissions = permissionIds.map(permissionId =>
      this.rolePermissionRepository.create({ roleId: targetRoleId, permissionId })
    );
    await this.rolePermissionRepository.save(newPermissions);

    return this.getRoleById(targetRoleId, tenantId);
  }

  async modifyRolePermissions(
    roleId: number,
    tenantId: number,
    add: number[] = [],
    remove: number[] = [],
  ): Promise<ModifyPermissionsResponseDto> {
    const role = await this.getRoleById(roleId, tenantId);

    const existing = await this.rolePermissionRepository.find({
      where: { roleId },
      select: {permissionId: true},
    });
    const existingIds = new Set(existing.map(rp => rp.permissionId));

    const toAdd = add.filter(id => !existingIds.has(id));
    const alreadyExists = add.filter(id => existingIds.has(id));

    const toRemove = remove.filter(id => existingIds.has(id));
    const notFound = remove.filter(id => !existingIds.has(id));

    if (toRemove.length > 0) {
      await this.rolePermissionRepository.delete({
        roleId,
        permissionId: In(toRemove),
      });
    }

    if (toAdd.length > 0) {
      const newPermissions = toAdd.map(permissionId =>
        this.rolePermissionRepository.create({ roleId, permissionId })
      );
      await this.rolePermissionRepository.save(newPermissions);
    }
    
    const finalCount = await this.rolePermissionRepository.count({ where: { roleId } });

    return {
      added: toAdd,
      removed: toRemove,
      alreadyExists,
      notFound,
      totalCount: finalCount,
    };
  }

}
