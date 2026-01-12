import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'code_groups' })
@Index(['codeGroupKey'], { unique: true })
export class CodeGroup {
  @PrimaryGeneratedColumn({ type: 'int', name: 'code_group_id' })
  codeGroupId: number;

  @Column({ type: 'varchar', length: 50, name: 'code_group_key' })
  codeGroupKey: string;

  @Column({ type: 'varchar', length: 100, name: 'code_group_name' })
  codeGroupName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

