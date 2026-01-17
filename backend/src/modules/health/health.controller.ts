import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import HealthResponseDto from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '서비스 상태 조회' })
  @ApiOkResponse({ description: '헬스 체크 응답', type: HealthResponseDto })
  async health(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
