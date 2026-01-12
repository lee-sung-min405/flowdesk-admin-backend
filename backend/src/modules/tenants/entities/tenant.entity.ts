import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'tenants' })
@Index(['tenantName'], { unique: true })
export class Tenant {
  @PrimaryGeneratedColumn({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 100, name: 'tenant_name' })
  tenantName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'display_name' })
  displayName: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'domain' })
  domain: string | null;
}

