import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ──────────────────────────────────────────
// 요약 카드
// ──────────────────────────────────────────

export class CounselDashboardSummaryDto {
  @ApiProperty({ description: '조회 기간 내 총 상담 건수', example: 150 })
  totalCounsels: number;

  @ApiProperty({ description: '조회 기간 내 신규 상담 건수 (NEW 상태 기준)', example: 45 })
  newCounsels: number;

  @ApiProperty({ description: '조회 기간 내 완료 건수 (WON + LOST 상태 기준)', example: 30 })
  completedCounsels: number;

  @ApiProperty({ description: '완료율 (%) — (완료 건수 / 총 건수) × 100, 소수점 1자리', example: 20.0 })
  completionRate: number;
}

// ──────────────────────────────────────────
// 상태별 분포
// ──────────────────────────────────────────

export class StatusDistributionItemDto {
  @ApiProperty({ description: '상태 ID (tenant_status_id)', example: 1 })
  counselStat: number;

  @ApiProperty({ description: '상태명', example: '신규접수' })
  statusName: string;

  @ApiPropertyOptional({ description: '상태 색상 코드', example: '#64748B', nullable: true })
  color: string | null;

  @ApiProperty({ description: '해당 상태 건수', example: 45 })
  count: number;
}

// ──────────────────────────────────────────
// 담당자별 현황
// ──────────────────────────────────────────

export class EmployeeStatsItemDto {
  @ApiPropertyOptional({ description: '담당자 userSeq (미배정 시 null)', example: 5, nullable: true })
  empSeq: number | null;

  @ApiProperty({ description: '담당자명 (미배정 시 "미배정")', example: '김직원' })
  empName: string;

  @ApiProperty({ description: '담당 상담 건수', example: 20 })
  count: number;
}

// ──────────────────────────────────────────
// 일별 상담 추이
// ──────────────────────────────────────────

export class DailyTrendItemDto {
  @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2026-03-01' })
  date: string;

  @ApiProperty({ description: '해당일 상담 건수', example: 5 })
  count: number;
}

// ──────────────────────────────────────────
// 웹사이트별 상담 (Top 5)
// ──────────────────────────────────────────

export class WebsiteStatsItemDto {
  @ApiProperty({ description: '웹사이트 코드', example: 'DEMO01' })
  webCode: string;

  @ApiPropertyOptional({ description: '웹사이트 제목', example: '데모 업체 홈페이지', nullable: true })
  webTitle: string | null;

  @ApiProperty({ description: '해당 웹사이트의 상담 건수', example: 30 })
  count: number;
}

// ──────────────────────────────────────────
// 시간대별 상담 분포
// ──────────────────────────────────────────

export class HourlyDistributionItemDto {
  @ApiProperty({ description: '시간대 (0~23)', example: 14 })
  hour: number;

  @ApiProperty({ description: '해당 시간대 상담 건수', example: 10 })
  count: number;
}

// ──────────────────────────────────────────
// 예정된 예약
// ──────────────────────────────────────────

export class UpcomingReservationItemDto {
  @ApiProperty({ description: '상담 시퀀스', example: 3 })
  counselSeq: number;

  @ApiPropertyOptional({ description: '상담자 이름', example: '박지민', nullable: true })
  name: string | null;

  @ApiProperty({ description: '상담자 전화번호', example: '010-4567-8901' })
  counselHp: string;

  @ApiProperty({ description: '예약 일시', example: '2026-03-25T10:00:00.000Z' })
  counselResvDtm: Date;

  @ApiPropertyOptional({ description: '담당자명', example: '김직원', nullable: true })
  empName: string | null;

  @ApiProperty({ description: '상태명', example: '상담예약' })
  statusName: string;
}

// ──────────────────────────────────────────
// 대시보드 전체 응답
// ──────────────────────────────────────────

export class CounselDashboardResponseDto {
  @ApiProperty({ description: '요약 카드', type: CounselDashboardSummaryDto })
  summary: CounselDashboardSummaryDto;

  @ApiProperty({ description: '상태별 분포', type: [StatusDistributionItemDto] })
  statusDistribution: StatusDistributionItemDto[];

  @ApiProperty({ description: '담당자별 현황', type: [EmployeeStatsItemDto] })
  employeeStats: EmployeeStatsItemDto[];

  @ApiProperty({ description: '일별 상담 추이', type: [DailyTrendItemDto] })
  dailyTrends: DailyTrendItemDto[];

  @ApiProperty({ description: '웹사이트별 상담 (Top 5)', type: [WebsiteStatsItemDto] })
  topWebsites: WebsiteStatsItemDto[];

  @ApiProperty({ description: '시간대별 상담 분포 (0~23시)', type: [HourlyDistributionItemDto] })
  hourlyDistribution: HourlyDistributionItemDto[];

  @ApiProperty({ description: '예정된 예약 목록 (오늘 이후, 최대 10건)', type: [UpcomingReservationItemDto] })
  upcomingReservations: UpcomingReservationItemDto[];
}
