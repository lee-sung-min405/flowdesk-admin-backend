import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CounselLogDto } from '../status/counsel-log.dto';
import { CounselMemoDto } from '../memo/counsel-memo.dto';

export class CounselFieldValueResponseDto {
  @ApiProperty({ description: '필드 ID', example: 1 })
  fieldId: number;

  @ApiProperty({ description: '필드 키', example: 'address' })
  fieldKey: string;

  @ApiProperty({ description: '필드 라벨', example: '주소' })
  label: string;

  @ApiProperty({ description: '필드 타입', example: 'text' })
  fieldType: string;

  @ApiPropertyOptional({ description: '텍스트 값', example: '서울시 강남구', nullable: true })
  valueText: string | null;

  @ApiPropertyOptional({ description: '숫자 값', example: 35, nullable: true })
  valueNumber: number | null;

  @ApiPropertyOptional({ description: '날짜 값 (YYYY-MM-DD)', example: '2026-03-15', nullable: true })
  valueDate: string | null;

  @ApiPropertyOptional({ description: '일시 값 (ISO 8601)', example: '2026-03-15T14:00:00.000Z', nullable: true })
  valueDatetime: string | null;
}

export class CounselListItemDto {
  @ApiProperty({ description: '상담 시퀀스', example: 1 })
  counselSeq: number;

  @ApiProperty({ description: '웹사이트 코드', example: 'WEB001' })
  webCode: string;

  @ApiPropertyOptional({ description: '상담자 이름', example: '홍길동', nullable: true })
  name: string | null;

  @ApiProperty({ description: '상담자 전화번호', example: '010-1234-5678' })
  counselHp: string;

  @ApiProperty({ description: '상담 상태 ID', example: 1 })
  counselStat: number;

  @ApiPropertyOptional({ description: '상태명 (조인)', example: '접수', nullable: true })
  statusName: string | null;

  @ApiPropertyOptional({ description: '담당자 userSeq', example: 5, nullable: true })
  empSeq: number | null;

  @ApiPropertyOptional({ description: '담당자명 (조인)', example: '김직원', nullable: true })
  empName: string | null;

  @ApiProperty({ description: '중복 상태', example: 'N' })
  duplicateState: string;

  @ApiPropertyOptional({ description: '예약 일시', example: '2026-03-15T14:00:00.000Z', nullable: true })
  counselResvDtm: Date | null;

  @ApiProperty({ description: '등록 일시' })
  regDtm: Date;

  @ApiProperty({ description: '수정 일시' })
  editDtm: Date;

  @ApiProperty({
    description: '동적 필드 값 목록',
    type: [CounselFieldValueResponseDto],
    example: [
      {
        fieldId: 1,
        fieldKey: 'address',
        label: '주소',
        fieldType: 'text',
        valueText: '서울시 강남구',
        valueNumber: null,
        valueDate: null,
        valueDatetime: null,
      },
      {
        fieldId: 2,
        fieldKey: 'age',
        label: '나이',
        fieldType: 'number',
        valueText: null,
        valueNumber: 35,
        valueDate: null,
        valueDatetime: null,
      },
    ],
  })
  fieldValues: CounselFieldValueResponseDto[];
}

export class CounselDetailDto extends CounselListItemDto {
  @ApiProperty({ description: '상담자 IP', example: '192.168.1.1' })
  counselIp: string;

  @ApiPropertyOptional({ description: 'UTM 소스', nullable: true })
  counselSource: string | null;

  @ApiPropertyOptional({ description: 'UTM 매체', nullable: true })
  counselMedium: string | null;

  @ApiPropertyOptional({ description: 'UTM 캠페인', nullable: true })
  counselCampaign: string | null;

  @ApiPropertyOptional({ description: '상담 메모', nullable: true })
  counselMemo: string | null;

  @ApiProperty({ description: '상태 변경 이력', type: [CounselLogDto] })
  logs: CounselLogDto[];

  @ApiProperty({ description: '메모 목록', type: [CounselMemoDto] })
  memos: CounselMemoDto[];
}
