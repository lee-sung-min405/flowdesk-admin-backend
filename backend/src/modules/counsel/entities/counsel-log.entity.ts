import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Counsel } from './counsel.entity';
import { TenantStatus } from '../../tenants/entities/tenant-status.entity';

@Entity({ name: 'counsel_log' })
@Index(['counselStat'])
@Index(['tenantId', 'counselStat'])
@Index(['counselSeq', 'tenantId'])
export class CounselLog {
  @PrimaryColumn({ type: 'bigint', name: 'counsel_seq' })
  counselSeq: number;

  @PrimaryColumn({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @PrimaryColumn({ type: 'int', name: 'log_no' })
  logNo: number;

  @Column({ type: 'int', name: 'counsel_stat' })
  counselStat: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'reg_dtm' })
  regDtm: Date;

  @ManyToOne(() => Counsel, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'counsel_seq' })
  counsel: Counsel;

  @ManyToOne(() => TenantStatus, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'counsel_stat' })
  status: TenantStatus;
}

