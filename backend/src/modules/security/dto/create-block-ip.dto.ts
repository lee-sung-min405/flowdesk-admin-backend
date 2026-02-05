import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockIpDto {
  @ApiProperty({
    description: '차단할 IP 주소 (IPv4 또는 IPv6)',
    example: '192.168.1.100',
    examples: {
      'IPv4': { value: '192.168.1.100' },
      'IPv6': { value: '2001:db8::1' },
      'CIDR': { value: '192.168.0.0/24' },
    },
    maxLength: 45,
  })
  @IsString()
  @MaxLength(45)
  blockIp: string;

  @ApiPropertyOptional({
    description: '차단 사유 (관리자 메모용, 차단 여부 확인 시 함께 반환됨)',
    example: '악성 트래픽 발생',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    description: '활성화 여부 (1: 활성-차단중, 0: 비활성-차단해제)',
    example: 1,
    default: 1,
    enum: [0, 1],
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}
