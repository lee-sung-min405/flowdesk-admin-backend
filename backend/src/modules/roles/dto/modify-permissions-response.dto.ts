import { ApiProperty } from '@nestjs/swagger';

export class ModifyPermissionsResponseDto {
  @ApiProperty({
    description: '추가된 권한 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  added: number[];

  @ApiProperty({
    description: '제거된 권한 ID 목록',
    example: [4, 5],
    type: [Number],
  })
  removed: number[];

  @ApiProperty({
    description: '이미 존재하여 추가하지 않은 권한 ID 목록',
    example: [6],
    type: [Number],
  })
  alreadyExists: number[];

  @ApiProperty({
    description: '존재하지 않아 제거하지 못한 권한 ID 목록',
    example: [7],
    type: [Number],
  })
  notFound: number[];

  @ApiProperty({
    description: '최종 권한 개수',
    example: 10,
  })
  totalCount: number;
}
