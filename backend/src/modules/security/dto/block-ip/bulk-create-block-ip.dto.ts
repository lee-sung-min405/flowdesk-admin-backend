import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class BulkCreateBlockIpDto {
  @ApiProperty({
    description: `차단할 IP 주소 목록\n\n**입력 형식 안내:**\n- 한 줄에 하나의 IP 주소를 입력\n- 쉼표(,)로 구분하여 입력 가능\n- IPv4와 IPv6 주소 모두 지원\n\n**예시:**\n\`\`\`\n192.168.1.1\n192.168.1.2,192.168.1.3\n2001:db8::1\n\`\`\``,
    example: '192.168.1.1\n192.168.1.2\n2001:db8::1',
  })
  @IsString()
  ips: string;

  @ApiPropertyOptional({
    description: '차단 사유 (모든 IP에 동일하게 적용됨)',
    example: '악성 트래픽',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: '활성 상태 (1: 활성-차단중, 0: 비활성-차단해제)',
    example: 1,
    default: 1,
    enum: [0, 1],
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;
}

export class BulkCreateBlockIpResponseDto {
  @ApiProperty({ description: '등록 성공한 IP 수', example: 10 })
  successCount: number;

  @ApiProperty({ description: '건너뛴 IP 수 (중복 등)', example: 2 })
  skippedCount: number;

  @ApiProperty({ description: '총 처리한 IP 수', example: 12 })
  totalCount: number;

  @ApiPropertyOptional({
    description: '건너뛴 IP 목록',
    example: ['192.168.1.1', '2001:db8::1'],
  })
  skippedIps?: string[];
}
