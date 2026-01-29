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
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'block_ip' })
@Index(['tenantId', 'blockIp'], { unique: true })
@Index(['tenantId', 'isActive'])
@Index(['blockIp'])
@Index(['createdBy'])
export class BlockIp {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'dbi_idx' })
  dbiIdx: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 45, name: 'block_ip' })
  blockIp: string;

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

