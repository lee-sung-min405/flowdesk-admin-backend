import { ApiProperty } from '@nestjs/swagger';

export class PostListItemDto {
  @ApiProperty({ description: '게시글 ID', example: 1 })
  postId: number;

  @ApiProperty({ description: '게시판 ID', example: 1 })
  boardId: number;

  @ApiProperty({ description: '작성자 userSeq', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '게시글 제목', example: '3월 전사 공지사항' })
  title: string;

  @ApiProperty({ description: '공지글 여부 (1: 공지, 0: 일반)', example: 0 })
  isNotice: number;

  @ApiProperty({ description: '활성 여부 (1: 활성, 0: 비활성)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '게시 시작 시간', example: null, nullable: true })
  startDtm: Date | null;

  @ApiProperty({ description: '게시 종료 시간', example: null, nullable: true })
  endDtm: Date | null;

  @ApiProperty({ description: '작성 일시', example: '2026-03-01T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시', example: '2026-03-01T09:00:00.000Z' })
  updatedAt: Date;
}
