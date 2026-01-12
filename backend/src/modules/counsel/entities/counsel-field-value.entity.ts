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
import { Counsel } from './counsel.entity';
import { CounselFieldDef } from './counsel-field-def.entity';

@Entity({ name: 'counsel_field_value' })
@Index(['fieldId'])
@Index(['counselSeq', 'tenantId'])
@Index(['fieldId', 'tenantId'])
// Note: value_text prefix index (length: 100) should be created in migration
// CREATE INDEX idx_value_text_prefix ON counsel_field_value(value_text(100));
export class CounselFieldValue {
  @PrimaryColumn({ type: 'bigint', name: 'counsel_seq' })
  counselSeq: number;

  @PrimaryColumn({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @PrimaryColumn({ type: 'bigint', name: 'field_id' })
  fieldId: number;

  @Column({ type: 'text', nullable: true, name: 'value_text' })
  valueText: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true, name: 'value_number' })
  valueNumber: number | null;

  @Column({ type: 'date', nullable: true, name: 'value_date' })
  valueDate: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'value_datetime' })
  valueDatetime: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Counsel, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'counsel_seq' })
  counsel: Counsel;

  @ManyToOne(() => CounselFieldDef, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'field_id' })
  fieldDef: CounselFieldDef;
}

