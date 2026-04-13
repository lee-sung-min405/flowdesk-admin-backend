import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counsel, DeleteState } from '../entities/counsel.entity';
import { TenantStatus } from '../../tenants/entities/tenant-status.entity';
import { Website } from '../../websites/entities/website.entity';
import { CounselDashboardQueryDto } from '../dto/dashboard/counsel-dashboard-query.dto';
import {
  CounselDashboardResponseDto,
  CounselDashboardSummaryDto,
  StatusDistributionItemDto,
  EmployeeStatsItemDto,
  DailyTrendItemDto,
  WebsiteStatsItemDto,
  HourlyDistributionItemDto,
  UpcomingReservationItemDto,
} from '../dto/dashboard/counsel-dashboard-response.dto';

@Injectable()
export class CounselDashboardService {
  constructor(
    @InjectRepository(Counsel)
    private readonly counselRepository: Repository<Counsel>,
    @InjectRepository(TenantStatus)
    private readonly tenantStatusRepository: Repository<TenantStatus>,
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
  ) {}

  /**
   * 상담 대시보드 통계 조회
   * @param tenantId 테넌트 ID
   * @param query 날짜 범위 쿼리
   * @param empSeqFilter 담당자 필터 (비관리자는 자신의 userSeq만)
   */
  async getDashboard(
    tenantId: number,
    query: CounselDashboardQueryDto,
    empSeqFilter?: number,
  ): Promise<CounselDashboardResponseDto> {
    const startDtm = query.startDate ? `${query.startDate} 00:00:00` : undefined;
    const endDtm = query.endDate ? `${query.endDate} 23:59:59` : undefined;

    const [
      summary,
      statusDistribution,
      employeeStats,
      dailyTrends,
      topWebsites,
      hourlyDistribution,
      upcomingReservations,
    ] = await Promise.all([
      this.getSummary(tenantId, startDtm, endDtm, empSeqFilter),
      this.getStatusDistribution(tenantId, startDtm, endDtm, empSeqFilter),
      this.getEmployeeStats(tenantId, startDtm, endDtm, empSeqFilter),
      this.getDailyTrends(tenantId, startDtm, endDtm, query.startDate, query.endDate, empSeqFilter),
      this.getTopWebsites(tenantId, startDtm, endDtm, empSeqFilter),
      this.getHourlyDistribution(tenantId, startDtm, endDtm, empSeqFilter),
      this.getUpcomingReservations(tenantId, empSeqFilter),
    ]);

    return {
      summary,
      statusDistribution,
      employeeStats,
      dailyTrends,
      topWebsites,
      hourlyDistribution,
      upcomingReservations,
    };
  }

  // ──────────────────────────────────────────
  // 요약 카드
  // ──────────────────────────────────────────

