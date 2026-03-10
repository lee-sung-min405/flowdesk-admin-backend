import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { Action } from './entities/action.entity';
import { Permission } from './entities/permission.entity';
import { CreatePageDto } from './dto/page/create-page.dto';
import { UpdatePageDto } from './dto/page/update-page.dto';
import { CreateActionDto } from './dto/action/create-action.dto';
import { UpdateActionDto } from './dto/action/update-action.dto';
import { CreatePermissionDto } from './dto/permission/create-permission.dto';
import { UpdatePermissionDto } from './dto/permission/update-permission.dto';
import { FindActionsResponseDto, ActionListItemDto } from './dto/action/find-actions-response.dto';
import { FindPagesResponseDto, PageListItemDto } from './dto/page/find-pages-response.dto';
import { FindPermissionsResponseDto, PermissionListItemDto } from './dto/permission/find-permissions-response.dto';
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

  async findAllPages(
    page: number = 1,
    limit: number = 20,
    q?: string,
    parentId?: number | 'null' | 'all',
    isActive?: number,
    sort: string = 'sortOrder',
    order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<FindPagesResponseDto> {
    const queryBuilder = this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.parent', 'parent')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from('pages', 'child')
          .where('child.parent_id = page.page_id');
      }, 'childCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from('permissions', 'permission')
          .where('permission.page_id = page.page_id');
      }, 'permissionCount');

    // 검색 조건
    if (q) {
      queryBuilder.andWhere(
        '(page.pageName LIKE :search OR page.displayName LIKE :search OR page.description LIKE :search)',
        { search: `%${q}%` }
      );
    }

    // 부모 페이지 필터
    if (parentId !== undefined && parentId !== 'all') {
      if (parentId === 'null') {
        queryBuilder.andWhere('page.parentId IS NULL');
      } else {
        queryBuilder.andWhere('page.parentId = :parentId', { parentId: Number(parentId) });
      }
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('page.isActive = :isActive', { isActive });
    }

    // 정렬
    const allowedSortFields = ['pageId', 'pageName', 'displayName', 'sortOrder', 'isActive', 'childCount', 'permissionCount'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'sortOrder';
    const isHierarchicalSort = sortField === 'sortOrder';
    const isAggregateSort = sortField === 'childCount' || sortField === 'permissionCount';

    // DTO 변환 헬퍼
    const mapToDto = (pageEntity: Page, raw: any): PageListItemDto => ({
      pageId: pageEntity.pageId,
      parentId: pageEntity.parentId ?? null,
      pageName: pageEntity.pageName,
      path: pageEntity.path,
      displayName: pageEntity.displayName,
      description: pageEntity.description ?? null,
      isActive: pageEntity.isActive,
      sortOrder: pageEntity.sortOrder ?? null,
      childCount: parseInt(raw.childCount) || 0,
      permissionCount: parseInt(raw.permissionCount) || 0,
      parent: pageEntity.parent ? {
        pageId: pageEntity.parent.pageId,
        pageName: pageEntity.parent.pageName,
        displayName: pageEntity.parent.displayName,
      } : null,
    });

    // 계층 정렬(sortOrder) 또는 집계 필드 정렬: 전체 로드 후 메모리 정렬/페이지네이션
    if (isHierarchicalSort || isAggregateSort) {
      const rawResults = await queryBuilder.getRawAndEntities();
      let items: PageListItemDto[] = rawResults.entities.map((e, i) => mapToDto(e, rawResults.raw[i]));

      if (isHierarchicalSort) {
        // 특정 부모 ID가 지정된 경우: 반환된 항목이 모두 자식이므로 단순 sortOrder 정렬
        if (typeof parentId === 'number') {
          items.sort((a, b) => {
            const sa = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
            const sb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
            return sa !== sb ? (order === 'ASC' ? sa - sb : sb - sa) : a.pageId - b.pageId;
          });
        } else {
          // 전체(all) 또는 최상위(null) 조회 시: 부모 → 자식 계층 구조 정렬
          const parentPages = items.filter(item => item.parentId === null);
          const childPages = items.filter(item => item.parentId !== null);

          parentPages.sort((a, b) => {
            const sa = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
            const sb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
            return sa !== sb ? (order === 'ASC' ? sa - sb : sb - sa) : a.pageId - b.pageId;
          });

          const sortedItems: PageListItemDto[] = [];
          for (const parent of parentPages) {
            sortedItems.push(parent);
            const children = childPages
              .filter(c => c.parentId === parent.pageId)
              .sort((a, b) => {
                const sa = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
                const sb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
                return sa !== sb ? (order === 'ASC' ? sa - sb : sb - sa) : a.pageId - b.pageId;
              });
            sortedItems.push(...children);
          }
          items = sortedItems;
        }
      } else {
        // 집계 필드 정렬
        items.sort((a, b) => {
          const av = (a[sortField as keyof PageListItemDto] as number) ?? 0;
          const bv = (b[sortField as keyof PageListItemDto] as number) ?? 0;
          return order === 'ASC' ? av - bv : bv - av;
        });
      }

      const totalItems = items.length;
      const totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;
      return {
        items: items.slice(offset, offset + limit),
        pageInfo: { page, limit, totalItems, totalPages },
      };
    }

    // 일반 필드 정렬: DB 레벨 정렬 및 페이지네이션
    queryBuilder.orderBy(`page.${sortField}`, order).addOrderBy('page.pageId', 'ASC');

    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const rawResults = await queryBuilder.getRawAndEntities();
    const items: PageListItemDto[] = rawResults.entities.map((e, i) => mapToDto(e, rawResults.raw[i]));

    return {
      items,
      pageInfo: { page, limit, totalItems, totalPages },
    };
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

  async getPageByIdWithChildren(pageId: number): Promise<Page> {
    const page = await this.getPageById(pageId);

    // 하위 페이지 조회 (sortOrder 순으로 정렬)
    const children = await this.pageRepository.find({
      where: { parentId: pageId },
      order: { 
        sortOrder: 'ASC',
        pageId: 'ASC'
      },
    });

    // children 속성 추가 (타입 안전성을 위해 any 사용)
    (page as any).children = children;

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

  async updatePageStatus(pageId: number, isActive: number): Promise<Page> {
    const page = await this.getPageById(pageId);
    page.isActive = isActive;
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

  async findAllActions(
    page: number = 1,
    limit: number = 20,
    q?: string,
    isActive?: number,
    sort: string = 'actionId',
    order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<FindActionsResponseDto> {
    // LEFT JOIN + GROUP BY로 permissionCount 집계 (서브쿼리 N번 실행 → 1번 JOIN으로 개선)
    const queryBuilder = this.actionRepository
      .createQueryBuilder('action')
      .leftJoin('permissions', 'p', 'p.action_id = action.action_id')
      .addSelect('COUNT(p.permission_id)', 'permissionCount')
      .groupBy('action.action_id');

    // 검색 조건
    if (q) {
      queryBuilder.andWhere(
        '(action.actionName LIKE :search OR action.displayName LIKE :search)',
        { search: `%${q}%` }
      );
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('action.isActive = :isActive', { isActive });
    }

    // 정렬
    const allowedSortFields = ['actionId', 'actionName', 'displayName', 'isActive', 'permissionCount'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'actionId';
    
    if (sortField === 'permissionCount') {
      // alias 대신 COUNT 함수 직접 사용 (TypeORM alias 해석 오류 방지)
      queryBuilder.orderBy('COUNT(p.permission_id)', order).addOrderBy('action.actionId', 'ASC');
    } else {
      queryBuilder.orderBy(`action.${sortField}`, order).addOrderBy('action.actionId', 'ASC');
    }

    // DB 레벨 전체 개수 조회
    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);

    // DB 레벨 페이지네이션
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const rawResults = await queryBuilder.getRawAndEntities();

    const items: ActionListItemDto[] = rawResults.entities.map((action, index) => ({
      actionId: action.actionId,
      actionName: action.actionName,
      displayName: action.displayName ?? null,
      isActive: action.isActive,
      permissionCount: parseInt(rawResults.raw[index].permissionCount) || 0,
    }));

    return {
      items,
      pageInfo: { page, limit, totalItems, totalPages },
    };
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

  async updateActionStatus(actionId: number, isActive: number): Promise<Action> {
    const action = await this.getActionById(actionId);
    action.isActive = isActive;
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

  async findAllPermissions(
    page: number = 1,
    limit: number = 20,
    q?: string,
    pageId?: number,
    actionId?: number,
    isActive?: number,
    sort: string = 'permissionId',
    order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<FindPermissionsResponseDto> {
    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.page', 'page')
      .leftJoinAndSelect('permission.action', 'action');

    // Like 검색 (권한 표시명, 설명)
    if (q) {
      queryBuilder.andWhere(
        '(permission.displayName LIKE :search OR permission.description LIKE :search OR page.pageName LIKE :search OR page.displayName LIKE :search OR action.actionName LIKE :search OR action.displayName LIKE :search)',
        { search: `%${q}%` }
      );
    }

    // 페이지별 필터
    if (pageId !== undefined) {
      queryBuilder.andWhere('permission.pageId = :pageId', { pageId });
    }

    // 액션별 필터
    if (actionId !== undefined) {
      queryBuilder.andWhere('permission.actionId = :actionId', { actionId });
    }

    // 상태별 필터
    if (isActive !== undefined) {
      queryBuilder.andWhere('permission.isActive = :isActive', { isActive });
    }

    // 정렬
    const allowedSortFields = ['permissionId', 'pageId', 'actionId', 'displayName', 'isActive'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'permissionId';
    queryBuilder.orderBy(`permission.${sortField}`, order).addOrderBy('permission.permissionId', 'ASC');

    // DB 레벨 전체 개수
    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);

    // DB 레벨 페이지네이션
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const permissions = await queryBuilder.getMany();

    const items: PermissionListItemDto[] = permissions.map((perm) => ({
      permissionId: perm.permissionId,
      pageId: perm.pageId,
      actionId: perm.actionId,
      displayName: perm.displayName ?? null,
      description: perm.description ?? null,
      isActive: perm.isActive,
      page: perm.page ? {
        pageId: perm.page.pageId,
        pageName: perm.page.pageName,
        displayName: perm.page.displayName ?? null,
      } : null,
      action: perm.action ? {
        actionId: perm.action.actionId,
        actionName: perm.action.actionName,
        displayName: perm.action.displayName ?? null,
      } : null,
    }));

    return {
      items,
      pageInfo: { page, limit, totalItems, totalPages },
    };
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

  async updatePermissionStatus(permissionId: number, isActive: number): Promise<Permission> {
    const permission = await this.getPermissionById(permissionId);
    permission.isActive = isActive;
    await this.permissionRepository.save(permission);
    return this.getPermissionById(permissionId);
  }

  async deletePermission(permissionId: number): Promise<void> {
    const permission = await this.getPermissionById(permissionId);
    await this.permissionRepository.remove(permission);
  }
}
