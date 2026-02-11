import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { UserRole } from '../../roles/entities/user-role.entity';

@Entity({ name: 'users' })
@Index(['userSeq', 'tenantId'], { unique: true })
@Index(['tenantId', 'userId'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'user_seq' })
  userSeq: number;

  @Column({ type: 'varchar', length: 200, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 200, name: 'user_pwd' })
  userPwd: string;

  @Column({ type: 'varchar', length: 250, name: 'corp_name' })
  corpName: string;

  @Column({ type: 'varchar', length: 200, name: 'user_name' })
  userName: string;

  @Column({ type: 'varchar', length: 250, nullable: true, name: 'user_email' })
  userEmail: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'user_tel' })
  userTel: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'user_hp' })
  userHp: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({ type: 'int', default: 0, name: 'token_version' })
  tokenVersion: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'reg_dtm' })
  regDtm: Date;

  @Column({ type: 'datetime', nullable: true, name: 'stop_dtm' })
  stopDtm: Date | null;

  @Column({ type: 'int', default: 1, name: 'tenant_id' })
  tenantId: number;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles: UserRole[];
}

