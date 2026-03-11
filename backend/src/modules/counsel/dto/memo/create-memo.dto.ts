import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateMemoDto {
  @ApiProperty({ description: '메모 내용', example: '고객이 오후 2시에 다시 연락 요청' })
  @IsString()
  @MaxLength(65535)
  memoText: string;
}
