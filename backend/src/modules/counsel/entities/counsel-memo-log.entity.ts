import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Counsel } from './counsel.entity';
import { TenantStatus } from '../../tenants/entities/tenant-status.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'counsel_memo_log' })
@Index(['counselSeq', 'createdAt'])
@Index(['statusId'])
@Index(['createdBy'])
@Index(['deletedBy'])
@Index(['tenantId', 'statusId'])
@Index(['counselSeq', 'tenantId'])
export class CounselMemoLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'memo_log_id' })
  memoLogId: number;

  @Column({ type: 'bigint', name: 'counsel_seq' })
  counselSeq: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'int', name: 'status_id' })
  statusId: number;

  @Column({ type: 'text', name: 'memo_text' })
  memoText: string;

  @Column({ type: 'int', nullable: true, name: 'created_by' })
  createdBy: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'tinyint', default: 0, name: 'is_deleted' })
  isDeleted: number;

  @Column({ type: 'datetime', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'int', nullable: true, name: 'deleted_by' })
  deletedBy: number | null;

  @ManyToOne(() => Counsel, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'counsel_seq' })
  counsel: Counsel;

  @ManyToOne(() => TenantStatus, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'status_id' })
  status: TenantStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'deleted_by' })
  deleter: User | null;
}

