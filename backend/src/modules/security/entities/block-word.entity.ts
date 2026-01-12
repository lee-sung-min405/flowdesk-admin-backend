import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../iam/entities/user.entity';

export enum MatchType {
  EXACT = 'EXACT',
  CONTAINS = 'CONTAINS',
  REGEX = 'REGEX',
}

@Entity({ name: 'block_word' })
@Index(['tenantId', 'blockWord', 'matchType'], { unique: true })
@Index(['tenantId', 'isActive'])
@Index(['blockWord'])
@Index(['createdBy'])
export class BlockWord {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'dbw_idx' })
  dbwIdx: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 100, name: 'block_word' })
  blockWord: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: MatchType.CONTAINS,
    name: 'match_type',
  })
  matchType: MatchType;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'reason' })
  reason: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({ type: 'int', nullable: true, name: 'created_by' })
  createdBy: number | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;
}

