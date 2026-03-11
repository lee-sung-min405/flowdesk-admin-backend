import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselFieldDef } from '../entities/counsel-field-def.entity';
import { CounselFieldDefDto } from '../dto/field/counsel-field.dto';

@Injectable()
export class CounselFieldService {
  constructor(
    @InjectRepository(CounselFieldDef)
    private readonly fieldDefRepository: Repository<CounselFieldDef>,
  ) {}

  /**
   * 테넌트별 활성 동적 필드 정의 목록 조회
   * IDX_07513e8fb32eb570f6012d3c8f (tenant_id, is_active, sort_order) 활용
   */
  async findActiveCounselFields(tenantId: number): Promise<CounselFieldDefDto[]> {
    const fields = await this.fieldDefRepository
      .createQueryBuilder('fd')
      .where('fd.tenantId = :tenantId', { tenantId })
      .andWhere('fd.isActive = 1')
      .orderBy('CASE WHEN fd.sort_order IS NULL THEN 1 ELSE 0 END', 'ASC')
      .addOrderBy('fd.sortOrder', 'ASC')
      .addOrderBy('fd.fieldId', 'ASC')
      .getMany();

    return fields.map((f) => this.toCounselFieldDefDto(f));
  }

  private toCounselFieldDefDto(field: CounselFieldDef): CounselFieldDefDto {
    return {
      fieldId: field.fieldId,
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      isActive: field.isActive,
      sortOrder: field.sortOrder,
      placeholder: field.placeholder,
      helpText: field.helpText,
      defaultValue: field.defaultValue,
      optionsJson: field.optionsJson,
    };
  }
}
