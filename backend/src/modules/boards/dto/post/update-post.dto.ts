import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsIn, MaxLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePostDto {
  @ApiProperty({
    description: '게시글 제목',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: '게시글 내용',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: '공지글 여부 (0: 일반, 1: 공지)',
    required: false,
    enum: [0, 1],
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  @Type(() => Number)
  isNotice?: number;

  @ApiProperty({
    description: '활성 여부 (0: 비활성, 1: 활성)',
    required: false,
    enum: [0, 1],
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  @Type(() => Number)
  isActive?: number;

  @ApiProperty({
    description: '게시 시작 시간 (null로 설정하면 즉시 노출)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  startDtm?: string | null;

  @ApiProperty({
    description: '게시 종료 시간 (null로 설정하면 기간 제한 없음)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  endDtm?: string | null;
}
