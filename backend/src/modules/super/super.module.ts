import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperController } from './super.controller';
import { SuperService } from './super.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Page } from '../rbac/entities/page.entity';
import { Action } from '../rbac/entities/action.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Page, Action, Permission, Role]),
  ],
  controllers: [SuperController],
  providers: [SuperService],
  exports: [SuperService],
})
export class SuperModule {}
