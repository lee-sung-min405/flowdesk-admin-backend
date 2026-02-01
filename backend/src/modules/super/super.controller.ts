import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { SuperService } from './super.service';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Super Admin (슈퍼 관리자 전용)')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({
  description: '인증 실패 (AUTH001) - 토큰 없음/만료/위조',
  type: StandardErrorResponseDto,
})
@ApiForbiddenResponse({
  description: '권한 없음 (AUTH101) - super.dashboard 권한 필요',
  type: StandardErrorResponseDto,
})
@Controller('super')
export class SuperController {
  constructor(private readonly superService: SuperService) {}

  @Get('dashboard')
  @RequireAuth('super.dashboard', 'read')
  @ApiOperation({ summary: '슈퍼 관리자 대시보드 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '대시보드 통계 조회 성공',
    type: DashboardStatsResponseDto,
  })
  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    return this.superService.getDashboardStats();
  }
}
