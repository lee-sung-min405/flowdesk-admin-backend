import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsResponseDto {
  @ApiProperty({ description: '전체 테넌트 수', example: 10 })
  totalTenants: number;

  @ApiProperty({ description: '활성 테넌트 수', example: 8 })
  activeTenants: number;

  @ApiProperty({ description: '전체 사용자 수', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: '전체 페이지 수', example: 25 })
  totalPages: number;

  @ApiProperty({ description: '전체 액션 수', example: 5 })
  totalActions: number;

  @ApiProperty({ description: '전체 권한 수', example: 100 })
  totalPermissions: number;

  @ApiProperty({ description: '전체 역할 수', example: 15 })
  totalRoles: number;
}
