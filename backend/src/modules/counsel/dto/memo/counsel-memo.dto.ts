import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CounselMemoDto {
  @ApiProperty({ description: '메모 로그 ID', example: 1 })
  memoLogId: number;

  @ApiProperty({ description: '상담 시퀀스', example: 1 })
  counselSeq: number;

  @ApiProperty({ description: '상태 ID (작성 시점)', example: 2 })
  statusId: number;

  @ApiPropertyOptional({ description: '상태명 (조인)', example: '진행중', nullable: true })
  statusName: string | null;

  @ApiProperty({ description: '메모 내용', example: '고객이 오후 2시에 다시 연락 요청' })
  memoText: string;

  @ApiPropertyOptional({ description: '작성자 userSeq', nullable: true })
  createdBy: number | null;

  @ApiPropertyOptional({ description: '작성자명 (조인)', example: '김직원', nullable: true })
  creatorName: string | null;

  @ApiProperty({ description: '작성 일시' })
  createdAt: Date;
}
