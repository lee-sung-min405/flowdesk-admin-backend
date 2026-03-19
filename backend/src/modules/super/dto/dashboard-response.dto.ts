import { ApiProperty } from '@nestjs/swagger';

// ──────────────────────────────────────────
// 시스템 개요
// ──────────────────────────────────────────

export class DashboardOverviewDto {
  @ApiProperty({ description: '시스템에 등록된 전체 테넌트(회사) 수 (활성+비활성 포함)', example: 10 })
  totalTenants: number;

  @ApiProperty({ description: '현재 활성 상태(isActive=1)인 테넌트 수', example: 8 })
  activeTenants: number;

  @ApiProperty({ description: '모든 테넌트를 합산한 전체 사용자 계정 수 (활성+비활성 포함)', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: '현재 활성 상태(isActive=1)인 사용자 수', example: 120 })
  activeUsers: number;

  @ApiProperty({ description: '모든 테넌트를 합산한 전체 상담 접수 건수', example: 500 })
  totalCounsels: number;

  @ApiProperty({ description: '모든 테넌트를 합산한 전체 게시글 수', example: 80 })
  totalPosts: number;

  @ApiProperty({ description: '모든 테넌트에서 정의된 역할(Role) 총 수', example: 15 })
  totalRoles: number;

  @ApiProperty({ description: '시스템 전역 권한 카탈로그(Page+Action 조합) 총 수', example: 100 })
  totalPermissions: number;
}

// ──────────────────────────────────────────
// 오늘의 요약
// ──────────────────────────────────────────

export class DashboardTodayDto {
  @ApiProperty({ description: '오늘(00:00 이후) 가입한 신규 사용자 수 — User.regDtm 기준', example: 3 })
  newUsers: number;

  @ApiProperty({ description: '오늘(00:00 이후) 접수된 신규 상담 건수 — Counsel.regDtm 기준', example: 12 })
  newCounsels: number;

  @ApiProperty({ description: '오늘(00:00 이후) 작성된 신규 게시글 수 — Post.createdAt 기준', example: 5 })
  newPosts: number;

  @ApiProperty({ description: '현재 유효한 활성 세션 수 — 만료되지 않고(expiresAt > now) 폐기되지 않은(revoked=0) 리프레시 토큰 수', example: 45 })
  activeSessions: number;
}

// ──────────────────────────────────────────
// 월별 추이
// ──────────────────────────────────────────

export class MonthlyTrendItemDto {
  @ApiProperty({ description: '해당 월 (YYYY-MM 형식). 데이터가 없는 달도 count=0으로 포함', example: '2026-03' })
  month: string;

  @ApiProperty({ description: '해당 월의 건수 (신규 등록/접수/생성 수)', example: 15 })
  count: number;
}

export class DashboardMonthlyTrendsDto {
  @ApiProperty({
    description: '월별 신규 사용자 가입 수 추이 (최근 12개월) — User.regDtm 기준 GROUP BY 월',
    type: [MonthlyTrendItemDto],
  })
  userRegistrations: MonthlyTrendItemDto[];

  @ApiProperty({
    description: '월별 신규 상담 접수 수 추이 (최근 12개월) — Counsel.regDtm 기준 GROUP BY 월',
    type: [MonthlyTrendItemDto],
  })
  counselRegistrations: MonthlyTrendItemDto[];

  @ApiProperty({
    description: '월별 신규 테넌트 생성 수 추이 (최근 12개월) — Tenant.createdAt 기준 GROUP BY 월',
    type: [MonthlyTrendItemDto],
  })
  tenantRegistrations: MonthlyTrendItemDto[];
}

// ──────────────────────────────────────────
// 보안 현황
// ──────────────────────────────────────────

export class DashboardSecurityDto {
  @ApiProperty({ description: '모든 테넌트 합산 차단 IP 총 수 (block_ip 테이블 전체 레코드)', example: 25 })
  totalBlockedIps: number;

  @ApiProperty({ description: '모든 테넌트 합산 차단 전화번호 총 수 (block_hp 테이블 전체 레코드)', example: 10 })
  totalBlockedHps: number;

