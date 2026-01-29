import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { Action } from './entities/action.entity';
import { Permission } from './entities/permission.entity';
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

  async getCatalog(): Promise<CatalogResponseDto> {
    const pages = await this.pageRepository
      .createQueryBuilder('page')
      .where('page.isActive = :isActive', { isActive: 1 })
      .orderBy('CASE WHEN page.sortOrder IS NULL THEN 1 ELSE 0 END', 'ASC')
      .addOrderBy('page.sortOrder', 'ASC')
      .addOrderBy('page.pageName', 'ASC')
      .getMany();

    const actions = await this.actionRepository
      .createQueryBuilder('action')
      .where('action.isActive = :isActive', { isActive: 1 })
      .orderBy('action.actionName', 'ASC')
      .getMany();

    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoinAndSelect('permission.page', 'page')
      .innerJoinAndSelect('permission.action', 'action')
      .where('permission.isActive = :isActive', { isActive: 1 })
      .andWhere('page.isActive = :isActive', { isActive: 1 })
      .andWhere('action.isActive = :isActive', { isActive: 1 })
      .getMany();

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
  }
}
