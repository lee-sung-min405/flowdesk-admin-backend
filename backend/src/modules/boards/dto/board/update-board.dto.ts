import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, Min, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBoardDto {
  @ApiProperty({
    description: '게시판 이름',
    required: false,
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiProperty({
    description: '게시판 설명 (null로 설정하면 삭제)',
    required: false,
    nullable: true,
    maxLength: 255,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({
    description: '정렬 순서',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

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
}