  @ApiProperty({ description: '모든 테넌트 합산 차단 금칙어 총 수 (block_word 테이블 전체 레코드)', example: 30 })
  totalBlockedWords: number;

  @ApiProperty({ description: '최근 7일 이내 신규 등록된 차단 IP 수 — BlockIp.createdAt 기준', example: 5 })
  recentBlockedIps: number;

  @ApiProperty({ description: '최근 7일 이내 신규 등록된 차단 전화번호 수 — BlockHp.createdAt 기준', example: 2 })
  recentBlockedHps: number;
}

// ──────────────────────────────────────────
// 테넌트별 상세 통계
// ──────────────────────────────────────────

export class TenantStatsItemDto {
  @ApiProperty({ description: '테넌트 고유 식별자 (tenants.tenant_id)', example: 1 })
  tenantId: number;

  @ApiProperty({ description: '테넌트(회사)명', example: '마케팅솔루션' })
  tenantName: string;

  @ApiProperty({ description: '테넌트 활성 상태 (1=서비스 이용 중, 0=비활성/정지)', example: 1 })
  isActive: number;

  @ApiProperty({ description: '테넌트 최초 생성 일시 (회원가입 시점)', example: '2026-01-15T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '해당 테넌트에 소속된 전체 사용자 수 (활성+비활성)', example: 12 })
  userCount: number;

  @ApiProperty({ description: '해당 테넌트에서 현재 활성 상태(isActive=1)인 사용자 수', example: 10 })
  activeUserCount: number;

  @ApiProperty({ description: '해당 테넌트에 접수된 전체 상담 건수', example: 150 })
  counselCount: number;

  @ApiProperty({ description: '해당 테넌트의 오늘(00:00 이후) 접수된 상담 건수', example: 5 })
  todayCounselCount: number;

  @ApiProperty({ description: '해당 테넌트의 전체 게시글 수', example: 20 })
  postCount: number;

  @ApiProperty({ description: '해당 테넌트에서 정의한 역할(Role) 수', example: 3 })
  roleCount: number;

  @ApiProperty({ description: '해당 테넌트에 등록된 웹사이트(상담 유입 채널) 수', example: 2 })
  websiteCount: number;

  @ApiProperty({ description: '해당 테넌트에서 등록한 차단 IP 수', example: 5 })
  blockedIpCount: number;

  @ApiProperty({ description: '해당 테넌트에서 등록한 차단 전화번호 수', example: 3 })
  blockedHpCount: number;

  @ApiProperty({ description: '해당 테넌트에서 등록한 차단 금칙어 수', example: 8 })
  blockedWordCount: number;

  @ApiProperty({ description: '해당 테넌트 소속 사용자의 현재 활성 세션 수 (유효 리프레시 토큰 기준)', example: 4 })
  activeSessionCount: number;
}

// ──────────────────────────────────────────
// 대시보드 최종 응답
// ──────────────────────────────────────────

export class DashboardStatsResponseDto {
  @ApiProperty({ description: '시스템 전체 개요 — 테넌트·사용자·상담·게시글·역할·권한의 총 수', type: DashboardOverviewDto })
  overview: DashboardOverviewDto;

  @ApiProperty({ description: '오늘(서버 기준 00:00~현재) 발생한 주요 활동 요약', type: DashboardTodayDto })
  today: DashboardTodayDto;

  @ApiProperty({ description: '최근 12개월간 사용자 가입·상담 접수·테넌트 생성의 월별 추이 (차트 렌더링용, 빈 달은 count=0)', type: DashboardMonthlyTrendsDto })
  monthlyTrends: DashboardMonthlyTrendsDto;

  @ApiProperty({ description: '보안 차단 현황 — 전체 차단 수 및 최근 7일 신규 차단 수', type: DashboardSecurityDto })
  security: DashboardSecurityDto;

  @ApiProperty({
    description: '테넌트별 상세 통계 — 각 테넌트의 사용자·상담·게시글·역할·웹사이트·보안·세션 현황 (tenantId ASC 정렬)',
    type: [TenantStatsItemDto],
  })
  tenantStats: TenantStatsItemDto[];
}
