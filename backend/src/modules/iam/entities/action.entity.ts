import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'actions' })
@Index(['actionName'], { unique: true })
export class Action {
  @PrimaryGeneratedColumn({ type: 'int', name: 'action_id' })
  actionId: number;

  @Column({ type: 'varchar', length: 50, name: 'action_name' })
  actionName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'display_name' })
  displayName: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

