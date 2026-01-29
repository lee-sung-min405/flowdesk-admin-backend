import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiOkResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import HealthResponseDto from './dto/health-response.dto';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ 
    summary: '서비스 상태 조회',
    description: '서버 상태, 가동 시간, 메모리 사용량 등을 확인합니다. 인증 불필요.',
  })
  @ApiOkResponse({ 
    description: '헬스 체크 성공', 
    type: HealthResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: '서버 오류 (SYS001) - 데이터베이스 연결 실패 등',
    type: StandardErrorResponseDto,
  })
  async health(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
