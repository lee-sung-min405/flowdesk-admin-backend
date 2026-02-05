import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockIp } from './entities/block-ip.entity';
import { BlockHp } from './entities/block-hp.entity';
import { BlockWord } from './entities/block-word.entity';
import { BlockIpService } from './block-ip.service';
import { BlockHpService } from './block-hp.service';
import { BlockWordService } from './block-word.service';
import { BlockIpController } from './block-ip.controller';
import { BlockHpController } from './block-hp.controller';
import { BlockWordController } from './block-word.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlockIp, BlockHp, BlockWord])],
  controllers: [BlockIpController, BlockHpController, BlockWordController],
  providers: [BlockIpService, BlockHpService, BlockWordService],
  exports: [BlockIpService, BlockHpService, BlockWordService],
})
export class SecurityModule {}
