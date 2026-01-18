import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Page } from '../iam/entities/page.entity';
import { Action } from '../iam/entities/action.entity';
import { Permission } from '../iam/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Action, Permission])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
