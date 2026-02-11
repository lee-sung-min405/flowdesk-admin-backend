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
import { Tenant } from './tenant.entity';

@Entity({ name: 'tenant_status' })
@Index(['tenantId', 'statusGroup', 'statusKey'], { unique: true })
@Index(['tenantId', 'statusGroup'])
export class TenantStatus {
  @PrimaryGeneratedColumn({ type: 'int', name: 'tenant_status_id' })
  tenantStatusId: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 50, name: 'status_group' })
  statusGroup: string;

  @Column({ type: 'varchar', length: 50, name: 'status_key' })
  statusKey: string;

  @Column({ type: 'varchar', length: 100, name: 'status_name' })
  statusName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true, name: 'color' })
  color: string | null;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

