import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsIn, MaxLength, Matches, Min } from 'class-validator';

export class CreateTenantStatusDto {
  @ApiProperty({
    description: '상태 그룹 (counsel, order, ticket 등 업무 도메인별 그룹)',
    example: 'counsel',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  statusGroup: string;

  @ApiProperty({
    description: '상태 키 (그룹 내 고유 식별자, 영문 소문자/숫자/언더스코어만 사용)',
    example: 'in_progress',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'statusKey는 영문 소문자, 숫자, 언더스코어(_)만 사용할 수 있습니다',
  })
  statusKey: string;

  @ApiProperty({
    description: '상태 표시명',
    example: '진행중',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  statusName: string;

  @ApiProperty({
    description: '상태 설명',
    example: '상담이 진행 중인 상태입니다',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: '상태 색상 (HEX 코드, #RRGGBB 형식)',
    example: '#3B82F6',
    required: false,
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color는 #RRGGBB 형식의 HEX 코드여야 합니다',
  })
  color?: string;

  @ApiProperty({
    description: '정렬 순서 (숫자가 작을수록 먼저 표시)',
    example: 1,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    description: '활성 여부 (1: 활성, 0: 비활성)',
    example: 1,
    enum: [0, 1],
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  isActive?: number;
}
