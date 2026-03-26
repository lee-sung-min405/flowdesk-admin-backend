import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CounselService } from './services/counsel.service';
import { CounselStatusService } from './services/counsel-status.service';
import { CounselMemoService } from './services/counsel-memo.service';
import { CounselDashboardService } from './services/counsel-dashboard.service';
import { CreateCounselDto } from './dto/counsel/create-counsel.dto';
import { UpdateCounselDto } from './dto/counsel/update-counsel.dto';
import { CounselListQueryDto } from './dto/counsel/counsel-list-query.dto';
import { CounselDetailDto } from './dto/counsel/counsel-response.dto';
import { CounselListResponseDto } from './dto/counsel/counsel-list-response.dto';
import { CounselUpdateStatusDto } from './dto/status/update-status.dto';
import { CounselLogDto } from './dto/status/counsel-log.dto';
import { CreateMemoDto } from './dto/memo/create-memo.dto';
import { CounselMemoDto } from './dto/memo/counsel-memo.dto';
import { CounselDashboardQueryDto } from './dto/dashboard/counsel-dashboard-query.dto';
import { CounselDashboardResponseDto } from './dto/dashboard/counsel-dashboard-response.dto';
import { RequireAuth } from '../../common/decorators/require-auth.decorator';
import { StandardErrorResponseDto } from '../../common/dto/error-response.dto';
import { SafeUser } from '../auth/types/safe-user.type';

interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

@ApiTags('Counsels')
@Controller('counsels')
export class CounselController {
  constructor(
    private readonly counselService: CounselService,
    private readonly counselStatusService: CounselStatusService,
    private readonly counselMemoService: CounselMemoService,
    private readonly counselDashboardService: CounselDashboardService,
  ) {}

  // ──────────────────────────────────────────
  // Dashboard
  // ──────────────────────────────────────────

