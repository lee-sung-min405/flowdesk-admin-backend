import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantStatusController } from './tenant-status.controller';
import { TenantStatusService } from './tenant-status.service';
import { Tenant } from './entities/tenant.entity';
import { TenantStatus } from './entities/tenant-status.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantStatus, User])],
  controllers: [TenantStatusController, TenantsController],
  providers: [TenantsService, TenantStatusService],
  exports: [TenantsService, TenantStatusService],
})
export class TenantsModule {}
