import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CounselFieldDefDto {
  @ApiProperty({ description: '필드 ID', example: 1 })
  fieldId: number;

  @ApiProperty({ description: '필드 키', example: 'address' })
  fieldKey: string;

  @ApiProperty({ description: '필드 라벨', example: '주소' })
  label: string;

  @ApiProperty({ description: '필드 타입 (text, number, date, datetime, select)', example: 'text' })
  fieldType: string;

  @ApiProperty({ description: '필수 여부 (0: 선택, 1: 필수)', example: 0 })
  isRequired: number;

  @ApiProperty({ description: '활성 여부 (0: 비활성, 1: 활성)', example: 1 })
  isActive: number;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1, nullable: true })
  sortOrder: number | null;

  @ApiPropertyOptional({ description: '플레이스홀더', example: '주소를 입력하세요', nullable: true })
  placeholder: string | null;

  @ApiPropertyOptional({ description: '도움말 텍스트', nullable: true })
  helpText: string | null;

  @ApiPropertyOptional({ description: '기본값', nullable: true })
  defaultValue: string | null;

  @ApiPropertyOptional({ description: '옵션 JSON (select 타입 등)', nullable: true })
  optionsJson: Record<string, any> | null;
}
