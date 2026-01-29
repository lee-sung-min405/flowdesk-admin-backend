import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity({ name: 'websites' })
@Index(['webCode', 'tenantId'], { unique: true })
@Index(['tenantId'])
@Index(['userSeq', 'tenantId'])
export class Website {
  @PrimaryColumn({ type: 'varchar', length: 20, name: 'web_code' })
  webCode: string;

  @Column({ type: 'int', name: 'user_seq' })
  userSeq: number;

  @Column({ type: 'varchar', length: 50, name: 'web_url' })
  webUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'web_title' })
  webTitle: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'web_img' })
  webImg: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true, name: 'web_desc' })
  webDesc: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true, name: 'web_memo' })
  webMemo: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({ type: 'int', default: 30, name: 'duplicate_allow_after_days' })
  duplicateAllowAfterDays: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_seq' })
  user: User;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

