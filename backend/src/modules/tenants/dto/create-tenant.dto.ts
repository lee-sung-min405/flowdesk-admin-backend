import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: '고유 테넌트 이름 (식별자)',
    example: 'acme-corp',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  tenantName: string;

  @ApiPropertyOptional({
    description: '테넌트 표시 이름',
    example: 'ACME Corporation',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: '테넌트에 연결된 도메인',
    example: 'acme.example.com',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  domain?: string;

  @ApiPropertyOptional({
    description: '테넌트 활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
