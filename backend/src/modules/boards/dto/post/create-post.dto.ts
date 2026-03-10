import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsIn, MaxLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({
    description: '게시글 제목',
    example: '3월 전사 공지사항',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: '게시글 내용 (HTML 허용)',
    example: '안내 사항입니다.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '공지글 여부 (0: 일반, 1: 공지 - 목록 최상단 고정)',
    required: false,
    default: 0,
    enum: [0, 1],
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  @Type(() => Number)
  isNotice?: number;

  @ApiProperty({
    description: '게시 시작 시간 (null 또는 미입력 시 즉시 노출)',
    required: false,
    example: '2026-03-06T00:00:00',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  startDtm?: string | null;

  @ApiProperty({
    description: '게시 종료 시간 (null 또는 미입력 시 기간 제한 없음)',
    required: false,
    example: null,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  endDtm?: string | null;
}
