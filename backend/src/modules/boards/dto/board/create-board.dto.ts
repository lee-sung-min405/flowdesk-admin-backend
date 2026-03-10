import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBoardDto {
  @ApiProperty({
    description: '게시판 키 (slug 형식: 소문자·숫자·하이픈만 허용, 테넌트 내 유일)',
    example: 'notice',
    maxLength: 64,
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'boardKey는 소문자, 숫자, 하이픈만 허용됩니다 (slug 형식)',
  })
  boardKey: string;

  @ApiProperty({
    description: '게시판 이름',
    example: '공지사항',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: '게시판 설명',
    required: false,
    example: '전사 공지사항 게시판',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: '정렬 순서 (낮을수록 앞에 표시)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
