import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ComponentStatus {
  @ApiProperty({ example: 'up', description: '서비스 상태 (up/down/unknown)' })
  status: 'up' | 'down' | 'unknown';

  @ApiPropertyOptional({ example: '', description: '해당 컴포넌트의 상세 메시지(오류 사유 등)' })
  message?: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: '전체 서비스 상태 (ok: 정상, error: 일부 장애)' })
  status: 'ok' | 'error';

  @ApiProperty({ example: 123, description: '프로세스가 실행된 시간(초 단위)' })
  uptime: number;

  @ApiProperty({ example: 'development', description: '애플리케이션 실행 환경 이름' })
  env: string;

  @ApiProperty({ description: '컴포넌트(데이터베이스 등) 별 헬스 상세 정보' })
  details: {
    database: ComponentStatus;
    [key: string]: any;
  };
}

export default HealthResponseDto;
