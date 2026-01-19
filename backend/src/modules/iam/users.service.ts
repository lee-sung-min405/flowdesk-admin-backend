import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UserListItemDto } from './dto/user-list-item.dto';
import { UserDetailDto } from './dto/user-detail.dto';
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
  ) {}

  /**
   * 사용자 목록 조회 (페이지네이션, 검색, 필터링)
   */
  async findAll(
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

  /**
   * 사용자 상세 조회
   */
  async findOne(tenantId: number, userSeq: number): Promise<UserDetailDto> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }

    return {
      userSeq: user.userSeq,
      userId: user.userId,
      corpName: user.corpName,
      userName: user.userName,
      userEmail: user.userEmail,
      userTel: user.userTel,
      userHp: user.userHp,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
      regDtm: user.regDtm,
      stopDtm: user.stopDtm,
      tenantId: user.tenantId,
    };
  }

  /**
   * 사용자 생성
   */
  async create(tenantId: number, createUserDto: CreateUserDto): Promise<UserDetailDto> {
    // 중복 체크 (tenant_id + user_id)
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

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 사용자 생성
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

    return {
      userSeq: savedUser.userSeq,
      userId: savedUser.userId,
      corpName: savedUser.corpName,
      userName: savedUser.userName,
      userEmail: savedUser.userEmail,
      userTel: savedUser.userTel,
      userHp: savedUser.userHp,
      isActive: savedUser.isActive,
      tokenVersion: savedUser.tokenVersion,
      regDtm: savedUser.regDtm,
      stopDtm: savedUser.stopDtm,
      tenantId: savedUser.tenantId,
    };
  }

  /**
   * 사용자 정보 수정 (userId, password 제외)
   */
  async update(
    tenantId: number,
    userSeq: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDetailDto> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }

    // 업데이트
    if (updateUserDto.corpName !== undefined) user.corpName = updateUserDto.corpName;
    if (updateUserDto.userName !== undefined) user.userName = updateUserDto.userName;
    if (updateUserDto.userEmail !== undefined) user.userEmail = updateUserDto.userEmail;
    if (updateUserDto.userTel !== undefined) user.userTel = updateUserDto.userTel;
    if (updateUserDto.userHp !== undefined) user.userHp = updateUserDto.userHp;

    const savedUser = await this.userRepository.save(user);

    return {
      userSeq: savedUser.userSeq,
      userId: savedUser.userId,
      corpName: savedUser.corpName,
      userName: savedUser.userName,
      userEmail: savedUser.userEmail,
      userTel: savedUser.userTel,
      userHp: savedUser.userHp,
      isActive: savedUser.isActive,
      tokenVersion: savedUser.tokenVersion,
      regDtm: savedUser.regDtm,
      stopDtm: savedUser.stopDtm,
      tenantId: savedUser.tenantId,
    };
  }

  /**
   * 사용자 상태 변경 (활성/정지)
   */
  async updateStatus(
    tenantId: number,
    userSeq: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserDetailDto> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }

    user.isActive = updateUserStatusDto.isActive ? 1 : 0;
    user.stopDtm = updateUserStatusDto.isActive ? null : new Date();

    const savedUser = await this.userRepository.save(user);

    return {
      userSeq: savedUser.userSeq,
      userId: savedUser.userId,
      corpName: savedUser.corpName,
      userName: savedUser.userName,
      userEmail: savedUser.userEmail,
      userTel: savedUser.userTel,
      userHp: savedUser.userHp,
      isActive: savedUser.isActive,
      tokenVersion: savedUser.tokenVersion,
      regDtm: savedUser.regDtm,
      stopDtm: savedUser.stopDtm,
      tenantId: savedUser.tenantId,
    };
  }

  /**
   * 사용자 비밀번호 변경 (관리자용)
   */
  async updatePassword(
    tenantId: number,
    userSeq: number,
    updateUserPasswordDto: UpdateUserPasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(updateUserPasswordDto.newPassword, 10);

    user.userPwd = hashedPassword;

    await this.userRepository.save(user);
  }

  /**
   * 토큰 무효화 (강제 로그아웃)
   */
  async invalidateTokens(tenantId: number, userSeq: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userSeq, tenantId },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        `User not found: userSeq=${userSeq}, tenantId=${tenantId}`,
        '사용자를 찾을 수 없습니다.',
        { userSeq, tenantId },
      );
    }

    // token_version 증가
    await this.userRepository.increment({ userSeq, tenantId }, 'tokenVersion', 1);
  }
}
