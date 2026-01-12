import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Website } from '../../websites/entities/website.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantStatus } from '../../tenants/entities/tenant-status.entity';
import { User } from '../../iam/entities/user.entity';

export enum DeleteState {
  Y = 'Y',
  N = 'N',
}

@Entity({ name: 'counsel' })
@Index(['counselSeq', 'tenantId'], { unique: true })
@Index(['empSeq'])
@Index(['webCode'])
@Index(['counselStat'])
@Index(['webCode', 'tenantId'])
@Index(['tenantId', 'counselStat'])
export class Counsel {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'counsel_seq' })
  counselSeq: number;

  @Column({ type: 'varchar', length: 20, name: 'web_code' })
  webCode: string;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'name' })
  name: string | null;

  @Column({ type: 'varchar', length: 50, name: 'counsel_hp' })
  counselHp: string;

  @Column({ type: 'varchar', length: 50, name: 'counsel_ip' })
  counselIp: string;

  @Column({ type: 'int', name: 'counsel_stat' })
  counselStat: number;

  @Column({ type: 'int', nullable: true, name: 'emp_seq' })
  empSeq: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'counsel_source' })
  counselSource: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'counsel_medium' })
  counselMedium: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'counsel_campaign' })
  counselCampaign: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'counsel_resv_dtm' })
  counselResvDtm: Date | null;

  @Column({ type: 'tinytext', nullable: true, name: 'counsel_memo' })
  counselMemo: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'reg_dtm' })
  regDtm: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'edit_dtm' })
  editDtm: Date;

  @Column({ type: 'char', length: 1, default: 'N', name: 'duplicate_state' })
  duplicateState: string;

  @Column({
    type: 'enum',
    enum: DeleteState,
    default: DeleteState.N,
    name: 'delete_state',
  })
  deleteState: DeleteState;

  @ManyToOne(() => Website, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'web_code' })
  website: Website;

  @ManyToOne(() => TenantStatus, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'counsel_stat' })
  status: TenantStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'emp_seq' })
  employee: User | null;
}

