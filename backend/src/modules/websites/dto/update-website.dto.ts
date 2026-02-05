import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebsiteDto {
  @ApiPropertyOptional({
    description: '담당 사용자 시퀀스',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  userSeq?: number;

  @ApiPropertyOptional({
    description: '웹사이트 URL',
    example: 'https://example.com',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  webUrl?: string;

  @ApiPropertyOptional({
    description: '웹사이트 제목',
    example: '예제 웹사이트',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  webTitle?: string;

  @ApiPropertyOptional({
    description: '웹사이트 이미지 URL',
    example: '/images/site001.png',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  webImg?: string;

  @ApiPropertyOptional({
    description: '웹사이트 설명',
    example: '예제 웹사이트 설명입니다.',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  webDesc?: string;

  @ApiPropertyOptional({
    description: '웹사이트 메모',
    example: '관리자 메모',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  webMemo?: string;

  @ApiPropertyOptional({
    description: '활성화 여부 (1: 활성, 0: 비활성)',
    example: 1,
  })
  @IsOptional()
  @IsIn([0, 1])
  isActive?: number;

  @ApiPropertyOptional({
    description: '중복 허용 기간 (일 단위)',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duplicateAllowAfterDays?: number;
}
