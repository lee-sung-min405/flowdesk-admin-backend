import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CounselLogDto {
  @ApiProperty({ description: '상담 시퀀스', example: 1 })
  counselSeq: number;

  @ApiProperty({ description: '로그 번호', example: 1 })
  logNo: number;

  @ApiProperty({ description: '상태 ID', example: 2 })
  counselStat: number;

  @ApiPropertyOptional({ description: '상태명 (조인)', example: '진행중', nullable: true })
  statusName: string | null;

  @ApiProperty({ description: '등록 일시' })
  regDtm: Date;
}
