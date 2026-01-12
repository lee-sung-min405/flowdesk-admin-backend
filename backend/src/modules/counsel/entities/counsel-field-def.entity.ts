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
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity({ name: 'counsel_field_def' })
@Index(['tenantId', 'fieldKey'], { unique: true })
@Index(['fieldId', 'tenantId'], { unique: true })
@Index(['tenantId', 'isActive', 'sortOrder'])
export class CounselFieldDef {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'field_id' })
  fieldId: number;

  @Column({ type: 'int', name: 'tenant_id' })
  tenantId: number;

  @Column({ type: 'varchar', length: 64, name: 'field_key' })
  fieldKey: string;

  @Column({ type: 'varchar', length: 100, name: 'label' })
  label: string;

  @Column({ type: 'varchar', length: 20, name: 'field_type' })
  fieldType: string;

  @Column({ type: 'tinyint', default: 0, name: 'is_required' })
  isRequired: number;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: number;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'placeholder' })
  placeholder: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'help_text' })
  helpText: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'default_value' })
  defaultValue: string | null;

  @Column({
    type: 'longtext',
    nullable: true,
    name: 'options_json',
    transformer: {
      to: (value: Record<string, any> | null) =>
        value ? JSON.stringify(value) : null,
      from: (value: string | null) => (value ? JSON.parse(value) : null),
    },
  })
  optionsJson: Record<string, any> | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, { onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

