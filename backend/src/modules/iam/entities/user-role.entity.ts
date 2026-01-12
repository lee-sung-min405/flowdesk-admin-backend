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
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity({ name: 'user_roles' })
@Index(['userSeq', 'tenantId'])
@Index(['roleId', 'tenantId'])
export class UserRole {
  @PrimaryColumn({ type: 'int', name: 'user_seq' })
  userSeq: number;

  @PrimaryColumn({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @PrimaryColumn({ type: 'int', name: 'role_id' })
  roleId: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_seq' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}

