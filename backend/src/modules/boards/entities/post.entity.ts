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
import { Board } from './board.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../iam/entities/user.entity';

export enum DeleteState {
  Y = 'Y',
  N = 'N',
}

@Entity({ name: 'post' })
@Index(['boardId'])
@Index(['tenantId', 'isActive', 'isNotice', 'createdAt'])
@Index(['userSeq'])
@Index(['boardId', 'tenantId'])
@Index(['userSeq', 'tenantId'])
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', name: 'post_id' })
  postId: number;

  @Column({ type: 'int', name: 'board_id' })
  boardId: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'int', name: 'user_seq' })
  userSeq: number;

  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string;

  @Column({ type: 'longtext', name: 'content' })
  content: string;

  @Column({ type: 'tinyint', default: 0, name: 'is_notice' })
  isNotice: number;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({
    type: 'enum',
    enum: DeleteState,
    default: DeleteState.N,
    name: 'delete_state',
  })
  deleteState: DeleteState;

  @Column({ type: 'datetime', nullable: true, name: 'start_dtm' })
  startDtm: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'end_dtm' })
  endDtm: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToOne(() => Board, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_seq' })
  user: User;
}

