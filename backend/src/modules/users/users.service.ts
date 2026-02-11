import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UserListItemDto } from './dto/user-list-item.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { ListResponseDto } from './dto/list-response.dto';
import {
  BusinessConflictException,
  ResourceNotFoundException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findUsers(
    tenantId: number,
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
    sort: string = 'regDtm',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<ListResponseDto<UserListItemDto>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId });

    // 검색 조건 (userId, userName, corpName, userEmail)
    if (q) {
      queryBuilder.andWhere(
        '(user.userId LIKE :q OR user.userName LIKE :q OR user.corpName LIKE :q OR user.userEmail LIKE :q)',
        { q: `%${q}%` },
      );
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // 정렬
    const allowedSortFields = ['userSeq', 'userId', 'userName', 'corpName', 'regDtm', 'isActive'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'regDtm';
    queryBuilder.orderBy(`user.${sortField}`, order);

    // 페이지네이션
    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const users = await queryBuilder.skip(offset).take(limit).getMany();

    const items: UserListItemDto[] = users.map((user) => ({
      userSeq: user.userSeq,
      userId: user.userId,
      corpName: user.corpName,
      userName: user.userName,
      userEmail: user.userEmail,
      userTel: user.userTel,
      userHp: user.userHp,
      isActive: user.isActive,
      regDtm: user.regDtm,
      stopDtm: user.stopDtm,
      tenantId: user.tenantId,
    }));

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

  async findUserById(tenantId: number, userSeq: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { userSeq, tenantId } });
  }

  async getUserById(tenantId: number, userSeq: number): Promise<User> {
    const user = await this.findUserById(tenantId, userSeq);
    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }
    return user;
  }

  async getUserDetail(tenantId: number, userSeq: number): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }

    // 테넌트의 전체 역할 목록 조회
    const allRoles = await this.roleRepository.find({
      where: { tenantId },
      order: { roleId: 'ASC' },
    });

    // 할당된 역할 ID 추출
    const assignedRoleIds = user.userRoles.map(ur => ur.role.roleId);

    // 전체 역할 목록에 할당 여부 포함
    const availableRoles = allRoles.map(role => ({
      roleId: role.roleId,
      roleName: role.roleName,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      isAssigned: assignedRoleIds.includes(role.roleId),
    }));

    const { userPwd, tokenVersion, userRoles, ...safeUserData } = user;

    return {
      ...safeUserData,
      assignedRoleIds,
      availableRoles,
    };
  }

  async createUser(tenantId: number, createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { tenantId, userId: createUserDto.userId },
    });

    if (existingUser) {
      throw new BusinessConflictException(
        `User ID already exists: userId=${createUserDto.userId}, tenantId=${tenantId}`,
        '이미 존재하는 사용자 ID입니다.',
        { userId: createUserDto.userId, tenantId },
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      userId: createUserDto.userId,
      userPwd: hashedPassword,
      corpName: createUserDto.corpName,
      userName: createUserDto.userName,
      userEmail: createUserDto.userEmail || null,
      userTel: createUserDto.userTel || null,
      userHp: createUserDto.userHp || null,
      isActive: 1,
      tokenVersion: 0,
      tenantId,
    });

    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  async updateUser(
    tenantId: number,
    userSeq: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.getUserById(tenantId, userSeq);

    // 기본 정보 업데이트
    if (updateUserDto.corpName !== undefined) user.corpName = updateUserDto.corpName;
    if (updateUserDto.userName !== undefined) user.userName = updateUserDto.userName;
    if (updateUserDto.userEmail !== undefined) user.userEmail = updateUserDto.userEmail;
    if (updateUserDto.userTel !== undefined) user.userTel = updateUserDto.userTel;
    if (updateUserDto.userHp !== undefined) user.userHp = updateUserDto.userHp;

    const savedUser = await this.userRepository.save(user);

    // 역할 업데이트 (선택적)
    if (updateUserDto.roleIds !== undefined) {
      const roleIds = updateUserDto.roleIds;

      // 역할 존재 확인
      if (roleIds.length > 0) {
        const roles = await this.roleRepository.find({
          where: { roleId: In(roleIds), tenantId },
        });

        if (roles.length !== roleIds.length) {
          throw new ResourceNotFoundException(
            `일부 역할 ID를 찾을 수 없습니다`,
            '존재하지 않는 역할이 포함되어 있습니다.',
            { requestedRoleIds: roleIds, foundRoleIds: roles.map(r => r.roleId) },
          );
        }
      }

      // 기존 역할 모두 삭제
      await this.userRoleRepository.delete({ userSeq, tenantId });

      // 새 역할 할당
      if (roleIds.length > 0) {
        const userRoles = roleIds.map(roleId => 
          this.userRoleRepository.create({
            userSeq,
            tenantId,
            roleId,
          })
        );
        await this.userRoleRepository.save(userRoles);
      }
    }

    return savedUser;
  }

  async updateUserStatus(
    tenantId: number,
    userSeq: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    const user = await this.getUserById(tenantId, userSeq);

    user.isActive = updateUserStatusDto.isActive;
    user.stopDtm = updateUserStatusDto.isActive === 1 ? null : new Date();

    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  async updateUserPassword(
    tenantId: number,
    userSeq: number,
    updateUserPasswordDto: UpdateUserPasswordDto,
  ): Promise<void> {
    const user = await this.getUserById(tenantId, userSeq);

    const hashedPassword = await bcrypt.hash(updateUserPasswordDto.newPassword, 10);

    user.userPwd = hashedPassword;

    await this.userRepository.save(user);
  }

  async invalidateUserTokens(tenantId: number, userSeq: number): Promise<void> {
    const user = await this.getUserById(tenantId, userSeq);

    await this.userRepository.increment({ userSeq, tenantId }, 'tokenVersion', 1);
  }
}
