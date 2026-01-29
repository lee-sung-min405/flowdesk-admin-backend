import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
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

  async findAllRoles(tenantId: number): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenantId },
      order: { roleId: 'ASC' },
    });
  }

  async findRoleById(roleId: number, tenantId: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { roleId, tenantId },
      relations: { rolePermissions: { permission: true } }
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

  async update(roleId: number, tenantId: number, dto: UpdateRoleDto): Promise<Role> {
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

  async updateStatus(roleId: number, tenantId: number, isActive: boolean): Promise<Role> {
    const role = await this.getRoleById(roleId, tenantId);
    role.isActive = isActive ? 1 : 0;
    return this.roleRepository.save(role);
  }

  async delete(roleId: number, tenantId: number): Promise<void> {
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

  // =====================
  // Role-Permission 관리
  // =====================
  async assignRolePermissions(roleId: number, tenantId: number, permissionIds: number[]): Promise<Role> {
    const role = await this.getRoleById(roleId, tenantId);
    await this.rolePermissionRepository.delete({ roleId });
    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({ roleId, permissionId })
    );
    await this.rolePermissionRepository.save(rolePermissions);
    return this.getRoleById(roleId, tenantId);
  }

  async findRolePermissions(roleId: number, tenantId: number): Promise<RolePermission[] | null> {
    const role = await this.findRoleById(roleId, tenantId);
    if (!role) return null;
    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: { permission: { page: true, action: true } }
    });
  }

  async getRolePermissions(roleId: number, tenantId: number): Promise<RolePermission[]> {
    const role = await this.findRoleById(roleId, tenantId);
    if (!role) {
      throw new ResourceNotFoundException(
        `역할 ID ${roleId}를 찾을 수 없습니다 (tenantId: ${tenantId}, DB 조회 실패)`,
        `역할 ID ${roleId}를 찾을 수 없습니다`,
        { roleId, tenantId }
      );
    }
    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: { permission: { page: true, action: true } }
    });
  }

  // =====================
  // User-Role 관리
  // =====================

  async findRoleUsers(roleId: number, tenantId: number): Promise<UserRole[] | null> {
    const role = await this.findRoleById(roleId, tenantId);
    if (!role) return null;
    return this.userRoleRepository.find({
      where: { roleId },
      relations: { user: true }
    });
  }

  async getRoleUsers(roleId: number, tenantId: number): Promise<UserRole[]> {
    const role = await this.findRoleById(roleId, tenantId);
    if (!role) {
      throw new ResourceNotFoundException(
        `역할 ID ${roleId}를 찾을 수 없습니다 (tenantId: ${tenantId}, DB 조회 실패)`,
        `역할 ID ${roleId}를 찾을 수 없습니다`,
        { roleId, tenantId }
      );
    }
    return this.userRoleRepository.find({
      where: { roleId },
      relations: { user: true }
    });
  }

  async assignRolesToUser(userSeq: number, tenantId: number, roleIds: number[]): Promise<void> {
    const user = await this.userRepository.findOne({ where: { userSeq, tenantId } });
    if (!user) {
      throw new ResourceNotFoundException(
        `사용자 Seq ${userSeq}를 찾을 수 없습니다 (tenantId: ${tenantId}, DB 조회 실패)`,
        `사용자 Seq ${userSeq}를 찾을 수 없습니다`,
        { userSeq, tenantId }
      );
    }
    // 이미 할당된 역할 조회
    const existing = await this.userRoleRepository.find({ where: { userSeq, tenantId } });
    const existingRoleIds = new Set(existing.map(ur => ur.roleId));
    const newRoleIds = roleIds.filter(id => !existingRoleIds.has(id));
    if (newRoleIds.length === 0) return;
    const userRoles = newRoleIds.map(roleId => this.userRoleRepository.create({ userSeq, tenantId, roleId }));
    await this.userRoleRepository.save(userRoles);
  }

  async unassignRolesFromUser(userSeq: number, tenantId: number, roleIds: number[]): Promise<void> {
    const user = await this.userRepository.findOne({ where: { userSeq, tenantId } });
    if (!user) {
      throw new ResourceNotFoundException(
        `사용자 Seq ${userSeq}를 찾을 수 없습니다 (tenantId: ${tenantId}, DB 조회 실패)`,
        `사용자 Seq ${userSeq}를 찾을 수 없습니다`,
        { userSeq, tenantId }
      );
    }
    if (!roleIds.length) return;
    await this.userRoleRepository.delete({ userSeq, tenantId, roleId: In(roleIds) });
  }
}
