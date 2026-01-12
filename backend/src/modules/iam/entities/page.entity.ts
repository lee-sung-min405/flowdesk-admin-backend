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

@Entity({ name: 'pages' })
@Index(['pageName'], { unique: true })
@Index(['parentId'])
export class Page {
  @PrimaryGeneratedColumn({ type: 'int', name: 'page_id' })
  pageId: number;

  @Column({ type: 'int', nullable: true, name: 'parent_id' })
  parentId: number | null;

  @Column({ type: 'varchar', length: 100, name: 'page_name' })
  pageName: string;

  @Column({ type: 'varchar', length: 255, name: 'path' })
  path: string;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({ type: 'tinyint', nullable: true, name: 'sort_order' })
  sortOrder: number | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Page, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Page | null;
}

