import { IsString, IsOptional, MaxLength, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({
    description: '고유 페이지 이름 (식별자)',
    example: 'users',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  pageName: string;

  @ApiProperty({
    description: '페이지 URL 경로',
    example: '/users',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  path: string;

  @ApiProperty({
    description: '페이지 표시 이름',
    example: 'User Management',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({
    description: '페이지 설명',
    example: '관리자를 위한 사용자 관리 페이지',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '상위 페이지 ID (계층 구조용)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({
    description: '표시 정렬 순서',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: '페이지 활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
