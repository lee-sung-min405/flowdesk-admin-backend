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
import { CodeGroup } from './code-group.entity';

@Entity({ name: 'codes' })
@Index(['codeGroupId', 'codeKey'], { unique: true })
@Index(['codeGroupId'])
export class Code {
  @PrimaryGeneratedColumn({ type: 'int', name: 'code_id' })
  codeId: number;

  @Column({ type: 'int', name: 'code_group_id' })
  codeGroupId: number;

  @Column({ type: 'varchar', length: 50, name: 'code_key' })
  codeKey: string;

  @Column({ type: 'varchar', length: 100, name: 'code_name' })
  codeName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => CodeGroup, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'code_group_id' })
  codeGroup: CodeGroup;
}

