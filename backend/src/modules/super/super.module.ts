import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperController } from './super.controller';
import { SuperService } from './super.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { Counsel } from '../counsel/entities/counsel.entity';
import { Post } from '../boards/entities/post.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { BlockIp } from '../security/entities/block-ip.entity';
import { BlockHp } from '../security/entities/block-hp.entity';
import { BlockWord } from '../security/entities/block-word.entity';
import { Website } from '../websites/entities/website.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      User,
      Permission,
      Role,
      Counsel,
      Post,
      RefreshToken,
      BlockIp,
      BlockHp,
      BlockWord,
      Website,
    ]),
  ],
  controllers: [SuperController],
  providers: [SuperService],
  exports: [SuperService],
})
export class SuperModule {}