  @Get('dashboard')
  @RequireAuth('counsels.dashboard', 'read')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 대시보드 통계 조회',
    description: `테넌트 내 상담 통계 데이터를 조회합니다.

**권한:** counsels.dashboard.read

**데이터 범위:**
- \`counsels.admin\` 권한이 있는 사용자(관리자): 테넌트 전체 데이터 + 담당자별 현황
- \`counsels.admin\` 권한이 없는 사용자(일반): 자신에게 배정된 상담 데이터만 조회

**날짜 범위:**
- \`startDate\`/\`endDate\` 미지정 시 최근 30일 기준

**포함 통계:**
- 요약 카드 (총 건수, 신규, 완료, 완료율)
- 상태별 분포
- 담당자별 현황
- 일별 상담 추이
- 웹사이트별 상담 (Top 5)
- 시간대별 상담 분포 (0~23시)
- 예정된 예약 (오늘 이후, 최대 10건)`,
  })
  @ApiOkResponse({ description: '대시보드 조회 성공', type: CounselDashboardResponseDto })
  async getDashboard(
    @Req() request: AuthenticatedRequest,
    @Query() query: CounselDashboardQueryDto,
  ): Promise<CounselDashboardResponseDto> {
    const user = request.user;
    // counsels.admin 권한이 있으면 관리자 → 테넌트 전체 데이터
    // 없으면 일반 사용자 → 자신에게 배정된 데이터만
    const isAdmin = user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : user.userSeq;

    return this.counselDashboardService.getDashboard(
      user.tenantId,
      query,
      empSeqFilter,
    );
  }

  // ──────────────────────────────────────────
  // Counsel CRUD
  // ──────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: '상담 생성 (공개 API)',
    description: `랜딩페이지에서 호출하는 공개 API입니다. 인증이 필요하지 않습니다.

**인증:** 불필요
**tenantId:** webCode로부터 자동 추출
**counselIp:** 요청 IP에서 자동 감지

**검증 순서:**
1. webCode 유효성 → 400 (VAL001)
2. 차단된 전화번호 → 400 (VAL001)
3. 차단된 IP → 400 (VAL001)
4. 금칙어 (이름, 메모) → 400 (VAL001)
5. tenant_status에 statusKey='NEW', 'DUPLICATE' 설정 여부 → 400 (VAL001)
6. fieldValues의 fieldId가 해당 테넌트의 활성 필드인지 검증 → 400 (VAL001)
7. Advisory Lock 경합 (동일 webCode+전화번호+IP 동시 요청) → 409 (BIZ001)

**초기 상태 자동 배정 (counselStat 불필요):**
- 신규 상담 → tenant_status.status_key = 'NEW' 인 상태로 자동 배정
- 중복 상담 → tenant_status.status_key = 'DUPLICATE' 인 상태로 자동 배정

**날짜 형식:** counselResvDtm·valueDatetime은 ISO 8601, valueDate는 YYYY-MM-DD

**중복 신청 판별:**
- 동일 전화번호 + IP가 websites.duplicate_allow_after_days 이내에 존재하면 \`duplicateState = 'Y'\`로 저장
- 기간 초과 시 신규 상담(\`duplicateState = 'N'\`)으로 처리

**트랜잭션:** 상담 생성 + 동적 필드 값 저장 + 초기 상태 로그가 하나의 트랜잭션으로 처리됩니다.`,
  })
  @ApiCreatedResponse({ description: '상담 생성 성공', schema: { example: { message: '상담신청이 완료되었습니다.' } } })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 / webCode 미존재 / 차단된 전화번호·IP / 금칙어 / NEW·DUPLICATE statusKey 미설정 / 유효하지 않은 fieldId (VAL001)', type: StandardErrorResponseDto })
  @ApiConflictResponse({ description: 'Advisory Lock 경합 — 동일 요청이 처리 중 (BIZ001)', type: StandardErrorResponseDto })
  async create(
    @Req() request: Request,
    @Body() dto: CreateCounselDto,
  ): Promise<{ message: string }> {
    const clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || request.ip
      || 'unknown';
    return this.counselService.createCounsel(dto, clientIp);
  }

  @Get()
  @RequireAuth('counsels', 'read')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 목록 조회',
    description: `테넌트 내 상담 목록을 페이지네이션, 검색, 필터링과 함께 조회합니다.

**권한:** counsels.read

**데이터 범위:**
- \`counsels.admin\` 권한 보유 시: 테넌트 전체 상담 조회
- \`counsels.admin\` 권한 없음: 자신에게 배정된 상담만 조회

---

### 페이지네이션

| 파라미터 | 기본값 | 범위 | 설명 |
|---|---|---|---|
| \`page\` | 1 | ≥ 1 | 페이지 번호 |
| \`limit\` | 20 | 1 ~ 100 | 페이지당 항목 수 |

---

### 검색 (\`q\`)

\`name\`, \`counselHp\`, \`counselMemo\` 컬럼에 대해 **부분 일치(LIKE)** 검색을 수행합니다.

---

### 필터

| 파라미터 | 타입 | 설명 |
|---|---|---|
| \`counselStat\` | number | 상담 상태 ID (tenant_status.tenant_status_id) |
| \`empSeq\` | number | 담당자 userSeq |
| \`webCode\` | string | 웹사이트 코드 |
| \`duplicateState\` | \`Y\` \\| \`N\` | 중복 신청 여부 |
| \`startDate\` | YYYY-MM-DD | 등록일(reg_dtm) 시작 |
| \`endDate\` | YYYY-MM-DD | 등록일(reg_dtm) 종료 |
| \`resvStartDate\` | YYYY-MM-DD | 예약일(counsel_resv_dtm) 시작 |
| \`resvEndDate\` | YYYY-MM-DD | 예약일(counsel_resv_dtm) 종료 |

> \`startDate\`/\`endDate\` — **등록일** 기준 범위 필터  
> \`resvStartDate\`/\`resvEndDate\` — **예약일** 기준 범위 필터 (예약 캘린더 용도)  
> 두 날짜 범위를 동시에 사용할 수 있습니다.

---

### 정렬

등록일시(\`reg_dtm\`) **DESC** 고정

---

### 응답 포함 데이터

각 항목(\`items[]\`)에 **동적 필드 값(\`fieldValues\`)** 이 포함됩니다.  
목록 내 전체 상담의 fieldValues를 단일 배치 쿼리로 조회하므로 N+1 문제가 없습니다.  
상태 변경 이력(\`logs\`)과 메모(\`memos\`)는 목록에서는 제외되며 상세 조회(\`GET /counsels/:id\`)에서만 반환됩니다.`,
  })
  @ApiOkResponse({ description: '상담 목록 조회 성공', type: CounselListResponseDto })
  async findCounsels(
    @Req() request: AuthenticatedRequest,
    @Query() query: CounselListQueryDto,
  ): Promise<CounselListResponseDto> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    return this.counselService.findCounsels(request.user.tenantId, query, empSeqFilter);
  }

  @Get(':id')
  @RequireAuth('counsels', 'read')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 상세 조회',
    description: `특정 상담의 상세 정보를 조회합니다.

포함 데이터:
- **기본 정보**: 이름, 전화번호, 담당자, 상태, 예약 일시, 등록/수정 일시
- **UTM 정보**: source, medium, campaign, 접속 IP
- **동적 필드 값**: 웹사이트별 커스텀 필드 (fieldValues)
- **상태 변경 이력**: 상태 변경 일시 및 상태명 포함 (logs, logNo 오름차순)
- **메모 목록**: 담당자가 작성한 메모, 작성자명 포함 (memos, 최신순)

**권한:** counsels.read

**데이터 범위:** \`counsels.admin\` 권한 없으면 자신에게 배정된 상담만 조회 가능`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiOkResponse({ description: '상담 상세 조회 성공', type: CounselDetailDto })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CounselDetailDto> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    return this.counselService.getCounselById(request.user.tenantId, id, empSeqFilter);
  }

  @Patch(':id')
  @RequireAuth('counsels', 'update')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 수정',
    description: `상담 정보를 수정합니다. 동적 필드 값도 함께 갱신할 수 있습니다.

**권한:** counsels.update

**empSeq 검증:** 값이 null이 아닌 경우 동일 테넌트 소속 사용자인지 서버에서 검증합니다 → 400 (VAL001)
**날짜 형식:** counselResvDtm·valueDatetime은 ISO 8601, valueDate는 YYYY-MM-DD
**트랜잭션:** 상담 정보 수정 + 동적 필드 값 갱신이 하나의 트랜잭션으로 처리됩니다.
**동적 필드:** fieldValues를 전달하면 기존 값을 모두 삭제 후 새로 저장합니다. fieldId는 해당 테넌트의 활성 필드인지 검증합니다.`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiOkResponse({ description: '상담 수정 성공', type: CounselDetailDto })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 / 유효하지 않은 empSeq·fieldId (VAL001)', type: StandardErrorResponseDto })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCounselDto,
  ): Promise<CounselDetailDto> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    return this.counselService.updateCounsel(request.user.tenantId, id, dto, empSeqFilter);
  }

  @Delete(':id')
  @RequireAuth('counsels', 'delete')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '상담 삭제',
    description: `상담을 소프트 삭제합니다 (\`delete_state = 'Y'\`).

⚠️ **물리 삭제가 아닙니다.** 데이터는 보존됩니다.

**권한:** counsels.delete`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiNoContentResponse({ description: '상담 삭제 성공' })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    await this.counselService.softDeleteCounsel(request.user.tenantId, id, empSeqFilter);
  }

  // ──────────────────────────────────────────
  // Status
  // ──────────────────────────────────────────

  @Patch(':id/status')
  @RequireAuth('counsels', 'update')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '상담 상태 변경',
    description: `상담의 상태를 변경하고 상태 변경 로그를 자동 생성합니다.

**권한:** counsels.update

**데이터 범위:** \`counsels.admin\` 권한 없으면 자신에게 배정된 상담만 상태 변경 가능

**SCHEDULED 상태:** counselResvDtm(ISO 8601) 필드가 필수이며 counsel.counsel_resv_dtm에 저장됩니다.

**트랜잭션:** 상태 변경 + 예약 일시 저장 + 로그 생성이 하나의 트랜잭션으로 처리됩니다.`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiNoContentResponse({ description: '상태 변경 성공' })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 (VAL001)', type: StandardErrorResponseDto })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CounselUpdateStatusDto,
  ): Promise<void> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    await this.counselStatusService.updateCounselStatus(
      request.user.tenantId,
      id,
      dto.counselStat,
      dto.counselResvDtm,
      empSeqFilter,
    );
  }

  @Get(':id/logs')
  @RequireAuth('counsels', 'read')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 상태 변경 이력 조회',
    description: `특정 상담의 상태 변경 이력을 시간순(logNo ASC)으로 조회합니다.

> 상태 이력은 \`GET /counsels/:id\` 응답의 \`logs\` 필드에도 내장되어 있습니다.  
> 이력만 별도로 필요할 때 이 엔드포인트를 사용하세요.

**권한:** counsels.read

**데이터 범위:** \`counsels.admin\` 권한 없으면 자신에게 배정된 상담의 이력만 조회 가능`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiOkResponse({ description: '상태 이력 조회 성공', type: [CounselLogDto] })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async findLogs(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CounselLogDto[]> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    return this.counselStatusService.findCounselLogs(request.user.tenantId, id, empSeqFilter);
  }

  // ──────────────────────────────────────────
  // Memo
  // ──────────────────────────────────────────

  @Post(':id/memo')
  @RequireAuth('counsels', 'update')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 메모 작성',
    description: `상담에 메모를 작성합니다. 작성 시점의 상담 상태가 함께 기록됩니다.

**권한:** counsels.update

**데이터 범위:** \`counsels.admin\` 권한 없으면 자신에게 배정된 상담에만 메모 작성 가능`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiCreatedResponse({ description: '메모 작성 성공', type: CounselMemoDto })
  @ApiBadRequestResponse({ description: '입력값 검증 실패 (VAL001)', type: StandardErrorResponseDto })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async createMemo(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMemoDto,
  ): Promise<CounselMemoDto> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    return this.counselMemoService.createCounselMemo(
      request.user.tenantId,
      id,
      dto.memoText,
      request.user.userSeq,
      empSeqFilter,
    );
  }

  @Get(':id/memo')
  @RequireAuth('counsels', 'read')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: '상담 메모 목록 조회',
    description: `특정 상담의 메모 목록을 조회합니다. 삭제되지 않은 메모만 반환됩니다.

> 메모 목록은 \`GET /counsels/:id\` 응답의 \`memos\` 필드에도 내장되어 있습니다.  
> 메모만 별도로 필요할 때 이 엔드포인트를 사용하세요.

**권한:** counsels.read

**데이터 범위:** \`counsels.admin\` 권한 없으면 자신에게 배정된 상담의 메모만 조회 가능

**정렬:** 작성일시 DESC`,
  })
  @ApiParam({ name: 'id', type: 'integer', description: '상담 시퀀스 (counsel_seq)' })
  @ApiOkResponse({ description: '메모 목록 조회 성공', type: [CounselMemoDto] })
  @ApiNotFoundResponse({ description: '상담 없음 (RES001)', type: StandardErrorResponseDto })
  async findMemos(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CounselMemoDto[]> {
    const isAdmin = request.user.permissions?.['counsels.admin'] === true;
    const empSeqFilter = isAdmin ? undefined : request.user.userSeq;
    return this.counselMemoService.findCounselMemos(request.user.tenantId, id, empSeqFilter);
  }
}
