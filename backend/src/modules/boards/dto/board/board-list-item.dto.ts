import { ApiProperty } from '@nestjs/swagger';

export class BoardListItemDto {
  @ApiProperty({ description: '게시판 ID', example: 1 })
  boardId: number;

  @ApiProperty({ description: '게시판 키', example: 'notice' })
  boardKey: string;

  @ApiProperty({ description: '게시판 이름', example: '공지사항' })
  name: string;

  @ApiProperty({ description: '게시판 설명', example: '전사 공지사항 게시판', nullable: true })
  description: string | null;

  @ApiProperty({ description: '활성 여부 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '정렬 순서', example: 1, nullable: true })
  sortOrder: number | null;

  @ApiProperty({ description: '생성 일시', example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시', example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
