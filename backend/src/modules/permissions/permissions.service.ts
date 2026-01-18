import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../iam/entities/page.entity';
import { Action } from '../iam/entities/action.entity';
import { Permission } from '../iam/entities/permission.entity';
import {
  CatalogResponseDto,
  PageDto,
  ActionDto,
  PermissionDto,
  MatrixActionDto,
} from './dto/catalog-response.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Action)
    private readonly actionRepository: Repository<Action>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 권한 카탈로그 조회
   * - 총 3번의 쿼리로 모든 데이터 조회 (N+1 방지)
   * - is_active=1 필터링
   * - 정렬: pages(sort_order, page_name), actions(action_name)
   * 
   * @throws Error - 데이터베이스 조회 실패 시 (GlobalExceptionFilter가 SYS001로 처리)
   */
  async getCatalog(): Promise<CatalogResponseDto> {
    try {
      // 1. 활성 페이지 조회 (sort_order ASC NULLS LAST, page_name ASC)
      // MySQL/MariaDB는 NULLS LAST를 지원하지 않으므로 IS NULL로 처리
      const pages = await this.pageRepository
        .createQueryBuilder('page')
        .where('page.isActive = :isActive', { isActive: 1 })
        .orderBy('CASE WHEN page.sortOrder IS NULL THEN 1 ELSE 0 END', 'ASC')
        .addOrderBy('page.sortOrder', 'ASC')
        .addOrderBy('page.pageName', 'ASC')
        .getMany();

      // 2. 활성 액션 조회 (action_name ASC)
      const actions = await this.actionRepository
        .createQueryBuilder('action')
        .where('action.isActive = :isActive', { isActive: 1 })
        .orderBy('action.actionName', 'ASC')
        .getMany();

      // 3. 활성 권한 조회 (page, action join하여 page_name, action_name 확보)
      const permissions = await this.permissionRepository
        .createQueryBuilder('permission')
        .innerJoinAndSelect('permission.page', 'page')
        .innerJoinAndSelect('permission.action', 'action')
        .where('permission.isActive = :isActive', { isActive: 1 })
        .andWhere('page.isActive = :isActive', { isActive: 1 })
        .andWhere('action.isActive = :isActive', { isActive: 1 })
        .getMany();

      // DTO 변환
      const pagesDto: PageDto[] = pages.map((page) => ({
        pageId: page.pageId,
        parentId: page.parentId ?? null,
        pageName: page.pageName,
        path: page.path,
        displayName: page.displayName,
        description: page.description ?? null,
        sortOrder: page.sortOrder ?? null,
      }));

      const actionsDto: ActionDto[] = actions.map((action) => ({
        actionId: action.actionId,
        actionName: action.actionName,
        displayName: action.displayName ?? null,
      }));

      const permissionsDto: PermissionDto[] = permissions.map((permission) => ({
        permissionId: permission.permissionId,
        pageId: permission.pageId,
        actionId: permission.actionId,
        displayName: permission.displayName ?? null,
        description: permission.description ?? null,
      }));

      // Matrix 구성 (key: page_name, value: [{ actionName, permissionId }])
      const matrix: Record<string, MatrixActionDto[]> = {};

      for (const permission of permissions) {
        const pageName = permission.page.pageName;
        const actionName = permission.action.actionName;

        if (!matrix[pageName]) {
          matrix[pageName] = [];
        }

        matrix[pageName].push({
          actionName,
          permissionId: permission.permissionId,
        });
      }

      // Matrix 내부 액션 정렬 (actions 정렬 순서 유지)
      const actionNameOrder = new Map(
        actions.map((action, index) => [action.actionName, index]),
      );

      for (const pageName in matrix) {
        matrix[pageName].sort((a, b) => {
          const orderA = actionNameOrder.get(a.actionName) ?? Infinity;
          const orderB = actionNameOrder.get(b.actionName) ?? Infinity;
          return orderA - orderB;
        });
      }

      this.logger.log(`Catalog retrieved: ${pages.length} pages, ${actions.length} actions, ${permissions.length} permissions`);

      return {
        pages: pagesDto,
        actions: actionsDto,
        permissions: permissionsDto,
        matrix,
      };
    } catch (error) {
      // 에러는 GlobalExceptionFilter가 처리 (SYS001로 변환)
      this.logger.error('Failed to retrieve permissions catalog', error);
      throw error;
    }
  }
}
