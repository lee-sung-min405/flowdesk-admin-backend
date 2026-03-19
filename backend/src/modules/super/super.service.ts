import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Counsel } from '../counsel/entities/counsel.entity';
import { Post } from '../boards/entities/post.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { BlockIp } from '../security/entities/block-ip.entity';
import { BlockHp } from '../security/entities/block-hp.entity';
import { BlockWord } from '../security/entities/block-word.entity';
import { Website } from '../websites/entities/website.entity'; // entity class used in subquery
import {
  DashboardStatsResponseDto,
  DashboardOverviewDto,
  DashboardTodayDto,
  DashboardMonthlyTrendsDto,
  DashboardSecurityDto,
  TenantStatsItemDto,
  MonthlyTrendItemDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class SuperService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Counsel)
    private readonly counselRepository: Repository<Counsel>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(BlockIp)
    private readonly blockIpRepository: Repository<BlockIp>,
    @InjectRepository(BlockHp)
    private readonly blockHpRepository: Repository<BlockHp>,
    @InjectRepository(BlockWord)
    private readonly blockWordRepository: Repository<BlockWord>,
  ) {}

  /**
   * 슈퍼 관리자 대시보드 통계 조회
   */
  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [overview, today, monthlyTrends, security, tenantStats] =
      await Promise.all([
        this.getOverview(),
        this.getToday(startOfToday),
        this.getMonthlyTrends(),
        this.getSecurity(sevenDaysAgo),
        this.getTenantStats(startOfToday),
      ]);

    return {
      overview,
      today,
      monthlyTrends,
      security,
      tenantStats,
    };
  }

  // ──────────────────────────────────────────
  // 시스템 개요
  // ──────────────────────────────────────────

  private async getOverview(): Promise<DashboardOverviewDto> {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalCounsels,
      totalPosts,
      totalRoles,
      totalPermissions,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { isActive: 1 } }),
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: 1 } }),
      this.counselRepository.count(),
      this.postRepository.count(),
      this.roleRepository.count(),
      this.permissionRepository.count(),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalCounsels,
      totalPosts,
      totalRoles,
      totalPermissions,
    };
  }

  // ──────────────────────────────────────────
  // 오늘의 요약
  // ──────────────────────────────────────────

  private async getToday(
    startOfToday: Date,
  ): Promise<DashboardTodayDto> {
    const [newUsers, newCounsels, newPosts, activeSessions] =
      await Promise.all([
        this.userRepository.count({
          where: { regDtm: MoreThanOrEqual(startOfToday) },
        }),
        this.counselRepository.count({
          where: { regDtm: MoreThanOrEqual(startOfToday) },
        }),
        this.postRepository.count({
          where: { createdAt: MoreThanOrEqual(startOfToday) },
        }),
        this.refreshTokenRepository
          .createQueryBuilder('rt')
          .where('rt.revoked = :revoked', { revoked: 0 })
          .andWhere('rt.expiresAt > :now', { now: new Date() })
          .getCount(),
      ]);

    return { newUsers, newCounsels, newPosts, activeSessions };
  }

  // ──────────────────────────────────────────
  // 월별 추이 (최근 12개월)
  // ──────────────────────────────────────────

  private async getMonthlyTrends(): Promise<DashboardMonthlyTrendsDto> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [userRegistrations, counselRegistrations, tenantRegistrations] =
      await Promise.all([
        this.getMonthlyTrend(
          'User',
          'u',
          'u.regDtm',
          'reg_dtm',
          twelveMonthsAgo,
        ),
        this.getMonthlyTrend(
          'Counsel',
          'c',
          'c.regDtm',
          'reg_dtm',
          twelveMonthsAgo,
        ),
        this.getMonthlyTrend(
          'Tenant',
          't',
          't.createdAt',
          'created_at',
          twelveMonthsAgo,
        ),
      ]);

    return {
      userRegistrations,
      counselRegistrations,
      tenantRegistrations,
    };
  }

  private async getMonthlyTrend(
    entity: string,
    alias: string,
    propertyPath: string,
    columnName: string,
    since: Date,
  ): Promise<MonthlyTrendItemDto[]> {
    const raw: { month: string; count: string }[] =
      await this.tenantRepository.manager
        .createQueryBuilder(entity, alias)
        .select(`DATE_FORMAT(${alias}.${columnName}, '%Y-%m')`, 'month')
        .addSelect('COUNT(*)', 'count')
        .where(`${propertyPath} >= :since`, { since })
        .groupBy('month')
        .orderBy('month', 'ASC')
        .getRawMany();

    return this.fillMissingMonths(raw, since);
  }

  private fillMissingMonths(
    raw: { month: string; count: string }[],
    since: Date,
  ): MonthlyTrendItemDto[] {
    const map = new Map<string, number>();
    for (const row of raw) {
      map.set(row.month, Number(row.count));
    }

    const result: MonthlyTrendItemDto[] = [];
    const cursor = new Date(since);
    const now = new Date();

    while (
      cursor.getFullYear() < now.getFullYear() ||
      (cursor.getFullYear() === now.getFullYear() &&
        cursor.getMonth() <= now.getMonth())
    ) {
      const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month, count: map.get(month) ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
  }

  // ──────────────────────────────────────────
  // 보안 현황
  // ──────────────────────────────────────────

  private async getSecurity(
    sevenDaysAgo: Date,
  ): Promise<DashboardSecurityDto> {
    const [
      totalBlockedIps,
      totalBlockedHps,
      totalBlockedWords,
      recentBlockedIps,
      recentBlockedHps,
    ] = await Promise.all([
      this.blockIpRepository.count(),
      this.blockHpRepository.count(),
      this.blockWordRepository.count(),
      this.blockIpRepository.count({
        where: { createdAt: MoreThanOrEqual(sevenDaysAgo) },
      }),
      this.blockHpRepository.count({
        where: { createdAt: MoreThanOrEqual(sevenDaysAgo) },
      }),
    ]);

    return {
      totalBlockedIps,
      totalBlockedHps,
      totalBlockedWords,
      recentBlockedIps,
      recentBlockedHps,
    };
  }

  // ──────────────────────────────────────────
  // 테넌트별 상세 통계
  // ──────────────────────────────────────────

  private async getTenantStats(
    startOfToday: Date,
  ): Promise<TenantStatsItemDto[]> {
    const now = new Date();

    const raw: {
      tenant_id: number;
      tenant_name: string;
      is_active: number;
      created_at: Date;
      userCount: string;
      activeUserCount: string;
      counselCount: string;
      todayCounselCount: string;
      postCount: string;
      roleCount: string;
      websiteCount: string;
      blockedIpCount: string;
      blockedHpCount: string;
      blockedWordCount: string;
      activeSessionCount: string;
    }[] = await this.tenantRepository
      .createQueryBuilder('t')
      .select('t.tenant_id', 'tenant_id')
      .addSelect('t.tenant_name', 'tenant_name')
      .addSelect('t.is_active', 'is_active')
      .addSelect('t.created_at', 'created_at')
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(User, 'u')
            .where('u.tenantId = t.tenant_id'),
        'userCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(User, 'u')
            .where('u.tenantId = t.tenant_id')
            .andWhere('u.isActive = 1'),
        'activeUserCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(Counsel, 'c')
            .where('c.tenantId = t.tenant_id'),
        'counselCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(Counsel, 'c')
            .where('c.tenantId = t.tenant_id')
            .andWhere('c.regDtm >= :startOfToday'),
        'todayCounselCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(Post, 'p')
            .where('p.tenantId = t.tenant_id'),
        'postCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(Role, 'r')
            .where('r.tenantId = t.tenant_id'),
        'roleCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(Website, 'w')
            .where('w.tenantId = t.tenant_id'),
        'websiteCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(BlockIp, 'bi')
            .where('bi.tenantId = t.tenant_id'),
        'blockedIpCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(BlockHp, 'bh')
            .where('bh.tenantId = t.tenant_id'),
        'blockedHpCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(BlockWord, 'bw')
            .where('bw.tenantId = t.tenant_id'),
        'blockedWordCount',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(RefreshToken, 'rt')
            .innerJoin(User, 'ru', 'ru.userSeq = rt.userSeq')
            .where('ru.tenantId = t.tenant_id')
            .andWhere('rt.revoked = 0')
            .andWhere('rt.expiresAt > :now'),
        'activeSessionCount',
      )
      .setParameters({ startOfToday, now })
      .orderBy('t.tenant_id', 'ASC')
      .getRawMany();

    return raw.map((row) => ({
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      isActive: Number(row.is_active),
      createdAt: row.created_at,
      userCount: Number(row.userCount),
      activeUserCount: Number(row.activeUserCount),
      counselCount: Number(row.counselCount),
      todayCounselCount: Number(row.todayCounselCount),
      postCount: Number(row.postCount),
      roleCount: Number(row.roleCount),
      websiteCount: Number(row.websiteCount),
      blockedIpCount: Number(row.blockedIpCount),
      blockedHpCount: Number(row.blockedHpCount),
      blockedWordCount: Number(row.blockedWordCount),
      activeSessionCount: Number(row.activeSessionCount),
    }));
  }
}
