import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsAdminController } from './permissions-admin.controller';
import { PermissionsAdminService } from './permissions-admin.service';
import { Page } from './entities/page.entity';
import { Action } from './entities/action.entity';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Action, Permission])],
  controllers: [PermissionsController, PermissionsAdminController],
  providers: [PermissionsService, PermissionsAdminService],
  exports: [PermissionsService, PermissionsAdminService],
})
export class PermissionsModule {}
