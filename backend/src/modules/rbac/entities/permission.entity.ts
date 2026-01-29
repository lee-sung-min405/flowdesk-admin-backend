import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Page } from './page.entity';
import { Action } from './action.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';

@Entity({ name: 'permissions' })
@Index(['pageId', 'actionId'], { unique: true })
@Index(['actionId'])
export class Permission {
  @PrimaryGeneratedColumn({ type: 'int', name: 'permission_id' })
  permissionId: number;

  @Column({ type: 'int', name: 'page_id' })
  pageId: number;

  @Column({ type: 'int', name: 'action_id' })
  actionId: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'display_name' })
  displayName: string | null;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Page, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @ManyToOne(() => Action, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'action_id' })
  action: Action;
  
  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions: RolePermission[];
}

