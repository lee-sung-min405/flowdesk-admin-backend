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

@Entity({ name: 'board' })
@Index(['tenantId', 'boardKey'], { unique: true })
@Index(['boardId', 'tenantId'], { unique: true })
@Index(['tenantId', 'isActive', 'sortOrder'])
export class Board {
  @PrimaryGeneratedColumn({ type: 'int', name: 'board_id' })
  boardId: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 64, name: 'board_key' })
  boardKey: string;

  @Column({ type: 'varchar', length: 256, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

