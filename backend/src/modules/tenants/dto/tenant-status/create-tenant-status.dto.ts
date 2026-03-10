import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  Matches,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantStatusDto {
  @ApiProperty({
    description: '상태 그룹명',
    example: 'COUNSEL_STATUS',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  statusGroup: string;

  @ApiProperty({
    description: '상태 코드 (snake_case 형식)',
    example: 'status_pending',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'statusKey must be in snake_case format (lowercase letters, numbers, and underscores only)',
  })
  statusKey: string;

  @ApiProperty({
    description: '상태 표시명',
    example: '접수대기',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  statusName: string;

  @ApiPropertyOptional({
    description: '상태 설명',
    example: '상담 접수 대기 중',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    description: '색상 코드 (HEX 형식)',
    example: '#FF5733',
    maxLength: 7,
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid HEX color code (e.g., #FF5733)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: '정렬 순서',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: '활성 상태 (1: 활성, 0: 비활성)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
