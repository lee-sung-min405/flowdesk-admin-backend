import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckBlockedResponseDto {
  @ApiProperty({ description: '차단 여부', example: true })
  isBlocked: boolean;

  @ApiPropertyOptional({ description: '차단 사유 (차단된 경우)', example: '악성 트래픽' })
  reason?: string | null;

  @ApiPropertyOptional({ description: '차단 ID (차단된 경우)', example: 1 })
  blockId?: number;

  @ApiPropertyOptional({ description: '매칭된 단어 (금칙어 차단의 경우)', example: '욕설' })
  matchedWord?: string;
}
