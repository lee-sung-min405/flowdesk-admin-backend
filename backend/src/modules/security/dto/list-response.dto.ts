import { ApiProperty } from '@nestjs/swagger';
import { BlockIpResponseDto } from './block-ip-response.dto';
import { BlockHpResponseDto } from './block-hp-response.dto';
import { BlockWordResponseDto } from './block-word-response.dto';
import { PageInfoDto } from './page-info.dto';

export class BlockIpListResponseDto {
  @ApiProperty({ type: [BlockIpResponseDto] })
  items: BlockIpResponseDto[];

  @ApiProperty({ type: PageInfoDto })
  pageInfo: PageInfoDto;
}

export class BlockHpListResponseDto {
  @ApiProperty({ type: [BlockHpResponseDto] })
  items: BlockHpResponseDto[];

  @ApiProperty({ type: PageInfoDto })
  pageInfo: PageInfoDto;
}

export class BlockWordListResponseDto {
  @ApiProperty({ type: [BlockWordResponseDto] })
  items: BlockWordResponseDto[];

  @ApiProperty({ type: PageInfoDto })
  pageInfo: PageInfoDto;
}
