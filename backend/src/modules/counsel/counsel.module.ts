import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counsel } from './entities/counsel.entity';
import { CounselFieldDef } from './entities/counsel-field-def.entity';
import { CounselFieldValue } from './entities/counsel-field-value.entity';
import { CounselLog } from './entities/counsel-log.entity';
import { CounselMemoLog } from './entities/counsel-memo-log.entity';
import { Website } from '../websites/entities/website.entity';
import { TenantStatus } from '../tenants/entities/tenant-status.entity';
import { User } from '../users/entities/user.entity';
import { SecurityModule } from '../security/security.module';
import { CounselService } from './services/counsel.service';
import { CounselStatusService } from './services/counsel-status.service';
import { CounselMemoService } from './services/counsel-memo.service';
import { CounselFieldService } from './services/counsel-field.service';
import { CounselDashboardService } from './services/counsel-dashboard.service';
import { CounselController } from './counsel.controller';
import { CounselFieldsController } from './counsel-fields.controller';
import { TransactionUtil } from '../../common/utils/transaction.util';

@Module({
  imports: [
    SecurityModule,
    TypeOrmModule.forFeature([
      Counsel,
      CounselFieldDef,
      CounselFieldValue,
      CounselLog,
      CounselMemoLog,
      Website,
      TenantStatus,
      User,
    ]),
  ],
  controllers: [CounselController, CounselFieldsController],
  providers: [
    CounselService,
    CounselStatusService,
    CounselMemoService,
    CounselFieldService,
    CounselDashboardService,
    TransactionUtil,
  ],
  exports: [CounselService],
})
export class CounselModule {}
