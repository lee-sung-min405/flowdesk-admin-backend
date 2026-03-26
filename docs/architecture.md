# Flowdesk Admin Backend — 기술 명세서

> **이 문서는 실제 구현 코드 기준으로 작성되었다. 모든 엔드포인트, DTO, 권한 키, 에러 코드는 코드와 1:1 대응된다.**

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처](#2-아키텍처)
3. [인증 / 인가 구조](#3-인증--인가-구조)
4. [멀티테넌시 구조](#4-멀티테넌시-구조)
5. [RBAC 설계](#5-rbac-설계)
6. [API 명세](#6-api-명세)
7. [도메인 설계](#7-도메인-설계)
8. [에러 처리 구조](#8-에러-처리-구조)
9. [기타 (Rate Limit, 보안, 환경설정 등)](#9-기타)

---

## 1. 프로젝트 개요

### 1.1 시스템 목적

회사(테넌트) 단위로 데이터를 완전 격리하는 멀티테넌트 B2B SaaS 관리자 시스템의 백엔드 API 서버다.

멀티테넌트 SaaS에서 가장 치명적인 문제인 **테넌트 간 데이터 격리**와 **권한 오염**을 설계 수준에서 검증하기 위한 백엔드 중심 프로젝트다.

### 1.2 핵심 설계 원칙

- 모든 데이터는 회사(테넌트) 단위로 분리되며, 다른 회사의 데이터에 접근할 수 없다
- 회원가입 시 회사와 관리자 계정이 함께 생성되고, 기본 상담 상태 5종이 자동 생성된다
- 관리자는 자신의 회사에 소속된 팀원만 추가하고 관리할 수 있다
- 모든 API 요청은 요청자의 회사 스코프 내에서만 데이터를 조회하고 수정한다
- 역할 기반 접근 제어(RBAC)로 회사 내 권한을 세분화한다
- 상담 신청 Public API는 인증 없이 호출 가능하며, 보안 3단계 검증 + Advisory Lock으로 보호된다
- 테넌트별 동적 필드 정의로 상담 입력 양식을 커스터마이징할 수 있다

### 1.3 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | NestJS | 11.x |
| Language | TypeScript | 5.x |
| ORM | TypeORM | 0.3.x |
| Database | MySQL | 8.x |
| Auth | Passport.js + @nestjs/jwt | - |
| Password | bcrypt (salt rounds: 10) | - |
| API Docs | @nestjs/swagger (OpenAPI 3.0) | - |
| Rate Limit | @nestjs/throttler | - |
| Security | Helmet | - |

### 1.4 프로젝트 디렉터리 구조

```
backend/
├── src/
│   ├── main.ts                          # 애플리케이션 진입점
│   ├── app.module.ts                    # 루트 모듈
│   ├── common/                          # 전역 공통 모듈
│   │   ├── decorators/
│   │   │   ├── require-auth.decorator.ts        # JWT + 권한 검증 복합 데코레이터
│   │   │   ├── require-permission.decorator.ts  # 권한 메타데이터 설정
│   │   │   └── transactional.decorator.ts       # 트랜잭션 데코레이터
│   │   ├── dto/
│   │   │   └── error-response.dto.ts            # 표준 에러 응답 형식
│   │   ├── exceptions/
│   │   │   └── base.exception.ts                # 비즈니스 예외 정의
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts       # 모든 에러 표준화
│   │   ├── guards/
│   │   │   └── permission.guard.ts              # RBAC 권한 검증
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts          # Request ID 생성/전파
│   │   └── utils/
│   │       ├── permission.util.ts               # 권한 키 생성 유틸
│   │       └── transaction.util.ts              # 트랜잭션 유틸리티
│   ├── config/                          # 환경 설정
│   ├── database/                        # TypeORM 설정
│   └── modules/                         # 도메인 모듈
│       ├── auth/        # 인증 (로그인, 회원가입, 토큰 관리, 프로필)
│       ├── users/       # 사용자 관리 (CRUD, 상태, 비밀번호, 역할 할당)
│       ├── roles/       # 역할 관리 (CRUD, 권한 할당)
│       ├── rbac/        # RBAC 권한 (카탈로그 조회, 페이지/액션/권한 CRUD)
│       ├── tenants/     # 테넌트 관리 (슈퍼 관리자 전용)
│       ├── super/       # 슈퍼 관리자 대시보드
│       ├── health/      # 헬스체크
│       ├── websites/    # 웹사이트 관리
│       ├── security/    # IP/휴대폰/금칙어 차단
│       ├── boards/      # 게시판/게시글 관리
│       ├── counsel/     # 상담 관리 (CRUD, 상태, 메모, 동적 필드, 대시보드)
│       └── codes/       # 공통 코드 (엔티티만 정의)
```

### 1.5 모듈별 역할

| 모듈 | 역할 | 상태 |
|------|------|------|
| `auth` | 회원가입, 로그인, 토큰 발급/갱신/폐기, 비밀번호 변경, 프로필 수정 | ✅ |
| `users` | 사용자 CRUD, 페이지네이션, 상태 관리, 비밀번호 관리, 역할 증분 수정 | ✅ |
| `roles` | 역할 CRUD, 권한 할당 (전체 교체/증분), 상태 변경 | ✅ |
| `rbac` | 페이지/액션/권한 CRUD, 권한 카탈로그 조회 | ✅ |
| `tenants` | 테넌트 CRUD, 상태 변경 (슈퍼 관리자 전용), 테넌트 상태 CRUD | ✅ |
| `super` | 시스템 대시보드 통계 조회 | ✅ |
| `health` | 서버 상태, DB 연결 상태 확인 | ✅ |
| `websites` | 상담 유입 웹사이트 CRUD, 상태 관리 | ✅ |
| `security` | IP/휴대폰/금칙어 차단 CRUD, 대량 등록, 차단 여부 확인 | ✅ |
| `boards` | 게시판 CRUD, 게시글 CRUD | ✅ |
| `counsel` | 상담 CRUD, 상태 변경, 메모 관리, 동적 필드, 대시보드, 중복 감지 | ✅ |
| `codes` | 공통 코드 그룹/코드 (엔티티만 정의) | ✅ |

---

## 2. 아키텍처

### 2.1 요청 처리 흐름

```
Client Request
  │
  ├─ RequestIdMiddleware        X-Request-ID 헤더 또는 UUID 자동 생성
  │
  ├─ ThrottlerGuard (전역)     IP 기반 Rate Limiting (기본 60회/60초)
  │
  ├─ ValidationPipe (전역)     DTO 검증 (whitelist + forbidNonWhitelisted + transform)
  │
  ├─ Controller Layer
  │   ├─ @RequireAuth(page, action)  →  JwtAuthGuard + PermissionGuard
  │   │   ├─ JwtAuthGuard
  │   │   │   └─ JwtStrategy.validate()
  │   │   │       ├─ JWT 토큰 파싱 (sub, tenantName, userId, tokenVersion)
  │   │   │       ├─ DB에서 User 조회 (tenant relation 포함)
  │   │   │       ├─ isActive 검증
  │   │   │       ├─ tokenVersion 검증 (JWT vs DB)
  │   │   │       ├─ 권한 맵 빌드 (Permission + Page + Action + RolePermission + UserRole)
  │   │   │       └─ request.user에 SafeUser + permissions 주입
  │   │   └─ PermissionGuard
  │   │       └─ user.permissions["{page}.{action}"] === true 검증
  │   └─ 컨트롤러 메서드 실행
  │
  ├─ Service Layer              비즈니스 로직 + tenantId 스코프 필터링
  │
  ├─ TypeORM Repository         DB 쿼리
  │
  └─ GlobalExceptionFilter      모든 예외를 표준 응답 구조로 변환
```

### 2.2 글로벌 설정 (`main.ts`)

| 기능 | 설정 |
|------|------|
| CORS | `CORS_ORIGIN` 환경변수 (쉼표 구분) 또는 localhost 패턴 |
| Helmet | CSP 비활성화 (Swagger UI 호환) |
| GlobalExceptionFilter | 모든 예외를 `{ error, meta }` 구조로 변환 |
| ValidationPipe | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| ThrottlerGuard | 전역 Rate Limiting (60회/60초) |
| RequestIdMiddleware | 모든 라우트에 적용 |
| Swagger | `NODE_ENV !== 'production'`일 때만 활성화, 경로: `/api` |
| Trust Proxy | `trust proxy: 1` (Railway, Nginx 등 프록시 뒤 IP 감지) |

### 2.3 Swagger 태그 구성

| 태그 | 설명 |
|------|------|
| Health | 헬스체크 및 시스템 진단 |
| Auth | 인증 관련 API (로그인, 회원가입, 토큰 관리) |
| Users | 사용자 관리 API |
| Roles | 역할 관리 API (역할 CRUD, 권한/사용자 할당) |
| Permissions | 권한 카탈로그 조회 API |
| Super Admin (슈퍼 관리자 전용) | 슈퍼 관리자 대시보드 API |
| Tenants (슈퍼 관리자 전용) | 테넌트 관리 API |
| Tenant Status | 테넌트 상태 관리 API |
| Permissions Admin (슈퍼 관리자 전용) | 페이지/액션/권한 CRUD API |
| Websites | 웹사이트 관리 API |
| Boards | 게시판/게시글 관리 API |
| Security - Block IP | IP 차단 관리 API |
| Security - Block HP | 휴대폰 차단 관리 API |
| Security - Block Word | 금칙어 관리 API |
| Counsels | 상담 관리 API |
| Counsel Fields | 상담 동적 필드 정의 조회 API |

---

## 3. 인증 / 인가 구조

### 3.1 인증 흐름

```
1. POST /auth/login
   ├─ tenantName + userId + password 제출
   ├─ Tenant 조회 → 존재/활성 검증
   ├─ User 조회 (tenantId + userId) → 존재/활성 검증
   ├─ bcrypt 비밀번호 검증
   ├─ JWT Access Token 발급 (payload: { sub, tenantName, userId, tokenVersion })
   └─ Refresh Token 발급 (tokenId.secret 형식, secret는 bcrypt 해싱 후 DB 저장)

2. API 요청
   ├─ Authorization: Bearer {accessToken}
   └─ JwtStrategy.validate()가 request.user에 SafeUser 주입

3. POST /auth/refresh
   ├─ refreshToken (tokenId.secret 형식) 제출
   ├─ tokenId로 DB 조회 → revoked/expired 검증
   ├─ secret을 bcrypt로 검증
   ├─ 기존 토큰 revoked 처리 (Rotation)
   └─ 새 Access Token + 새 Refresh Token 발급

4. POST /auth/logout
   └─ 해당 Refresh Token revoked 처리

5. POST /auth/logout-all
   ├─ 해당 사용자의 모든 Refresh Token revoked 처리
   └─ User.tokenVersion 증가 → 기존 Access Token 전부 무효화
```

### 3.2 JWT Payload 구조

```typescript
{
  sub: number;           // userSeq (사용자 고유 식별자)
  tenantName: string;    // 테넌트명
  userId: string;        // 사용자 아이디
  tokenVersion: number;  // 토큰 버전 (강제 무효화용)
  iat: number;           // 발급 시간
  exp: number;           // 만료 시간
}
```

### 3.3 `request.user` (SafeUser) 구조

JwtStrategy.validate()가 토큰 검증 후 주입하는 객체:

```typescript
interface SafeUser {
  userSeq: number;
  tenantId: number;
  tenantName?: string | null;
  userId: string;
  userName: string;
  corpName: string;
  userEmail?: string | null;
  userTel?: string | null;
  userHp?: string | null;
  isActive: number;              // 1=active, 0=inactive
  regDtm: Date;
  tokenVersion?: number;
  permissions?: Record<string, boolean>;  // O(1) 권한 룩업 맵
  // 예: { "users.read": true, "roles.delete": true }
}
```

**권한 맵 빌드 과정** (JwtStrategy.validate 내부):
1. Permission → Page + Action → RolePermission → Role → UserRole 조인
2. 모든 엔티티의 `isActive=1` 필터
3. `PermissionUtil.buildKey(pageName, actionName)` → `"{pageName}.{actionName}"` 형식으로 키 생성
4. `{ [key]: true }` 객체로 변환

### 3.4 인증/인가 데코레이터

#### `@RequireAuth(page, action)`

JWT 인증 + RBAC 권한 검증을 한 번에 적용하는 복합 데코레이터:

```typescript
@RequireAuth('users', 'read')
// 적용 효과:
// 1. UseGuards(JwtAuthGuard, PermissionGuard)
// 2. RequirePermission('users', 'read')  →  메타데이터에 { page: 'users', action: 'read' } 저장
// 3. ApiBearerAuth('JWT')
// 4. ApiUnauthorizedResponse + ApiForbiddenResponse (Swagger 응답 문서화)
```

#### `PermissionGuard` 동작

```typescript
// 1. Reflector에서 { page, action } 메타데이터 추출
// 2. 메타데이터 없으면 통과 (데코레이터 미사용)
// 3. PermissionUtil.buildKey(page, action)으로 키 생성
// 4. request.user.permissions[permissionKey] === true 검증
// 5. 실패 시 AuthorizationException (403) 발생
```

### 3.5 토큰 정책

| 항목 | 값 |
|------|-----|
| Access Token 만료 | `JWT_EXPIRES_IN` 환경변수 (기본: `3600s`) |
| Refresh Token 만료 | `REFRESH_EXPIRES_DAYS` (기본: 7일) |
| Refresh Token 형식 | `{tokenId}.{secret}` (UUID + 64-byte hex) |
| Refresh Token 저장 | tokenId + bcrypt(secret) → `refresh_tokens` 테이블 |
| Token Rotation | refresh 시 기존 토큰 revoked, 새 토큰 발급 |
| 강제 무효화 | `User.tokenVersion` 증가 → 모든 Access Token 즉시 무효 |
| 인증 실패 응답 | 모든 원인에 대해 동일 메시지: `Authentication required` |
| 비밀번호 해싱 | bcrypt (salt rounds: 10) |

### 3.6 회원가입 (`POST /auth/signup`) 트랜잭션

하나의 트랜잭션으로 순차 생성:

1. **Tenant** 생성 (`tenantName` = companyName, `displayName` = companyName, `isActive` = 1)
2. **TenantStatus** 5종 자동 생성:
   - `NEW` (sortOrder: 1)
   - `DUPLICATE` (sortOrder: 2)
   - `IN_PROGRESS` (sortOrder: 3)
   - `SCHEDULED` (sortOrder: 4)
   - `CONTACTED` (sortOrder: 5)
3. **User** 생성 (관리자 계정):
   - `userId` = email
   - `userPwd` = bcrypt(password)
   - `userName` = adminName
   - `corpName` = companyName
   - `userEmail` = email
   - `userHp` = phone (선택, 미제공 시 null)
   - `isActive` = 1
   - `tokenVersion` = 0

---

## 4. 멀티테넌시 구조

### 4.1 격리 방식

**단일 데이터베이스, 논리적 격리** 방식이다.

- 모든 주요 테이블에 `tenant_id` 컬럼 존재
- 서비스 레이어에서 `request.user.tenantId`로 필터링
- API가 아닌 **서비스 메서드의 첫 번째 인자로 tenantId를 전달**하는 패턴

### 4.2 테넌트 스코프 적용 방식

```
Controller                       Service
─────────────────────────────────────────────────
@RequireAuth('users', 'read')
getUsers(@Request() req) {
  return this.usersService        .findUsers(
    .findUsers(req.user.tenantId,   tenantId,  ← 서비스 첫 인자
    ...)                            ...)
}
```

**모든 인증된 서비스 메서드는 `tenantId`를 첫 번째 매개변수로 받으며**, WHERE 절에 `tenant_id = :tenantId` 조건을 포함한다.

### 4.3 엔티티별 격리 정책

| 엔티티 | 격리 방식 | 설명 |
|--------|----------|------|
| Tenant | - | 최상위 격리 단위 |
| User | `tenant_id` FK | 사용자는 반드시 하나의 테넌트에 소속 |
| Role | `tenant_id` FK | 역할은 테넌트별 독립 관리 |
| UserRole | `tenant_id` 복합 PK | 사용자-역할 매핑도 테넌트로 격리 |
| RolePermission | 간접 격리 | Role이 테넌트 소속이므로 간접 격리 |
| Website | `tenant_id` FK | 웹사이트는 테넌트별 |
| Counsel | `tenant_id` FK | 상담 데이터는 테넌트별 |
| CounselFieldDef | `tenant_id` FK | 커스텀 필드 정의는 테넌트별 |
| CounselFieldValue | `tenant_id` 복합 PK | 필드 값은 테넌트별 |
| CounselLog | `tenant_id` 복합 PK | 상담 로그는 테넌트별 |
| CounselMemoLog | `tenant_id` FK | 메모는 테넌트별 |
| TenantStatus | `tenant_id` FK | 상태 정의는 테넌트별 |
| Board | `tenant_id` FK | 게시판은 테넌트별 |
| Post | `tenant_id` FK | 게시글은 테넌트별 |
| BlockIp / BlockHp / BlockWord | `tenant_id` FK | 차단 규칙은 테넌트별 |
| RefreshToken | 간접 격리 | User에 종속 (`user_seq` FK) |
| Page / Action / Permission | **전역** | 시스템 공통 카탈로그 |
| CodeGroup / Code | **전역** | 시스템 공통 코드 |

### 4.4 슈퍼 테넌트

- 슈퍼 테넌트의 `tenantId = 1`
- 슈퍼 관리자는 `super.*` 권한을 통해 시스템 전역 관리 기능에 접근
- 권한 카탈로그 조회 시 `tenantId === 1`이면 `super.*` 페이지 포함, 그 외에는 제외

---

## 5. RBAC 설계

### 5.1 권한 모델 구조

```
User ──(N:M)──▶ Role ──(N:M)──▶ Permission
                                    │
                               ┌────┴────┐
                               │         │
                             Page     Action
```

- **Page**: 기능 페이지 (예: `users`, `roles`, `security`, `counsels.dashboard`)
- **Action**: 동작 (예: `read`, `create`, `update`, `delete`)
- **Permission**: Page + Action의 조합 (전역 카탈로그)
- **Role**: 테넌트별 역할, Permission 집합을 보유
- **UserRole**: 사용자와 역할의 매핑 (테넌트별)
- **RolePermission**: 역할과 권한의 매핑

### 5.2 권한 키 형식

```
{pageName}.{actionName}
```

`PermissionUtil.buildKey(page, action)` → `"${page}.${action}"`

### 5.3 모듈별 실제 권한 키

| 모듈 | 엔드포인트 | 권한 키 |
|------|-----------|---------|
| **Auth** | `/auth/login`, `/auth/signup`, `/auth/refresh` | 인증 불필요 (Public) |
| **Auth** | `/auth/logout`, `/auth/logout-all`, `/auth/me`, `/auth/change-password`, `/auth/me/profile` | JWT 인증만 (권한 불필요) |
| **Users** | `GET /users`, `GET /users/:id` | `users.read` |
| **Users** | `POST /users` | `users.create` |
| **Users** | `PATCH /users/:id`, `PATCH /users/:id/status`, `PATCH /users/:id/password`, `POST /users/:id/invalidate-tokens`, `PATCH /users/:id/roles` | `users.update` |
| **Roles** | `GET /roles`, `GET /roles/:id` | `roles.read` |
| **Roles** | `POST /roles` | `roles.create` |
| **Roles** | `PATCH /roles/:id`, `PATCH /roles/:id/status`, `PUT /roles/:id/permissions`, `PATCH /roles/:id/permissions` | `roles.update` |
| **Roles** | `DELETE /roles/:id` | `roles.delete` |
| **Permissions** | `GET /permissions/catalog` | `permissions.read` |
| **Permissions Admin** (Pages) | `/permissions/admin/pages/*` | `super.pages.read/create/update/delete` |
| **Permissions Admin** (Actions) | `/permissions/admin/actions/*` | `super.actions.read/create/update/delete` |
| **Permissions Admin** (Permissions) | `/permissions/admin/permissions/*` | `super.permissions.read/create/update/delete` |
| **Tenants** | `/tenants/*` | `super.tenants.read/create/update/delete` |
| **Tenant Status** | `/tenants/status/*` | `tenants.status.read/create/update/delete` |
| **Super** | `GET /super/dashboard` | `super.dashboard.read` |
| **Websites** | `/websites/*` | `websites.read/create/update/delete` |
| **Security** (Block IP) | `/security/block-ip/*` | `security.read/create/update/delete` |
| **Security** (Block HP) | `/security/block-hp/*` | `security.read/create/update/delete` |
| **Security** (Block Word) | `/security/block-word/*` | `security.read/create/update/delete` |
| **Boards** | `/boards/*` (게시판) | `board_types.read/create/update/delete` |
| **Boards** | `/boards/:boardId/posts/*` (게시글) | `boards.posts.read/create/update/delete` |
| **Counsels** | `GET /counsels/dashboard` | `counsels.dashboard.read` |
| **Counsels** | `POST /counsels` (Public API) | 인증 불필요 |
| **Counsels** | `GET /counsels`, `GET /counsels/:id`, `GET /counsels/:id/logs`, `GET /counsels/:id/memo` | `counsels.read` |
| **Counsels** | `PATCH /counsels/:id`, `PATCH /counsels/:id/status`, `POST /counsels/:id/memo` | `counsels.update` |
| **Counsels** | `DELETE /counsels/:id` | `counsels.delete` |
| **Counsels** | (런타임 분기) 컨트롤러 내부에서 `counsels.admin` 보유 여부로 전체/본인 데이터 접근 범위 결정 | `counsels.admin` |
| **Counsel Fields** | `GET /counsel-fields` | `counsels.read` |
| **Health** | `GET /health` | 인증 불필요 |

### 5.4 카탈로그 조회 (`GET /permissions/catalog`)

슈퍼 관리자(`tenantId = 1`)와 일반 테넌트 관리자에 따라 반환 범위가 다르다:

- **슈퍼 관리자**: `super.*` 페이지 포함, 모든 시스템 권한 반환
- **일반 관리자**: `super.*` 페이지 제외, 테넌트 관리용 권한만 반환

응답 구조 (`CatalogResponseDto`):

```typescript
{
  pages: PageDto[];                          // 활성 페이지 목록
  actions: ActionDto[];                      // 활성 액션 목록
  permissions: PermissionDto[];              // 활성 권한 목록
  matrix: Record<string, MatrixActionDto[]>; // pageName → [{ actionName, permissionId }]
}
```

---

## 6. API 명세

> 모든 엔드포인트는 Global Prefix 없이 루트 경로에 매핑된다.
>
> **NestJS HTTP 상태 코드 규칙:** POST 메서드는 기본 **201**, GET/PATCH/PUT/DELETE는 기본 **200**이다. `@HttpCode()` 데코레이터로 명시적 오버라이드된 경우에만 다른 상태 코드를 반환한다.

### 6.1 Health

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/health` | 없음 | 서비스 상태 확인 |

**Response (200)**

```json
{
  "status": "ok",
  "uptime": 12345,
  "env": "development",
  "details": {
    "database": { "status": "up" }
  }
}
```

---

### 6.2 Auth

#### `POST /auth/login`

Rate Limit: 5회/60초

**Request Body** (`LoginDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| tenantName | string | ✅ | 테넌트 이름 |
| userId | string | ✅ | 사용자 아이디 |
| password | string | ✅ | 비밀번호 (평문) |

**Response (201)** (`LoginResponseDto`)

> DTO 정의 상 `expiresIn`, `refreshToken`, `refreshExpiresAt`는 optional(`?`) 필드이나, login API에서는 항상 포함된다.

```json
{
  "accessToken": "eyJhbG...",
  "expiresIn": "3600s",
  "user": {
    "userSeq": 1,
    "tenantId": 2,
    "tenantName": "company-a",
    "userId": "admin@company.com",
    "userName": "관리자",
    "corpName": "Company A",
    "userEmail": "admin@company.com",
    "userTel": null,
    "userHp": "010-1234-5678",
    "isActive": 1,
    "regDtm": "2026-01-01T00:00:00.000Z"
  },
  "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479.a1b2c3d4...",
  "refreshExpiresAt": "2026-01-08T00:00:00.000Z"
}
```

#### `POST /auth/signup`

Rate Limit: 3회/60초

**Request Body** (`SignupDto`)

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| companyName | string | ✅ | minLength(2) | 회사명 (tenantName으로 사용) |
| adminName | string | ✅ | minLength(2) | 관리자 이름 |
| email | string | ✅ | @IsEmail | 관리자 이메일 (userId로 사용) |
| phone | string | ❌ | @IsOptional | 관리자 전화번호 |
| password | string | ✅ | minLength(8), 영문+숫자+특수문자 | 비밀번호 |

**Response (201)** (`SignupResponseDto`)

```json
{
  "message": "회원가입이 완료되었습니다.",
  "tenant": {
    "tenantId": 2,
    "tenantName": "company-a"
  },
  "admin": {
    "userSeq": 1,
    "userId": "admin@company.com",
    "userName": "관리자"
  }
}
```

**트랜잭션 내 자동 생성:**
- Tenant 1건
- TenantStatus 5건 (NEW, DUPLICATE, IN_PROGRESS, SCHEDULED, CONTACTED)
- User 1건 (관리자)

#### `POST /auth/refresh`

Rate Limit: 10회/60초

**Request Body** (`RefreshRequestDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| refreshToken | string | ✅ | `tokenId.secret` 형식 |

**Response (201)** (`RefreshResponseDto`)

```json
{
  "accessToken": "eyJhbG...",
  "expiresIn": "3600s",
  "refreshToken": "new-token-id.new-secret...",
  "refreshExpiresAt": "2026-01-08T00:00:00.000Z"
}
```

#### `POST /auth/logout`

Auth: `JwtAuthGuard`

**Request Body** (`LogoutDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| refreshToken | string | ✅ | 폐기할 Refresh Token |

**Response (201)**

```json
{ "ok": true }
```

#### `POST /auth/logout-all`

Auth: `JwtAuthGuard`

Request Body: 없음

**Response (201)**

```json
{ "ok": true }
```

효과: 모든 Refresh Token revoked + `tokenVersion` 증가 (모든 Access Token 무효)

#### `GET /auth/me`

Auth: `JwtAuthGuard`

**Response (200)** (`MeResponseDto`)

```json
{
  "user": {
    "userSeq": 1,
    "tenantId": 2,
    "tenantName": "company-a",
    "userId": "admin@company.com",
    "userName": "관리자",
    "corpName": "Company A",
    "userEmail": "admin@company.com",
    "userTel": null,
    "userHp": "010-1234-5678",
    "isActive": 1,
    "regDtm": "2026-01-01T00:00:00.000Z"
  },
  "roles": ["ADMIN", "USER_MANAGER"],
  "permissions": {
    "users.read": true,
    "users.create": true,
    "roles.read": true
  },
  "menuTree": [
    {
      "pageName": "users",
      "displayName": "사용자 관리",
      "path": "/users",
      "order": 1,
      "children": []
    }
  ]
}
```

`menuTree`: 사용자가 `{pageName}.read` 권한을 보유한 페이지만 포함, 계층 구조 유지.

#### `POST /auth/change-password`

Auth: `JwtAuthGuard`

**Request Body** (`ChangePasswordDto`)

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| currentPassword | string | ✅ | - | 현재 비밀번호 |
| newPassword | string | ✅ | minLength(8), 영문+숫자+특수문자 | 새 비밀번호 |
| confirmPassword | string | ✅ | - | 새 비밀번호 확인 |

**Response:** 204 No Content

검증: currentPassword 일치, newPassword ≠ currentPassword, newPassword = confirmPassword

#### `PATCH /auth/me/profile`

Auth: `JwtAuthGuard`

**Request Body** (`UpdateMyProfileDto`, 모든 필드 선택)

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| corpName | string | ❌ | maxLength(250) | 회사명 |
| userName | string | ❌ | maxLength(200) | 사용자명 |
| userEmail | string | ❌ | @IsEmail, maxLength(250) | 이메일 |
| userTel | string | ❌ | maxLength(200) | 전화번호 |
| userHp | string | ❌ | maxLength(200) | 휴대폰번호 |

**Response (200):** User 객체 (`userPwd`, `tokenVersion` 제외)

---

### 6.3 Users

#### `GET /users`

Auth: `@RequireAuth('users', 'read')`

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |
| q | string | - | 검색 (userId, userName, corpName, userEmail) |
| isActive | number | - | 상태 필터 (0 또는 1) |
| sort | string | `regDtm` | 정렬 필드 (userSeq, userId, userName, corpName, regDtm, isActive) |
| order | `ASC`\|`DESC` | `DESC` | 정렬 순서 |

**Response (200)** (`UserListResponseDto`)

```json
{
  "items": [
    {
      "userSeq": 1,
      "userId": "admin@company.com",
      "corpName": "Company A",
      "userName": "관리자",
      "userEmail": "admin@company.com",
      "userTel": null,
      "userHp": "010-1234-5678",
      "isActive": 1,
      "regDtm": "2026-01-01T00:00:00.000Z",
      "stopDtm": null,
      "tenantId": 2
    }
  ],
  "pageInfo": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

#### `GET /users/:id`

Auth: `@RequireAuth('users', 'read')`

Path: `id` (number) — userSeq

**Response (200)** (`UserDetailResponseDto`)

```json
{
  "userSeq": 1,
  "userId": "admin@company.com",
  "corpName": "Company A",
  "userName": "관리자",
  "userEmail": "admin@company.com",
  "userTel": null,
  "userHp": "010-1234-5678",
  "isActive": 1,
  "regDtm": "2026-01-01T00:00:00.000Z",
  "stopDtm": null,
  "tenantId": 2,
  "assignedRoleIds": [1, 3],
  "availableRoles": [
    {
      "roleId": 1,
      "roleName": "admin",
      "displayName": "관리자",
      "description": "전체 관리 권한",
      "isActive": 1,
      "isAssigned": true
    }
  ]
}
```

#### `POST /users`

Auth: `@RequireAuth('users', 'create')`

**Request Body** (`CreateUserDto`)

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| userId | string | ✅ | maxLength(200) | 로그인 ID |
| password | string | ✅ | minLength(8), 영문+숫자+특수문자 | 비밀번호 |
| corpName | string | ✅ | maxLength(250) | 회사명 |
| userName | string | ✅ | maxLength(200) | 사용자명 |
| userEmail | string | ❌ | @IsEmail, maxLength(250) | 이메일 |
| userTel | string | ❌ | maxLength(200) | 전화번호 |
| userHp | string | ❌ | maxLength(200) | 휴대폰번호 |

**Response (201):** User 엔티티

#### `PATCH /users/:id`

Auth: `@RequireAuth('users', 'update')`

**Request Body** (`UpdateUserDto`, 모든 필드 선택)

| 필드 | 타입 | 설명 |
|------|------|------|
| corpName | string | 회사명 |
| userName | string | 사용자명 |
| userEmail | string | 이메일 |
| userTel | string | 전화번호 |
| userHp | string | 휴대폰번호 |
| roleIds | number[] | 역할 ID 배열 (제공 시 전체 교체) |

**Response (200):** User 엔티티

#### `PATCH /users/:id/status`

Auth: `@RequireAuth('users', 'update')`

**Request Body** (`UpdateUserStatusDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| isActive | number | ✅ | 0(정지) 또는 1(활성) |

**Response (200):** User 엔티티. 정지 시 `stopDtm` 자동 설정.

#### `PATCH /users/:id/password`

Auth: `@RequireAuth('users', 'update')`

**Request Body** (`UpdateUserPasswordDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| newPassword | string | ✅ | 새 비밀번호 (minLength(8), 영문+숫자+특수문자) |

**Response:** 200 (empty body)

> `@HttpCode` 미설정으로 PATCH 기본 상태 코드 200 반환. Swagger는 `@ApiNoContentResponse`로 204를 문서화하나, 실제 응답은 200이다.

#### `POST /users/:id/invalidate-tokens`

Auth: `@RequireAuth('users', 'update')`

효과: 대상 사용자의 `tokenVersion` 증가 → 모든 토큰 무효화

**Response:** 201 (empty body)

> `@HttpCode` 미설정으로 POST 기본 상태 코드 201 반환. Swagger는 `@ApiNoContentResponse`로 204를 문서화하나, 실제 응답은 201이다.

#### `PATCH /users/:id/roles`

Auth: `@RequireAuth('users', 'update')`

**Request Body** (`UpdateUserRolesDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| add | number[] | ❌ | 추가할 역할 ID 배열 |
| remove | number[] | ❌ | 제거할 역할 ID 배열 |

**Response (200)** (`UpdateUserRolesResponseDto`)

```json
{
  "success": true,
  "message": "역할이 수정되었습니다."
}
```

---

### 6.4 Roles

#### `GET /roles`

Auth: `@RequireAuth('roles', 'read')`

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |
| q | string | - | 검색 (roleName, displayName, description) |
| isActive | number | - | 상태 필터 (0 또는 1) |
| sort | string | `roleId` | 정렬 필드 (roleId, roleName, displayName, createdAt, updatedAt) |
| order | `ASC`\|`DESC` | `ASC` | 정렬 순서 |

**Response (200)** (`FindRolesResponseDto`)

```json
{
  "items": [
    {
      "roleId": 1,
      "roleName": "admin",
      "displayName": "관리자",
      "description": "전체 관리 권한",
      "isActive": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "tenantId": 2,
      "userCount": 3,
      "permissionCount": 15
    }
  ],
  "pageInfo": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

#### `GET /roles/:id`

Auth: `@RequireAuth('roles', 'read')`

**Response (200)** (`RoleDetailResponseDto`)

```json
{
  "roleId": 1,
  "roleName": "admin",
  "displayName": "관리자",
  "description": "전체 관리 권한",
  "isActive": 1,
  "tenantId": 2,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "permissionsByPage": [
    {
      "pageId": 1,
      "pageName": "users",
      "pageDisplayName": "사용자 관리",
      "permissions": [
        {
          "permissionId": 1,
          "displayName": "사용자 조회",
          "description": null,
          "actionId": 1,
          "actionName": "read",
          "actionDisplayName": "조회"
        }
      ]
    }
  ],
  "assignedUsers": [
    {
      "userSeq": 1,
      "userId": "admin@company.com",
      "userName": "관리자",
      "email": "admin@company.com",
      "isActive": 1,
      "assignedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /roles`

Auth: `@RequireAuth('roles', 'create')`

**Request Body** (`CreateRoleDto`)

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| roleName | string | ✅ | maxLength(50) | 역할 코드명 (테넌트 내 unique) |
| displayName | string | ❌ | maxLength(100) | 표시명 |
| description | string | ❌ | - | 설명 |

**Response (201)** (`RoleResponseDto`)

#### `PATCH /roles/:id`

Auth: `@RequireAuth('roles', 'update')`

**Request Body** (`UpdateRoleDto`) — CreateRoleDto의 모든 필드가 선택

**Response (200)** (`RoleResponseDto`)

#### `PATCH /roles/:id/status`

Auth: `@RequireAuth('roles', 'update')`

**Request Body** (`UpdateRoleStatusDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| isActive | number | ✅ | 0 또는 1 |

**Response (200)** (`RoleResponseDto`)

#### `DELETE /roles/:id`

Auth: `@RequireAuth('roles', 'delete')`

검증: 사용자가 할당된 역할은 삭제 불가 (`ValidationException`)

**Response:** 204 No Content

#### `PUT /roles/:id/permissions` — 권한 전체 교체 (다른 역할에서 복사)

Auth: `@RequireAuth('roles', 'update')`

**Request Body** (`CopyPermissionsDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| sourceRoleId | number | ✅ | 복사 원본 역할 ID |

**Response (200):** `RoleDetailResponseDto`

#### `PATCH /roles/:id/permissions` — 권한 증분 수정

Auth: `@RequireAuth('roles', 'update')`

**Request Body** (`ModifyPermissionsDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| add | number[] | ❌ | 추가할 권한 ID 배열 |
| remove | number[] | ❌ | 제거할 권한 ID 배열 |

**Response (200)** (`ModifyPermissionsResponseDto`)

```json
{
  "added": [1, 2, 3],
  "removed": [4, 5],
  "alreadyExists": [6],
  "notFound": [7],
  "totalCount": 10
}
```

---

### 6.5 Permissions

#### `GET /permissions/catalog`

Auth: `@RequireAuth('permissions', 'read')`

슈퍼 관리자(`tenantId=1`)는 `super.*` 페이지 포함, 일반 관리자는 제외.

**Response (200)** (`CatalogResponseDto`)

```json
{
  "pages": [
    { "pageId": 1, "pageName": "users", "displayName": "사용자 관리", "path": "/users" }
  ],
  "actions": [
    { "actionId": 1, "actionName": "read", "displayName": "조회" }
  ],
  "permissions": [
    { "permissionId": 1, "pageId": 1, "actionId": 1, "displayName": "사용자 조회" }
  ],
  "matrix": {
    "users": [
      { "actionName": "read", "permissionId": 1 },
      { "actionName": "create", "permissionId": 2 }
    ]
  }
}
```

---

### 6.6 Permissions Admin (슈퍼 관리자 전용)

3개의 하위 리소스에 대해 동일한 CRUD 패턴:

#### Pages (`/permissions/admin/pages`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/permissions/admin/pages` | `super.pages.read` | 페이지 목록 (페이지네이션, 검색, 필터, 정렬) |
| GET | `/permissions/admin/pages/:id` | `super.pages.read` | 페이지 상세 (자식 포함) |
| POST | `/permissions/admin/pages` | `super.pages.create` | 페이지 생성 |
| PATCH | `/permissions/admin/pages/:id` | `super.pages.update` | 페이지 수정 |
| PATCH | `/permissions/admin/pages/:id/status` | `super.pages.update` | 상태 변경 |
| DELETE | `/permissions/admin/pages/:id` | `super.pages.delete` | 페이지 삭제 |

**CreatePageDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| pageName | string | ✅ | 페이지 코드명 (unique, max 100) |
| path | string | ✅ | 경로 (max 255) |
| displayName | string | ✅ | 표시명 (max 100) |
| description | string | ❌ | 설명 |
| parentId | number | ❌ | 부모 페이지 ID |
| sortOrder | number | ❌ | 정렬 순서 |
| isActive | number | ❌ | 기본값 1 |

목록 조회 Query: `page`, `limit`, `q`, `parentId`, `isActive`, `sort`, `order`

#### Actions (`/permissions/admin/actions`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/permissions/admin/actions` | `super.actions.read` | 액션 목록 |
| GET | `/permissions/admin/actions/:id` | `super.actions.read` | 액션 상세 |
| POST | `/permissions/admin/actions` | `super.actions.create` | 액션 생성 |
| PATCH | `/permissions/admin/actions/:id` | `super.actions.update` | 액션 수정 |
| PATCH | `/permissions/admin/actions/:id/status` | `super.actions.update` | 상태 변경 |
| DELETE | `/permissions/admin/actions/:id` | `super.actions.delete` | 액션 삭제 |

**CreateActionDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| actionName | string | ✅ | 액션 코드명 (unique, max 50) |
| displayName | string | ❌ | 표시명 (max 100) |
| isActive | number | ❌ | 기본값 1 |

#### Permissions (`/permissions/admin/permissions`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/permissions/admin/permissions` | `super.permissions.read` | 권한 목록 |
| GET | `/permissions/admin/permissions/:id` | `super.permissions.read` | 권한 상세 |
| POST | `/permissions/admin/permissions` | `super.permissions.create` | 권한 생성 |
| PATCH | `/permissions/admin/permissions/:id` | `super.permissions.update` | 권한 수정 |
| PATCH | `/permissions/admin/permissions/:id/status` | `super.permissions.update` | 상태 변경 |
| DELETE | `/permissions/admin/permissions/:id` | `super.permissions.delete` | 권한 삭제 |

**CreatePermissionDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| pageId | number | ✅ | 페이지 ID |
| actionId | number | ✅ | 액션 ID |
| displayName | string | ❌ | 표시명 (max 100) |
| description | string | ❌ | 설명 |
| isActive | number | ❌ | 기본값 1 |

모든 Permissions Admin DELETE 엔드포인트: **Response:** 204 No Content

---

### 6.7 Tenants (슈퍼 관리자 전용)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/tenants` | `super.tenants.read` | 테넌트 목록 |
| GET | `/tenants/:id` | `super.tenants.read` | 테넌트 상세 |
| POST | `/tenants` | `super.tenants.create` | 테넌트 생성 |
| PATCH | `/tenants/:id` | `super.tenants.update` | 테넌트 수정 |
| PATCH | `/tenants/:id/status` | `super.tenants.update` | 상태 변경 |
| DELETE | `/tenants/:id` | `super.tenants.delete` | 테넌트 삭제 |

목록 조회 Query: `page`, `limit`, `q`, `isActive`, `sort`, `order`

**CreateTenantDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| tenantName | string | ✅ | 테넌트 코드명 (unique, max 100) |
| displayName | string | ❌ | 표시명 (max 100) |
| domain | string | ❌ | 도메인 (max 200) |
| isActive | number | ❌ | 기본값 1 |

테넌트 생성 시 기본 TenantStatus 5종(NEW, DUPLICATE, IN_PROGRESS, SCHEDULED, CONTACTED) 자동 생성.

삭제 시 사용자가 존재하면 `ValidationException` 발생. **Response:** 204 No Content

**목록 응답** (`FindTenantsResponseDto`)

```json
{
  "items": [
    {
      "tenantId": 2,
      "tenantName": "company-a",
      "displayName": "Company A",
      "domain": "company-a.com",
      "isActive": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "userCount": 5
    }
  ],
  "pageInfo": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 10,
    "totalPages": 1
  }
}
```

---

### 6.8 Tenant Status (테넌트 상태 관리)

테넌트별 상담 상태 등을 관리하는 API. 슈퍼 관리자 전용이 아닌, `tenants.status.*` 권한을 가진 사용자가 접근한다.

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/tenants/status` | `tenants.status.read` | 상태 목록 (그룹별) |
| GET | `/tenants/status/:id` | `tenants.status.read` | 상태 상세 |
| POST | `/tenants/status` | `tenants.status.create` | 상태 생성 |
| PATCH | `/tenants/status/:id` | `tenants.status.update` | 상태 수정 |
| PATCH | `/tenants/status/:id/status` | `tenants.status.update` | 활성 상태 변경 |
| DELETE | `/tenants/status/:id` | `tenants.status.delete` | 상태 삭제 |

목록 조회 Query: `statusGroup`, `isActive`, `q`

**CreateTenantStatusDto:**

| 필드 | 타입 | 필수 | 검증 | 설명 |
|------|------|------|------|------|
| statusGroup | string | ✅ | maxLength(50) | 상태 그룹 |
| statusKey | string | ✅ | maxLength(50), `/^[a-z0-9_]+$/` | 상태 코드 |
| statusName | string | ✅ | maxLength(100) | 상태명 |
| description | string | ❌ | maxLength(200) | 설명 |
| color | string | ❌ | maxLength(7), `/^#[0-9A-Fa-f]{6}$/` | HEX 색상 코드 |
| sortOrder | number | ❌ | @IsInt, @Min(0) | 정렬 순서 |
| isActive | number | ❌ | @IsIn([0, 1]) | 기본값 1 |

**Response (201)** (`TenantStatusResponseDto`)

```json
{
  "tenantStatusId": 1,
  "statusGroup": "counsel",
  "statusKey": "new",
  "statusName": "신규",
  "description": null,
  "color": "#FF0000",
  "sortOrder": 1,
  "isActive": 1,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

**목록 응답** (`TenantStatusGroupedResponseDto`)

```json
{
  "groups": [
    {
      "statusGroup": "counsel",
      "items": [
        {
          "tenantStatusId": 1,
          "statusGroup": "counsel",
          "statusKey": "new",
          "statusName": "신규",
          "description": null,
          "color": "#FF0000",
          "sortOrder": 1,
          "isActive": 1,
          "createdAt": "2026-01-01T00:00:00.000Z",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "total": 5
}
```

**삭제:** 204 No Content (물리 삭제)

---

### 6.9 Super Admin Dashboard

#### `GET /super/dashboard`

Auth: `@RequireAuth('super.dashboard', 'read')`

**Response (200)** (`DashboardStatsResponseDto`)

```json
{
  "overview": {
    "totalTenants": 15,
    "activeTenants": 12,
    "totalUsers": 150,
    "activeUsers": 120,
    "totalCounsels": 500,
    "totalPosts": 80,
    "totalRoles": 45,
    "totalPermissions": 28
  },
  "today": {
    "newUsers": 3,
    "newCounsels": 12,
    "newPosts": 5,
    "activeSessions": 8
  },
  "monthlyTrends": {
    "userRegistrations": [{ "month": "2026-01", "count": 15 }],
    "counselRegistrations": [{ "month": "2026-01", "count": 45 }],
    "tenantRegistrations": [{ "month": "2026-01", "count": 2 }]
  },
  "security": {
    "totalBlockedIps": 50,
    "totalBlockedHps": 30,
    "totalBlockedWords": 20,
    "recentBlockedIps": 5,
    "recentBlockedHps": 3
  },
  "tenantStats": [
    {
      "tenantId": 2,
      "tenantName": "company-a",
      "isActive": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "userCount": 10,
      "activeUserCount": 8,
      "counselCount": 100,
      "todayCounselCount": 5,
      "postCount": 15,
      "roleCount": 3,
      "websiteCount": 2,
      "blockedIpCount": 5,
      "blockedHpCount": 3,
      "blockedWordCount": 2,
      "activeSessionCount": 4
    }
  ]
}
```

---

### 6.10 Websites

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/websites` | `websites.read` | 웹사이트 목록 |
| GET | `/websites/:webCode` | `websites.read` | 웹사이트 상세 |
| POST | `/websites` | `websites.create` | 웹사이트 생성 |
| PATCH | `/websites/:webCode` | `websites.update` | 웹사이트 수정 |
| PATCH | `/websites/:webCode/status` | `websites.update` | 상태 변경 |
| DELETE | `/websites/:webCode` | `websites.delete` | 웹사이트 삭제 |

Path Parameter: `webCode` (string, max 20)

목록 조회 Query: `page`, `limit`, `q`, `isActive`, `sort`, `order`

**CreateWebsiteDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| webCode | string | ❌ | 웹사이트 코드 (max 20, 미제공 시 자동 생성) |
| userSeq | number | ✅ | 담당자 userSeq |
| webUrl | string | ✅ | 웹사이트 URL (max 50) |
| webTitle | string | ❌ | 제목 (max 255) |
| webImg | string | ❌ | 이미지 URL (max 150) |
| webDesc | string | ❌ | 설명 (max 250) |
| webMemo | string | ❌ | 메모 (max 250) |
| isActive | number | ❌ | 기본값 1 |
| duplicateAllowAfterDays | number | ❌ | 중복 허용 기간 (기본 30일) |

삭제: 물리 삭제. **Response:** 204 No Content

---

### 6.11 Security (IP / 휴대폰 / 금칙어 차단)

3개 컨트롤러가 동일한 CRUD 패턴을 공유하며, **모두 `security.*` 권한 키를 사용**한다.

#### Block IP (`/security/block-ip`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/security/block-ip` | `security.read` | IP 차단 목록 |
| GET | `/security/block-ip/check` | `security.read` | IP 차단 여부 확인 |
| GET | `/security/block-ip/:id` | `security.read` | IP 차단 상세 |
| POST | `/security/block-ip` | `security.create` | IP 차단 등록 |
| POST | `/security/block-ip/bulk` | `security.create` | IP 대량 차단 등록 |
| PATCH | `/security/block-ip/:id` | `security.update` | IP 차단 수정 |
| DELETE | `/security/block-ip/:id` | `security.delete` | IP 차단 삭제 |

#### Block HP (`/security/block-hp`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/security/block-hp` | `security.read` | 휴대폰 차단 목록 |
| GET | `/security/block-hp/check` | `security.read` | 차단 여부 확인 |
| GET | `/security/block-hp/:id` | `security.read` | 휴대폰 차단 상세 |
| POST | `/security/block-hp` | `security.create` | 휴대폰 차단 등록 |
| POST | `/security/block-hp/bulk` | `security.create` | 대량 등록 |
| PATCH | `/security/block-hp/:id` | `security.update` | 수정 |
| DELETE | `/security/block-hp/:id` | `security.delete` | 삭제 |

#### Block Word (`/security/block-word`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| GET | `/security/block-word` | `security.read` | 금칙어 목록 |
| GET | `/security/block-word/check` | `security.read` | 금칙어 포함 여부 확인 |
| GET | `/security/block-word/:id` | `security.read` | 금칙어 상세 |
| POST | `/security/block-word` | `security.create` | 금칙어 등록 |
| POST | `/security/block-word/bulk` | `security.create` | 대량 등록 |
| PATCH | `/security/block-word/:id` | `security.update` | 수정 |
| DELETE | `/security/block-word/:id` | `security.delete` | 삭제 |

금칙어 목록 조회 시 추가 파라미터: `matchType` (`EXACT` | `CONTAINS` | `REGEX`)

**대량 등록 Request:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ips / phones / words | string | ✅ | 줄바꿈(`\n`) 또는 쉼표(`,`)로 구분 |
| reason | string | ❌ | 차단 사유 |
| isActive | number | ❌ | 기본값 1 |
| matchType | string | ❌ | 금칙어 전용 (EXACT / CONTAINS / REGEX) |

**대량 등록 Response:**

```json
{
  "successCount": 5,
  "skippedCount": 2,
  "totalCount": 7,
  "skippedIps": ["192.168.1.1", "10.0.0.1"]
}
```

**차단 확인 Response:**

```json
{
  "isBlocked": true,
  "reason": "스팸 IP",
  "blockId": 123,
  "matchedWord": "불법"
}
```

`matchedWord` 필드는 금칙어 확인 시에만 포함.

모든 Security DELETE 엔드포인트: **Response:** 204 No Content

---

### 6.12 Boards

#### 게시판 CRUD (`/boards`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| POST | `/boards` | `board_types.create` | 게시판 생성 |
| GET | `/boards` | `board_types.read` | 게시판 목록 |
| GET | `/boards/:boardId` | `board_types.read` | 게시판 상세 |
| PATCH | `/boards/:boardId` | `board_types.update` | 게시판 수정 |
| DELETE | `/boards/:boardId` | `board_types.delete` | 게시판 비활성화 |

**CreateBoardDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| boardKey | string | ✅ | slug 형식 (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 64) |
| name | string | ✅ | 게시판명 (max 256) |
| description | string | ❌ | 설명 (max 255) |
| sortOrder | number | ❌ | 정렬 순서 |

게시판 목록 정렬: `isActive DESC → sortOrder ASC (null 후순위) → boardId ASC`

게시판 삭제 = 비활성화 (`isActive = 0`). **Response:** 204 No Content

#### 게시글 CRUD (`/boards/:boardId/posts`)

| Method | Path | 권한 키 | 설명 |
|--------|------|---------|------|
| POST | `/boards/:boardId/posts` | `boards.posts.create` | 게시글 생성 |
| GET | `/boards/:boardId/posts` | `boards.posts.read` | 게시글 목록 |
| GET | `/boards/:boardId/posts/:postId` | `boards.posts.read` | 게시글 상세 |
| PATCH | `/boards/:boardId/posts/:postId` | `boards.posts.update` | 게시글 수정 |
| DELETE | `/boards/:boardId/posts/:postId` | `boards.posts.delete` | 게시글 소프트 삭제 |

**CreatePostDto:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | ✅ | 제목 (max 255) |
| content | string | ✅ | 본문 (HTML 허용) |
| isNotice | number | ❌ | 공지 여부 (기본 0) |
| startDtm | string\|null | ❌ | 노출 시작 (null이면 즉시) |
| endDtm | string\|null | ❌ | 노출 종료 (null이면 무기한) |

게시글 목록 필터: `deleteState='N'`, `isActive=1`, 노출 기간 내

게시글 정렬: `isNotice DESC (공지 상단) → createdAt DESC`

게시글 삭제: 소프트 삭제 (`deleteState = 'Y'`, `deletedAt` 설정). **Response:** 204 No Content

---

### 6.13 Counsels

#### `GET /counsels/dashboard`

Auth: `@RequireAuth('counsels.dashboard', 'read')`

**Query Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| startDate | string | YYYY-MM-DD (기본: 30일 전) |
| endDate | string | YYYY-MM-DD (기본: 오늘) |

`counsels.admin` 권한 보유: 테넌트 전체 데이터 + 담당자별 현황.
미보유: 자신에게 배정된 데이터만.

> `counsels.admin`은 `@RequireAuth` 데코레이터가 아닌, **컨트롤러 내부 런타임 체크**로 분기한다:
> `const isAdmin = user.permissions?.['counsels.admin'] === true;`
> admin이면 전체 조회, 아니면 `empSeqFilter = user.userSeq`로 본인 데이터만 조회.
> 이 패턴은 상담 모듈의 모든 엔드포인트에 동일하게 적용된다.

**Response (200)** (`CounselDashboardResponseDto`)

```json
{
  "summary": {
    "totalCounsels": 100,
    "newCounsels": 25,
    "completedCounsels": 60,
    "completionRate": 60.0
  },
  "statusDistribution": [
    { "counselStat": 1, "statusName": "신규", "color": "#FF0000", "count": 25 }
  ],
  "employeeStats": [
    { "empSeq": 1, "empName": "김담당", "count": 30 },
    { "empSeq": null, "empName": "미배정", "count": 10 }
  ],
  "dailyTrends": [
    { "date": "2026-03-01", "count": 5 }
  ],
  "topWebsites": [
    { "webCode": "WEB001", "webTitle": "메인 사이트", "count": 50 }
  ],
  "hourlyDistribution": [
    { "hour": 9, "count": 15 }
  ],
  "upcomingReservations": [
    {
      "counselSeq": 123,
      "name": "홍길동",
      "counselHp": "010-1234-5678",
      "counselResvDtm": "2026-03-26T14:00:00.000Z",
      "empName": "김담당",
      "statusName": "예약됨"
    }
  ]
}
```

#### `POST /counsels` — Public API (인증 불필요)

랜딩 페이지에서 호출하는 상담 신청 API. **보안 검증 순서:**

1. webCode 유효성 검증 → 400 (`VAL001`)
2. 차단된 전화번호 → 400 (`VAL001`)
3. 차단된 IP → 400 (`VAL001`)
4. 금칙어 (이름 + 메모) → 400 (`VAL001`)
5. tenant_status에 NEW/DUPLICATE 상태 존재 여부 → 400 (`VAL001`)
6. 동적 필드 fieldId 활성 여부 → 400 (`VAL001`)
7. Advisory Lock 경합 (동일 webCode + 전화번호 + IP) → 409 (`BIZ001`)

**중복 판별:** 동일 전화번호 + IP가 `Website.duplicateAllowAfterDays` 이내 존재 → `duplicateState = 'Y'`

**Request Body** (`CreateCounselDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| webCode | string | ✅ | 웹사이트 코드 (max 20) |
| name | string | ❌ | 이름 (max 50) |
| counselHp | string | ✅ | 전화번호 (max 50) |
| counselSource | string | ❌ | UTM source (max 50) |
| counselMedium | string | ❌ | UTM medium (max 50) |
| counselCampaign | string | ❌ | UTM campaign (max 50) |
| counselResvDtm | string\|null | ❌ | 예약 일시 (ISO 8601) |
| counselMemo | string | ❌ | 메모 (max 255) |
| fieldValues | CounselFieldValueDto[] | ❌ | 커스텀 동적 필드 값 |

`CounselFieldValueDto`:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| fieldId | number | ✅ | 필드 정의 ID |
| valueText | string | ❌ | 텍스트 값 |
| valueNumber | number | ❌ | 숫자 값 |
| valueDate | string | ❌ | 날짜 (YYYY-MM-DD) |
| valueDatetime | string | ❌ | 일시 (ISO 8601) |

**Response (201)** (`CounselDetailDto`)

#### `GET /counsels`

Auth: `@RequireAuth('counsels', 'read')`

**Query Parameters:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 (max 100) |
| q | string | - | 검색 (name, counselHp, counselMemo) |
| counselStat | number | - | 상담 상태 ID |
| empSeq | number | - | 담당자 userSeq |
| webCode | string | - | 웹사이트 코드 |
| startDate | string | - | 등록 시작일 (YYYY-MM-DD) |
| endDate | string | - | 등록 종료일 (YYYY-MM-DD) |
| duplicateState | string | - | 중복 여부 (Y 또는 N) |
| resvStartDate | string | - | 예약 시작일 |
| resvEndDate | string | - | 예약 종료일 |

**Response (200)** (`CounselListResponseDto`)

```json
{
  "items": [
    {
      "counselSeq": 1,
      "webCode": "WEB001",
      "webTitle": "메인 사이트",
      "name": "홍길동",
      "counselHp": "010-1234-5678",
      "counselStat": 1,
      "statusName": "신규",
      "empSeq": 5,
      "empName": "김담당",
      "duplicateState": "N",
      "counselResvDtm": null,
      "regDtm": "2026-03-01T10:00:00.000Z",
      "editDtm": "2026-03-01T10:00:00.000Z",
      "fieldValues": [
        {
          "fieldId": 1,
          "fieldKey": "budget",
          "label": "예산",
          "fieldType": "number",
          "valueText": null,
          "valueNumber": 5000000,
          "valueDate": null,
          "valueDatetime": null
        }
      ]
    }
  ],
  "pageInfo": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

#### `GET /counsels/:id`

Auth: `@RequireAuth('counsels', 'read')`

**Response (200)** (`CounselDetailDto`)

CounselListItemDto 확장: `counselIp`, `counselSource`, `counselMedium`, `counselCampaign`, `counselMemo`, `logs[]`, `memos[]` 포함

#### `PATCH /counsels/:id`

Auth: `@RequireAuth('counsels', 'update')`

**Request Body** (`UpdateCounselDto`, 모든 필드 선택)

| 필드 | 타입 | 설명 |
|------|------|------|
| name | string\|null | 이름 |
| counselHp | string | 전화번호 |
| empSeq | number\|null | 담당자 |
| counselSource | string\|null | UTM source |
| counselMedium | string\|null | UTM medium |
| counselCampaign | string\|null | UTM campaign |
| counselResvDtm | string\|null | 예약 일시 |
| counselMemo | string\|null | 메모 |
| fieldValues | CounselFieldValueDto[] | 동적 필드 (전체 교체) |

#### `DELETE /counsels/:id`

Auth: `@RequireAuth('counsels', 'delete')`

소프트 삭제 (`deleteState = 'Y'`). **Response:** 204 No Content

#### `PATCH /counsels/:id/status`

Auth: `@RequireAuth('counsels', 'update')`

**Request Body** (`CounselUpdateStatusDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| counselStat | number | ✅ | 새 상태 ID (`TenantStatus.tenantStatusId`) |
| counselResvDtm | string | 조건부 | `statusKey='SCHEDULED'`일 때 필수 (ISO 8601) |

상태 변경 시 CounselLog에 이력 자동 기록. **Response:** 204 No Content

#### `GET /counsels/:id/logs`

Auth: `@RequireAuth('counsels', 'read')`

**Response (200):** `CounselLogDto[]`

```json
[
  {
    "counselSeq": 1,
    "logNo": 1,
    "counselStat": 1,
    "statusName": "신규",
    "regDtm": "2026-03-01T10:00:00.000Z"
  }
]
```

#### `POST /counsels/:id/memo`

Auth: `@RequireAuth('counsels', 'update')`

**Request Body** (`CreateMemoDto`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| memoText | string | ✅ | 메모 내용 (max 65535) |

**Response (201):** `CounselMemoDto`

#### `GET /counsels/:id/memo`

Auth: `@RequireAuth('counsels', 'read')`

**Response (200):** `CounselMemoDto[]`

```json
[
  {
    "memoLogId": 1,
    "counselSeq": 1,
    "statusId": 1,
    "statusName": "신규",
    "memoText": "고객과 통화 완료",
    "createdBy": 5,
    "creatorName": "김담당",
    "createdAt": "2026-03-01T14:00:00.000Z"
  }
]
```

---

### 6.14 Counsel Fields

#### `GET /counsel-fields`

Auth: `@RequireAuth('counsels', 'read')`

활성(`isActive=1`) 필드 정의만 반환. 정렬: `sortOrder ASC (null 후순위) → fieldId ASC`.

**Response (200):** `CounselFieldDefDto[]`

```json
[
  {
    "fieldId": 1,
    "fieldKey": "budget",
    "label": "예산",
    "fieldType": "number",
    "isRequired": 0,
    "isActive": 1,
    "sortOrder": 1,
    "placeholder": "예산을 입력하세요",
    "helpText": "단위: 원",
    "defaultValue": null,
    "optionsJson": null
  }
]
```

`fieldType` 가능 값: `text`, `number`, `date`, `datetime`, `select`

---

## 7. 도메인 설계

### 7.1 엔티티 관계 다이어그램

```
┌─────────┐    1:N    ┌──────────┐    N:1    ┌──────────────┐
│ Tenant  │──────────▶│   User   │◀─────────│  UserRole    │
│         │           │          │           │ (PK: userSeq,│
│         │    1:N    │          │           │  tenantId,   │
│         │──────┐    └──────────┘           │  roleId)     │
│         │      │                            └──────┬───────┘
│         │      │    ┌──────────┐               N:1 │
│         │      └───▶│   Role   │◀──────────────────┘
│         │           │          │
│         │    1:N    │          │    1:N    ┌────────────────┐
│         │──────┐    └──────────┘──────────▶│ RolePermission │
│         │      │                            │ (PK: roleId,   │
│         │      │                            │  permissionId)  │
│         │      │                            └───────┬─────────┘
│         │      │                                N:1 │
│         │      │    ┌─────────────┐                 │
│         │      │    │ Permission  │◀────────────────┘
│         │      │    │  pageId FK  │────▶ Page
│         │      │    │ actionId FK │────▶ Action
│         │      │    └─────────────┘
│         │      │
│         │      └───▶ TenantStatus (1:N)
│         │
│         ├──(1:N)──▶ Website ◀──(N:1)── Counsel
│         │                                  ├──▶ CounselLog
│         │                                  ├──▶ CounselMemoLog
│         │                                  └──▶ CounselFieldValue
│         │
│         ├──(1:N)──▶ CounselFieldDef
│         │
│         ├──(1:N)──▶ Board ──(1:N)──▶ Post
│         │
│         ├──(1:N)──▶ BlockIp
│         ├──(1:N)──▶ BlockHp
│         └──(1:N)──▶ BlockWord

전역 카탈로그 (테넌트 격리 없음):
  Page, Action, Permission, CodeGroup, Code
```

### 7.2 주요 엔티티 상세

#### Tenant (`tenants`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| tenant_id | INT | PK, AUTO_INCREMENT | 테넌트 ID |
| tenant_name | VARCHAR(100) | UNIQUE, NOT NULL | 테넌트 코드명 |
| display_name | VARCHAR(100) | NULLABLE | 표시명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| domain | VARCHAR(200) | NULLABLE | 도메인 |
| created_at | DATETIME | AUTO | 생성일 |
| updated_at | DATETIME | AUTO | 수정일 |

#### TenantStatus (`tenant_status`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| tenant_status_id | INT | PK, AUTO_INCREMENT | 상태 ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| status_group | VARCHAR(50) | NOT NULL | 상태 그룹 |
| status_key | VARCHAR(50) | NOT NULL | 상태 코드 |
| status_name | VARCHAR(100) | NOT NULL | 상태명 |
| description | VARCHAR(255) | NULLABLE | 설명 |
| color | VARCHAR(7) | NULLABLE | HEX 색상 코드 |
| sort_order | INT | NULLABLE | 정렬 순서 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (tenant_id, status_group, status_key)

#### User (`users`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| user_seq | INT | PK, AUTO_INCREMENT | 사용자 시퀀스 |
| user_id | VARCHAR(200) | NOT NULL | 로그인 ID |
| user_pwd | VARCHAR(200) | NOT NULL | bcrypt 해시 |
| corp_name | VARCHAR(250) | NOT NULL | 회사명 |
| user_name | VARCHAR(200) | NOT NULL | 사용자명 |
| user_email | VARCHAR(250) | NULLABLE | 이메일 |
| user_tel | VARCHAR(200) | NULLABLE | 전화번호 |
| user_hp | VARCHAR(200) | NULLABLE | 휴대폰번호 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| token_version | INT | DEFAULT 0 | 토큰 무효화 버전 |
| reg_dtm | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일 |
| stop_dtm | DATETIME | NULLABLE | 정지일 |
| tenant_id | INT | FK → tenants, DEFAULT 1 | 테넌트 ID |

**UNIQUE:** (user_seq, tenant_id), (tenant_id, user_id)

#### Role (`roles`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| role_id | INT | PK, AUTO_INCREMENT | 역할 ID |
| role_name | VARCHAR(100) | NOT NULL | 역할 코드명 |
| display_name | VARCHAR(100) | NULLABLE | 표시명 |
| description | TEXT | NULLABLE | 설명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_at / updated_at | DATETIME | AUTO | |
| tenant_id | INT | FK → tenants, DEFAULT 1 | 테넌트 ID |

**UNIQUE:** (tenant_id, role_name), (role_id, tenant_id)

#### UserRole (`user_roles`) — 복합 PK

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| user_seq | INT | PK, FK → users | 사용자 시퀀스 |
| tenant_id | INT | PK | 테넌트 ID |
| role_id | INT | PK, FK → roles | 역할 ID |
| created_at / updated_at | DATETIME | AUTO | |

#### RolePermission (`role_permissions`) — 복합 PK

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| role_id | INT | PK, FK → roles | 역할 ID |
| permission_id | INT | PK, FK → permissions | 권한 ID |
| created_at / updated_at | DATETIME | AUTO | |

#### Page (`pages`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| page_id | INT | PK, AUTO_INCREMENT | 페이지 ID |
| parent_id | INT | FK → pages, NULLABLE | 부모 페이지 |
| page_name | VARCHAR(100) | UNIQUE | 페이지 코드명 |
| path | VARCHAR(255) | NOT NULL | URL 경로 |
| display_name | VARCHAR(100) | NOT NULL | 표시명 |
| description | TEXT | NULLABLE | 설명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| sort_order | TINYINT | NULLABLE | 정렬 순서 |
| created_at / updated_at | DATETIME | AUTO | |

#### Action (`actions`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| action_id | INT | PK, AUTO_INCREMENT | 액션 ID |
| action_name | VARCHAR(50) | UNIQUE | 액션 코드명 |
| display_name | VARCHAR(100) | NULLABLE | 표시명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_at / updated_at | DATETIME | AUTO | |

#### Permission (`permissions`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| permission_id | INT | PK, AUTO_INCREMENT | 권한 ID |
| page_id | INT | FK → pages | 페이지 ID |
| action_id | INT | FK → actions | 액션 ID |
| display_name | VARCHAR(100) | NULLABLE | 표시명 |
| description | TEXT | NULLABLE | 설명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (page_id, action_id)

#### RefreshToken (`refresh_tokens`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | ID |
| token_id | VARCHAR(100) | UNIQUE | 토큰 식별자 (UUID) |
| token_hash | VARCHAR(255) | NOT NULL | bcrypt(secret) |
| user_seq | INT | FK → users (CASCADE) | 사용자 시퀀스 |
| expires_at | DATETIME | NOT NULL | 만료 시각 |
| revoked | TINYINT | DEFAULT 0 | 0=유효, 1=폐기 |
| created_at | DATETIME | AUTO | 생성일 |

#### Website (`websites`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| web_code | VARCHAR(20) | PK | 웹사이트 코드 |
| user_seq | INT | FK → users | 담당자 |
| web_url | VARCHAR(50) | NOT NULL | URL |
| web_title | VARCHAR(255) | NULLABLE | 제목 |
| web_img | VARCHAR(150) | NULLABLE | 이미지 URL |
| web_desc | VARCHAR(250) | NULLABLE | 설명 |
| web_memo | VARCHAR(250) | NULLABLE | 메모 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| duplicate_allow_after_days | INT | DEFAULT 30 | 중복 허용 기간 (일) |
| created_at / updated_at | DATETIME | AUTO | |
| tenant_id | INT | FK → tenants | 테넌트 ID |

**UNIQUE:** (web_code, tenant_id)

#### Counsel (`counsel`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| counsel_seq | BIGINT | PK, AUTO_INCREMENT | 상담 시퀀스 |
| web_code | VARCHAR(20) | FK → websites | 웹사이트 코드 |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| name | VARCHAR(50) | NULLABLE | 이름 |
| counsel_hp | VARCHAR(50) | NOT NULL | 전화번호 |
| counsel_ip | VARCHAR(50) | NOT NULL | IP 주소 |
| counsel_stat | INT | FK → tenant_status | 상담 상태 ID |
| emp_seq | INT | FK → users, NULLABLE | 담당자 |
| counsel_source | VARCHAR(50) | NULLABLE | UTM source |
| counsel_medium | VARCHAR(50) | NULLABLE | UTM medium |
| counsel_campaign | VARCHAR(50) | NULLABLE | UTM campaign |
| counsel_resv_dtm | DATETIME | NULLABLE | 예약 일시 |
| counsel_memo | TINYTEXT | NULLABLE | 메모 |
| reg_dtm | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일 |
| edit_dtm | DATETIME | AUTO UPDATE | 수정일 |
| duplicate_state | CHAR(1) | DEFAULT 'N' | 중복 여부 (Y/N) |
| delete_state | ENUM('Y','N') | DEFAULT 'N' | 삭제 여부 |

**UNIQUE:** (counsel_seq, tenant_id)

#### CounselFieldDef (`counsel_field_def`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| field_id | BIGINT | PK, AUTO_INCREMENT | 필드 ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| field_key | VARCHAR(64) | NOT NULL | 필드 코드 |
| label | VARCHAR(100) | NOT NULL | 표시명 |
| field_type | VARCHAR(20) | NOT NULL | 타입 (text/number/date/datetime/select) |
| is_required | TINYINT | DEFAULT 0 | 필수 여부 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| sort_order | INT | NULLABLE | 정렬 순서 |
| placeholder | VARCHAR(150) | NULLABLE | 플레이스홀더 |
| help_text | VARCHAR(255) | NULLABLE | 도움말 |
| default_value | VARCHAR(255) | NULLABLE | 기본값 |
| options_json | LONGTEXT (JSON) | NULLABLE | 선택지 옵션 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (tenant_id, field_key)

#### CounselFieldValue (`counsel_field_value`) — 복합 PK

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| counsel_seq | BIGINT | PK, FK → counsel CASCADE | 상담 시퀀스 |
| tenant_id | INT | PK | 테넌트 ID |
| field_id | BIGINT | PK, FK → counsel_field_def | 필드 ID |
| value_text | TEXT | NULLABLE | 텍스트 값 |
| value_number | DECIMAL(20,6) | NULLABLE | 숫자 값 |
| value_date | DATE | NULLABLE | 날짜 값 |
| value_datetime | DATETIME | NULLABLE | 일시 값 |
| created_at / updated_at | DATETIME | AUTO | |

#### CounselLog (`counsel_log`) — 복합 PK

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| counsel_seq | BIGINT | PK, FK → counsel CASCADE | 상담 시퀀스 |
| tenant_id | INT | PK | 테넌트 ID |
| log_no | INT | PK | 로그 순번 |
| counsel_stat | INT | FK → tenant_status | 상태 ID |
| reg_dtm | DATETIME | DEFAULT CURRENT_TIMESTAMP | 기록일 |

#### CounselMemoLog (`counsel_memo_log`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| memo_log_id | BIGINT | PK, AUTO_INCREMENT | 메모 ID |
| counsel_seq | BIGINT | FK → counsel CASCADE | 상담 시퀀스 |
| tenant_id | INT | NOT NULL | 테넌트 ID |
| status_id | INT | FK → tenant_status | 작성 시점 상태 |
| memo_text | TEXT | NOT NULL | 메모 내용 |
| created_by | INT | FK → users, NULLABLE | 작성자 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 작성일 |
| is_deleted | TINYINT | DEFAULT 0 | 삭제 여부 |
| deleted_at | DATETIME | NULLABLE | 삭제일 |
| deleted_by | INT | FK → users, NULLABLE | 삭제자 |

#### Board (`board`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| board_id | INT | PK, AUTO_INCREMENT | 게시판 ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| board_key | VARCHAR(64) | NOT NULL | slug 코드 |
| name | VARCHAR(256) | NOT NULL | 게시판명 |
| description | VARCHAR(255) | NULLABLE | 설명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| sort_order | INT | NULLABLE | 정렬 순서 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (tenant_id, board_key)

#### Post (`post`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| post_id | INT | PK, AUTO_INCREMENT | 게시글 ID |
| board_id | INT | FK → board | 게시판 ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| user_seq | INT | FK → users | 작성자 |
| title | VARCHAR(255) | NOT NULL | 제목 |
| content | LONGTEXT | NOT NULL | 본문 (HTML) |
| is_notice | TINYINT | DEFAULT 0 | 공지 여부 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| delete_state | ENUM('Y','N') | DEFAULT 'N' | 삭제 여부 |
| start_dtm | DATETIME | NULLABLE | 노출 시작 |
| end_dtm | DATETIME | NULLABLE | 노출 종료 |
| created_at / updated_at | DATETIME | AUTO | |
| deleted_at | DATETIME | NULLABLE | 삭제일 |

#### BlockIp (`block_ip`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| dbi_idx | BIGINT | PK, AUTO_INCREMENT | ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| block_ip | VARCHAR(45) | NOT NULL | IPv4/IPv6 주소 |
| reason | VARCHAR(255) | NULLABLE | 차단 사유 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_by | INT | FK → users, NULLABLE | 등록자 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (tenant_id, block_ip)

#### BlockHp (`block_hp`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| dbh_idx | BIGINT | PK, AUTO_INCREMENT | ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| block_hp | VARCHAR(20) | NOT NULL | 전화번호 |
| reason | VARCHAR(255) | NULLABLE | 차단 사유 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_by | INT | FK → users, NULLABLE | 등록자 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (tenant_id, block_hp)

#### BlockWord (`block_word`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| dbw_idx | BIGINT | PK, AUTO_INCREMENT | ID |
| tenant_id | INT | FK → tenants | 테넌트 ID |
| block_word | VARCHAR(100) | NOT NULL | 금칙어 |
| match_type | VARCHAR(10) | DEFAULT 'CONTAINS' | 매칭 방식 (EXACT/CONTAINS/REGEX) |
| reason | VARCHAR(255) | NULLABLE | 차단 사유 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_by | INT | FK → users, NULLABLE | 등록자 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (tenant_id, block_word, match_type)

#### CodeGroup (`code_groups`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| code_group_id | INT | PK, AUTO_INCREMENT | 코드 그룹 ID |
| code_group_key | VARCHAR(50) | UNIQUE | 그룹 코드 |
| code_group_name | VARCHAR(100) | NOT NULL | 그룹명 |
| description | VARCHAR(255) | NULLABLE | 설명 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_at / updated_at | DATETIME | AUTO | |

#### Code (`codes`)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| code_id | INT | PK, AUTO_INCREMENT | 코드 ID |
| code_group_id | INT | FK → code_groups | 코드 그룹 ID |
| code_key | VARCHAR(50) | NOT NULL | 코드 키 |
| code_name | VARCHAR(100) | NOT NULL | 코드명 |
| description | VARCHAR(255) | NULLABLE | 설명 |
| sort_order | INT | NULLABLE | 정렬 순서 |
| is_active | TINYINT | DEFAULT 1 | 활성 상태 |
| created_at / updated_at | DATETIME | AUTO | |

**UNIQUE:** (code_group_id, code_key)

---

## 8. 에러 처리 구조

### 8.1 표준 에러 응답 형식

모든 에러는 `GlobalExceptionFilter`에서 아래 형식으로 통일된다:

```json
{
  "error": {
    "code": "AUTH001",
    "message": "Authentication required",
    "statusCode": 401
  },
  "meta": {
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "timestamp": "2026-03-25T12:34:56.789Z",
    "path": "/auth/login"
  }
}
```

### 8.2 에러 코드 체계

#### 비즈니스 예외 (`BaseBusinessException` 하위 클래스)

| 에러 코드 | HTTP | 예외 클래스 | 외부 메시지 | 설명 |
|-----------|------|-------------|-----------|------|
| `AUTH001` | 401 | `AuthenticationException` | `Authentication required` | 인증 실패 (토큰 없음/만료/위조, 비활성 계정, tokenVersion 불일치) |
| `AUTH101` | 403 | `AuthorizationException` | `Forbidden` | 권한 부족 (RBAC 검증 실패) |
| `VAL001` | 400 | `ValidationException` | 구체적 메시지 | 유효성 검증 실패 (필수 파라미터 누락, 형식 오류) |
| `BIZ001` | 409 | `BusinessConflictException` | 구체적 메시지 | 비즈니스 충돌 (중복 리소스, 상태 충돌) |
| `RES001` | 404 | `ResourceNotFoundException` | 구체적 메시지 | 리소스 미존재 |

#### NestJS 기본 HttpException (비즈니스 예외가 아닌 경우)

`GlobalExceptionFilter`에서 HTTP 상태 코드 기반으로 fallback 에러 코드를 매핑한다:

| HTTP 상태 | 매핑 에러 코드 | 설명 |
|-----------|---------------|------|
| 401 | `AUTH001` | 인증 실패 |
| 403 | `AUTH101` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 400 | `VAL001` | 잘못된 요청 |
| 409 | `BIZ002` | 충돌 (비즈니스 예외가 아닌 일반 409) |
| 5xx | `SYS001` | 서버 오류 |
| 기타 | `HTTP_{status}` | 기타 HTTP 상태 |

> **참고:** `BaseBusinessException`이 발생하면 해당 예외의 `errorCode`가 우선 사용된다.
> 예: `BusinessConflictException`은 409이지만 에러 코드는 `BIZ001`이다.
> `BIZ002`는 비즈니스 예외가 아닌 일반 `HttpException(409)`의 fallback 코드이다.

### 8.3 에러 로깅 정책

| 구분 | 외부 응답 (클라이언트) | 내부 로그 (서버) |
|------|----------------------|-----------------|
| 메시지 | 간결한 `externalMessage` | 상세한 `internalMessage` |
| 스택 트레이스 | 미포함 | 포함 |
| 사용자 정보 | 미포함 | userSeq, tenantId |
| IP | 미포함 | 포함 |

**로그 레벨:**
- 401, 403 → `WARN`
- 5xx → `ERROR`
- 기타 → `LOG`

### 8.4 Request ID

- 클라이언트가 `X-Request-ID` 헤더로 전송하면 그대로 사용
- 미전송 시 서버에서 UUID v4 생성
- 응답 헤더 `X-Request-ID`에도 포함
- 에러 응답의 `meta.requestId`에 포함

---

## 9. 기타

### 9.1 Rate Limiting

`@nestjs/throttler`를 사용하며, `ThrottlerGuard`를 전역 가드로 등록한다.

| 엔드포인트 | 제한 | 설정 위치 |
|-----------|------|----------|
| `POST /auth/login` | 5회/60초 | `@Throttle()` |
| `POST /auth/signup` | 3회/60초 | `@Throttle()` |
| `POST /auth/refresh` | 10회/60초 | `@Throttle()` |
| 기타 모든 API | 60회/60초 | 전역 설정 (`AppModule`) |

IP 주소 기반 추적. 제한 초과 시 429 Too Many Requests 응답.

### 9.2 보안 설정

| 기능 | 설정 |
|------|------|
| Helmet | 보안 헤더 적용 (CSP 비활성화 — Swagger 호환) |
| CORS | `CORS_ORIGIN` 환경변수 또는 localhost 패턴, `credentials: true` |
| Password | bcrypt (salt rounds: 10) |
| Trust Proxy | `trust proxy: 1` |
| ValidationPipe | `whitelist: true`, `forbidNonWhitelisted: true` |
| 인증 실패 메시지 | 동일 메시지 (`Authentication required`) — 정보 노출 방지 |
| Refresh Token Secret | 64-byte hex, bcrypt 해싱 후 저장 |
| Token Rotation | refresh 시 기존 토큰 즉시 revoked |

### 9.3 환경 변수

`ConfigModule`에서 `.env.{NODE_ENV}` 파일을 로드하며, `validate` 함수로 필수 변수를 검증한다.

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NODE_ENV` | 실행 환경 | `development` |
| `PORT` | 서버 포트 | `3000` |
| `DB_HOST` | MySQL 호스트 | - |
| `DB_PORT` | MySQL 포트 | - |
| `DB_USERNAME` | MySQL 사용자명 | - |
| `DB_PASSWORD` | MySQL 비밀번호 | - |
| `DB_DATABASE` | MySQL 데이터베이스명 | - |
| `JWT_SECRET` | JWT 서명 키 | `changeme` |
| `JWT_EXPIRES_IN` | Access Token 만료 시간 | `3600s` |
| `CORS_ORIGIN` | 허용 Origin (쉼표 구분) | localhost 패턴 |

### 9.4 Swagger API 문서

- **활성화 조건:** `NODE_ENV !== 'production'`
- **접속 경로:** `http://localhost:{PORT}/api`
- **인증:** Bearer JWT (`persistAuthorization: true` — 새로고침 후에도 토큰 유지)
- **서버:**
  - `http://localhost:{PORT}` (로컬)
  - `https://flowdesk-admin-production.up.railway.app` (프로덕션)

### 9.5 공통 페이지네이션 응답 구조

대부분의 목록 API가 동일한 구조를 사용한다:

```json
{
  "items": [],
  "pageInfo": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

예외: 게시판 목록(`GET /boards`)은 `pageInfo` 없이 `items` 배열만 반환.
