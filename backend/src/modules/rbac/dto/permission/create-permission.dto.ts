import { IsInt, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: '권한에 연결할 페이지 ID',
    example: 1,
  })
  @IsInt()
  pageId: number;

  @ApiProperty({
    description: '권한에 연결할 액션 ID',
    example: 1,
  })
  @IsInt()
  actionId: number;

  @ApiPropertyOptional({
    description: '권한 표시 이름',
    example: '사용자 조회',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: '권한 설명',
    example: '사용자 목록을 조회할 수 있는 권한',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '권한 활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