  private async getSummary(
    tenantId: number,
    startDtm?: string,
    endDtm?: string,
    empSeqFilter?: number,
  ): Promise<CounselDashboardSummaryDto> {
    // 해당 테넌트의 WON, LOST statusKey에 해당하는 ID 조회
    const completionStatuses = await this.tenantStatusRepository
      .createQueryBuilder('ts')
      .select('ts.tenantStatusId')
      .where('ts.tenantId = :tenantId', { tenantId })
      .andWhere('ts.statusGroup = :group', { group: 'counsel' })
      .andWhere('ts.statusKey IN (:...keys)', { keys: ['WON', 'LOST'] })
      .getMany();
    const completionStatIds = completionStatuses.map((s) => s.tenantStatusId);

    const newStatus = await this.tenantStatusRepository.findOne({
      where: { tenantId, statusGroup: 'counsel', statusKey: 'NEW' },
    });

    const qb = this.counselRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'total')
      .addSelect(
        newStatus
          ? `SUM(CASE WHEN c.counsel_stat = ${newStatus.tenantStatusId} THEN 1 ELSE 0 END)`
          : '0',
        'newCount',
      )
      .addSelect(
        completionStatIds.length > 0
          ? `SUM(CASE WHEN c.counsel_stat IN (${completionStatIds.join(',')}) THEN 1 ELSE 0 END)`
          : '0',
        'completedCount',
      )
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N });

    if (startDtm) {
      qb.andWhere('c.reg_dtm >= :startDtm', { startDtm });
    }
    if (endDtm) {
      qb.andWhere('c.reg_dtm <= :endDtm', { endDtm });
    }
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const result = await qb.getRawOne();
    const total = Number(result.total) || 0;
    const newCount = Number(result.newCount) || 0;
    const completedCount = Number(result.completedCount) || 0;

    return {
      totalCounsels: total,
      newCounsels: newCount,
      completedCounsels: completedCount,
      completionRate: total > 0 ? Math.round((completedCount / total) * 1000) / 10 : 0,
    };
  }

  // ──────────────────────────────────────────
  // 상태별 분포
  // ──────────────────────────────────────────

  private async getStatusDistribution(
    tenantId: number,
    startDtm?: string,
    endDtm?: string,
    empSeqFilter?: number,
  ): Promise<StatusDistributionItemDto[]> {
    const qb = this.counselRepository
      .createQueryBuilder('c')
      .innerJoin('c.status', 'ts', 'ts.tenantId = c.tenantId')
      .select('c.counsel_stat', 'counselStat')
      .addSelect('ts.status_name', 'statusName')
      .addSelect('ts.color', 'color')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N })
      .groupBy('c.counsel_stat')
      .addGroupBy('ts.status_name')
      .addGroupBy('ts.color')
      .orderBy('COUNT(*)', 'DESC');

    if (startDtm) {
      qb.andWhere('c.reg_dtm >= :startDtm', { startDtm });
    }
    if (endDtm) {
      qb.andWhere('c.reg_dtm <= :endDtm', { endDtm });
    }
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      counselStat: Number(r.counselStat),
      statusName: r.statusName,
      color: r.color ?? null,
      count: Number(r.count),
    }));
  }

  // ──────────────────────────────────────────
  // 담당자별 현황
  // ──────────────────────────────────────────

  private async getEmployeeStats(
    tenantId: number,
    startDtm?: string,
    endDtm?: string,
    empSeqFilter?: number,
  ): Promise<EmployeeStatsItemDto[]> {
    const qb = this.counselRepository
      .createQueryBuilder('c')
      .leftJoin('c.employee', 'emp', 'emp.tenantId = c.tenantId')
      .select('c.emp_seq', 'empSeq')
      .addSelect('emp.user_name', 'empName')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N })
      .groupBy('c.emp_seq')
      .addGroupBy('emp.user_name')
      .orderBy('COUNT(*)', 'DESC');

    if (startDtm) {
      qb.andWhere('c.reg_dtm >= :startDtm', { startDtm });
    }
    if (endDtm) {
      qb.andWhere('c.reg_dtm <= :endDtm', { endDtm });
    }
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      empSeq: r.empSeq !== null ? Number(r.empSeq) : null,
      empName: r.empName ?? '미배정',
      count: Number(r.count),
    }));
  }

  // ──────────────────────────────────────────
  // 일별 상담 추이
  // ──────────────────────────────────────────

  private async getDailyTrends(
    tenantId: number,
    startDtm?: string,
    endDtm?: string,
    startDate?: string,
    endDate?: string,
    empSeqFilter?: number,
  ): Promise<DailyTrendItemDto[]> {
    const qb = this.counselRepository
      .createQueryBuilder('c')
      .select('DATE(c.reg_dtm)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N })
      .groupBy('DATE(c.reg_dtm)')
      .orderBy('DATE(c.reg_dtm)', 'ASC');

    if (startDtm) {
      qb.andWhere('c.reg_dtm >= :startDtm', { startDtm });
    }
    if (endDtm) {
      qb.andWhere('c.reg_dtm <= :endDtm', { endDtm });
    }
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const rows = await qb.getRawMany();
    const dataMap = new Map<string, number>();
    for (const r of rows) {
      const dateStr = r.date instanceof Date ? this.formatDate(r.date) : String(r.date);
      dataMap.set(dateStr, Number(r.count));
    }

    // 날짜 범위가 지정된 경우 빈 날짜 포함하여 연속된 일별 데이터 생성
    if (startDate && endDate) {
      const result: DailyTrendItemDto[] = [];
      const cursor = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      while (cursor <= end) {
        const dateStr = this.formatDate(cursor);
        result.push({ date: dateStr, count: dataMap.get(dateStr) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      return result;
    }

    // 날짜 범위 미지정 시 데이터가 있는 날짜만 반환
    return rows.map((r) => ({
      date: r.date instanceof Date ? this.formatDate(r.date) : String(r.date),
      count: Number(r.count),
    }));
  }

  // ──────────────────────────────────────────
  // 웹사이트별 상담 (Top 5)
  // ──────────────────────────────────────────

  private async getTopWebsites(
    tenantId: number,
    startDtm?: string,
    endDtm?: string,
    empSeqFilter?: number,
  ): Promise<WebsiteStatsItemDto[]> {
    const qb = this.counselRepository
      .createQueryBuilder('c')
      .leftJoin('c.website', 'w')
      .select('c.web_code', 'webCode')
      .addSelect('w.web_title', 'webTitle')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N })
      .groupBy('c.web_code')
      .addGroupBy('w.web_title')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5);

    if (startDtm) {
      qb.andWhere('c.reg_dtm >= :startDtm', { startDtm });
    }
    if (endDtm) {
      qb.andWhere('c.reg_dtm <= :endDtm', { endDtm });
    }
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      webCode: r.webCode,
      webTitle: r.webTitle ?? null,
      count: Number(r.count),
    }));
  }

  // ──────────────────────────────────────────
  // 시간대별 상담 분포
  // ──────────────────────────────────────────

  private async getHourlyDistribution(
    tenantId: number,
    startDtm?: string,
    endDtm?: string,
    empSeqFilter?: number,
  ): Promise<HourlyDistributionItemDto[]> {
    const qb = this.counselRepository
      .createQueryBuilder('c')
      .select('HOUR(c.reg_dtm)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N })
      .groupBy('HOUR(c.reg_dtm)')
      .orderBy('HOUR(c.reg_dtm)', 'ASC');

    if (startDtm) {
      qb.andWhere('c.reg_dtm >= :startDtm', { startDtm });
    }
    if (endDtm) {
      qb.andWhere('c.reg_dtm <= :endDtm', { endDtm });
    }
    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const rows = await qb.getRawMany();
    const dataMap = new Map<number, number>();
    for (const r of rows) {
      dataMap.set(Number(r.hour), Number(r.count));
    }

    // 0~23시 전체 포함
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: dataMap.get(h) ?? 0,
    }));
  }

  // ──────────────────────────────────────────
  // 예정된 예약
  // ──────────────────────────────────────────

  private async getUpcomingReservations(
    tenantId: number,
    empSeqFilter?: number,
  ): Promise<UpcomingReservationItemDto[]> {
    const now = new Date();

    const qb = this.counselRepository
      .createQueryBuilder('c')
      .leftJoin('c.status', 'ts', 'ts.tenantId = c.tenantId')
      .leftJoin('c.employee', 'emp', 'emp.tenantId = c.tenantId')
      .select([
        'c.counsel_seq AS counselSeq',
        'c.name AS name',
        'c.counsel_hp AS counselHp',
        'c.counsel_resv_dtm AS counselResvDtm',
        'emp.user_name AS empName',
        'ts.status_name AS statusName',
      ])
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.delete_state = :deleteState', { deleteState: DeleteState.N })
      .andWhere('c.counsel_resv_dtm IS NOT NULL')
      .andWhere('c.counsel_resv_dtm >= :now', { now })
      .orderBy('c.counsel_resv_dtm', 'ASC')
      .limit(10);

    if (empSeqFilter !== undefined) {
      qb.andWhere('c.emp_seq = :empSeq', { empSeq: empSeqFilter });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      counselSeq: Number(r.counselSeq),
      name: r.name ?? null,
      counselHp: r.counselHp,
      counselResvDtm: r.counselResvDtm,
      empName: r.empName ?? null,
      statusName: r.statusName ?? '',
    }));
  }

  // ──────────────────────────────────────────
  // 유틸
  // ──────────────────────────────────────────

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
