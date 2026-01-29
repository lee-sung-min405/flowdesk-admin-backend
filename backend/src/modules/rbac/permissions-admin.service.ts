import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { Action } from './entities/action.entity';
import { Permission } from './entities/permission.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { 
  ResourceNotFoundException, 
  BusinessConflictException,
  ValidationException,
} from '../../common/exceptions/base.exception';

@Injectable()
export class PermissionsAdminService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Action)
    private readonly actionRepository: Repository<Action>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAllPages(): Promise<Page[]> {
    return this.pageRepository.find({
      relations: { parent : true },
      order: { sortOrder: 'ASC', pageId: 'ASC' }
    });
  }

  async findPageById(pageId: number): Promise<Page | null> {
    return this.pageRepository.findOne({
      where: { pageId },
      relations: { parent : true }
    });
  }

  async getPageById(pageId: number): Promise<Page> {
    const page = await this.findPageById(pageId);
    if (!page) {
      throw new ResourceNotFoundException(
        `페이지 ID ${pageId}를 찾을 수 없습니다 (DB 조회 실패)`,
        `페이지 ID ${pageId}를 찾을 수 없습니다`,
        { pageId }
      );
    }
    return page;
  }

  async createPage(dto: CreatePageDto): Promise<Page> {
    const existingPage = await this.pageRepository.findOne({
      where: { pageName: dto.pageName },
    });

    if (existingPage) {
      throw new BusinessConflictException(
        `페이지 이름 '${dto.pageName}'이 이미 존재합니다 (page_id: ${existingPage.pageId})`,
        `페이지 이름 '${dto.pageName}'이 이미 존재합니다`,
        { pageName: dto.pageName, existingPageId: existingPage.pageId }
      );
    }

    if (dto.parentId) {
      await this.getPageById(dto.parentId);
    }

    const page = this.pageRepository.create({
      pageName: dto.pageName,
      path: dto.path,
      displayName: dto.displayName,
      description: dto.description ?? null,
      parentId: dto.parentId ?? null,
      sortOrder: dto.sortOrder ?? null,
      isActive: dto.isActive ?? 1,
    });

    return this.pageRepository.save(page);
  }

  async updatePage(pageId: number, dto: UpdatePageDto): Promise<Page> {
    const page = await this.getPageById(pageId);

    if (dto.pageName && dto.pageName !== page.pageName) {
      const existingPage = await this.pageRepository.findOne({
        where: { pageName: dto.pageName },
      });
      if (existingPage) {
        throw new BusinessConflictException(
          `페이지 이름 '${dto.pageName}'이 이미 존재합니다 (page_id: ${existingPage.pageId})`,
          `페이지 이름 '${dto.pageName}'이 이미 존재합니다`,
          { pageName: dto.pageName, existingPageId: existingPage.pageId }
        );
      }
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === pageId) {
        throw new ValidationException(
          `페이지 ID ${pageId}를 자기 자신의 부모로 설정 시도 (parentId: ${dto.parentId})`,
          '페이지는 자기 자신을 부모로 설정할 수 없습니다',
          { pageId, parentId: dto.parentId }
        );
      }
      await this.getPageById(dto.parentId);
    }

    Object.assign(page, dto);
    return this.pageRepository.save(page);
  }

  async updatePageStatus(pageId: number, isActive: boolean): Promise<Page> {
    const page = await this.getPageById(pageId);
    page.isActive = isActive ? 1 : 0;
    return this.pageRepository.save(page);
  }

  async deletePage(pageId: number): Promise<void> {
    const page = await this.getPageById(pageId);

    const childCount = await this.pageRepository.count({
      where: { parentId: pageId },
    });

    if (childCount > 0) {
      throw new ValidationException(
        `페이지 ID ${pageId}는 ${childCount}개의 하위 페이지를 가지고 있어 삭제 불가 (pages.parent_id 참조 존재)`,
        `${childCount}개의 하위 페이지가 있어 삭제할 수 없습니다. 먼저 하위 페이지를 제거하거나 재할당하세요.`,
        { pageId, childCount }
      );
    }

    const permissionCount = await this.permissionRepository.count({
      where: { pageId },
    });

    if (permissionCount > 0) {
      throw new ValidationException(
        `페이지 ID ${pageId}는 ${permissionCount}개의 권한과 연결되어 있어 삭제 불가 (permissions.page_id 참조 존재)`,
        `${permissionCount}개의 권한이 연결되어 있어 삭제할 수 없습니다. 먼저 권한을 제거하세요.`,
        { pageId, permissionCount }
      );
    }

    await this.pageRepository.remove(page);
  }

  async findAllActions(): Promise<Action[]> {
    return this.actionRepository.find({
      order: { actionId: 'ASC' },
    });
  }

  async findActionById(actionId: number): Promise<Action | null> {
    return this.actionRepository.findOne({
      where: { actionId },
    });
  }

  async getActionById(actionId: number): Promise<Action> {
    const action = await this.findActionById(actionId);
    if (!action) {
      throw new ResourceNotFoundException(
        `액션 ID ${actionId}를 찾을 수 없습니다 (DB 조회 실패)`,
        `액션 ID ${actionId}를 찾을 수 없습니다`,
        { actionId }
      );
    }
    return action;
  }

  async createAction(dto: CreateActionDto): Promise<Action> {
    const existingAction = await this.actionRepository.findOne({
      where: { actionName: dto.actionName },
    });

    if (existingAction) {
      throw new BusinessConflictException(
        `액션 이름 '${dto.actionName}'이 이미 존재합니다 (action_id: ${existingAction.actionId})`,
        `액션 이름 '${dto.actionName}'이 이미 존재합니다`,
        { actionName: dto.actionName, existingActionId: existingAction.actionId }
      );
    }

    const action = this.actionRepository.create({
      actionName: dto.actionName,
      displayName: dto.displayName ?? null,
      isActive: dto.isActive ?? 1,
    });

    return this.actionRepository.save(action);
  }

  async updateAction(actionId: number, dto: UpdateActionDto): Promise<Action> {
    const action = await this.getActionById(actionId);

    if (dto.actionName && dto.actionName !== action.actionName) {
      const existingAction = await this.actionRepository.findOne({
        where: { actionName: dto.actionName },
      });
      if (existingAction) {
        throw new BusinessConflictException(
          `액션 이름 '${dto.actionName}'이 이미 존재합니다 (action_id: ${existingAction.actionId})`,
          `액션 이름 '${dto.actionName}'이 이미 존재합니다`,
          { actionName: dto.actionName, existingActionId: existingAction.actionId }
        );
      }
    }

    Object.assign(action, dto);
    return this.actionRepository.save(action);
  }

  async updateActionStatus(actionId: number, isActive: boolean): Promise<Action> {
    const action = await this.getActionById(actionId);
    action.isActive = isActive ? 1 : 0;
    return this.actionRepository.save(action);
  }

  async deleteAction(actionId: number): Promise<void> {
    const action = await this.getActionById(actionId);

    // 연결된 권한 확인
    const permissionCount = await this.permissionRepository.count({
      where: { actionId },
    });

    if (permissionCount > 0) {
      throw new ValidationException(
        `액션 ID ${actionId}는 ${permissionCount}개의 권한과 연결되어 있어 삭제 불가 (permissions.action_id 참조 존재)`,
        `${permissionCount}개의 권한이 연결되어 있어 삭제할 수 없습니다. 먼저 권한을 제거하세요.`,
        { actionId, permissionCount }
      );
    }

    await this.actionRepository.remove(action);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations : { page: true, action: true },
      order: { permissionId: 'ASC' }
    });
  }

  async findPermissionById(permissionId: number): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { permissionId },
      relations : { page: true, action: true }
    });
  }

  async getPermissionById(permissionId: number): Promise<Permission> {
    const permission = await this.findPermissionById(permissionId);
    if (!permission) {
      throw new ResourceNotFoundException(
        `권한 ID ${permissionId}를 찾을 수 없습니다 (DB 조회 실패)`,
        `권한 ID ${permissionId}를 찾을 수 없습니다`,
        { permissionId }
      );
    }
    return permission;
  }

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    await this.getPageById(dto.pageId);

    await this.getActionById(dto.actionId);

    const existingPermission = await this.permissionRepository.findOne({
      where: { pageId: dto.pageId, actionId: dto.actionId },
    });

    if (existingPermission) {
      throw new BusinessConflictException(
        `페이지 ${dto.pageId}와 액션 ${dto.actionId}의 권한이 이미 존재합니다 (permission_id: ${existingPermission.permissionId})`,
        `페이지 ${dto.pageId}와 액션 ${dto.actionId}의 권한이 이미 존재합니다`,
        { pageId: dto.pageId, actionId: dto.actionId, existingPermissionId: existingPermission.permissionId }
      );
    }

    const permission = this.permissionRepository.create({
      pageId: dto.pageId,
      actionId: dto.actionId,
      displayName: dto.displayName ?? null,
      description: dto.description ?? null,
      isActive: dto.isActive ?? 1,
    });

    const saved = await this.permissionRepository.save(permission);
    return this.getPermissionById(saved.permissionId);
  }

  async updatePermission(permissionId: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.getPermissionById(permissionId);

    if (dto.pageId !== undefined && dto.pageId !== permission.pageId) {
      await this.getPageById(dto.pageId);
    }

    if (dto.actionId !== undefined && dto.actionId !== permission.actionId) {
      await this.getActionById(dto.actionId);
    }

    if (
      (dto.pageId !== undefined || dto.actionId !== undefined) &&
      (dto.pageId !== permission.pageId || dto.actionId !== permission.actionId)
    ) {
      const targetPageId = dto.pageId ?? permission.pageId;
      const targetActionId = dto.actionId ?? permission.actionId;

      const existingPermission = await this.permissionRepository.findOne({
        where: { pageId: targetPageId, actionId: targetActionId },
      });

      if (existingPermission && existingPermission.permissionId !== permissionId) {
        throw new BusinessConflictException(
          `페이지 ${targetPageId}와 액션 ${targetActionId}의 권한이 이미 존재합니다 (permission_id: ${existingPermission.permissionId})`,
          `페이지 ${targetPageId}와 액션 ${targetActionId}의 권한이 이미 존재합니다`,
          { pageId: targetPageId, actionId: targetActionId, existingPermissionId: existingPermission.permissionId }
        );
      }
    }

    Object.assign(permission, dto);
    await this.permissionRepository.save(permission);
    return this.getPermissionById(permissionId);
  }

  async updatePermissionStatus(permissionId: number, isActive: boolean): Promise<Permission> {
    const permission = await this.getPermissionById(permissionId);
    permission.isActive = isActive ? 1 : 0;
    await this.permissionRepository.save(permission);
    return this.getPermissionById(permissionId);
  }

  async deletePermission(permissionId: number): Promise<void> {
    const permission = await this.getPermissionById(permissionId);
    await this.permissionRepository.remove(permission);
  }
}
