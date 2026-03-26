# flowdesk-admin 백엔드

멀티테넌트 B2B SaaS 관리자 시스템의 백엔드 서버

---

## 목차

1. [백엔드 서버 개요](#1-백엔드-서버-개요)
2. [핵심 설계 원칙](#2-핵심-설계-원칙)
3. [기술 스택 상세](#3-기술-스택-상세)
4. [프로젝트 디렉터리 구조](#4-프로젝트-디렉터리-구조)
5. [인증(Authentication) 흐름](#5-인증authentication-흐름)
6. [권한(Authorization) 및 스코프 정책](#6-권한authorization-및-스코프-정책)
7. [요청 처리 흐름](#7-요청-처리-흐름-request-lifecycle)
8. [환경 변수 및 설정 관리](#8-환경-변수-및-설정-관리)
9. [로컬 개발 및 실행 방법](#9-로컬-개발-및-실행-방법)
10. [개발 시 주의사항 및 규칙](#10-개발-시-주의사항-및-규칙)
11. [문서 연결](#11-문서-연결)

---

## 1. 백엔드 서버 개요

### 이 서버가 담당하는 역할

- 멀티테넌트 환경에서 회사(테넌트)별 데이터 격리 및 접근 제어
- 사용자 인증(로그인, 토큰 발급) 및 인가(권한 검증)
- 관리자 및 팀원 계정 관리
- 역할 기반 접근 제어(RBAC) 정책 적용
- 모든 비즈니스 API의 테넌트 스코프 강제

### 전체 시스템에서의 위치

```
+---------------+     +---------------+     +---------------+
|    Backend    |---->|   Database    |
|   (SPA/Web)   |     |   (이 서버)    |     |    (MySQL)    |
+---------------+     +---------------+     +---------------+
                             |
                             v
                      +---------------+
                      |  외부 서비스   |
                      |  (미래 확장)   |
                      +---------------+
```


### 프론트엔드 및 외부 시스템과의 관계

| 구성 요소 | 역할 | 통신 방식 |
|----------|------|----------|
| 프론트엔드 | 사용자 인터페이스, API 호출 | REST API + JWT 인증 |
| 백엔드 (이 서버) | 비즈니스 로직, 인증/인가, 데이터 접근 | - |
| 데이터베이스 | 영속 데이터 저장 | TypeORM을 통한 MySQL 연결 |

---

## 2. 핵심 설계 원칙

### 멀티테넌트 설계 원칙

**단일 데이터베이스, 논리적 격리 방식**을 채택한다.

- 모든 주요 테이블에 `tenant_id` 컬럼이 존재한다
- 모든 쿼리에 테넌트 필터가 자동 적용된다
- 테넌트 간 데이터 교차 접근은 시스템적으로 불가능하다

이 방식을 선택한 이유:
- 운영 복잡도 최소화 (단일 DB 관리)
- 스키마 변경 시 일괄 적용 가능
- 비용 효율성 (소규모 테넌트도 동일 인프라 사용)

### 회사(테넌트) 스코프 강제 방식

모든 인증된 요청에서 테넌트 스코프를 강제한다.

1. **토큰 기반 스코프**: JWT 토큰에 `tenantId` 포함
2. **자동 필터링**: 서비스 레이어에서 `user.tenantId` 기준으로 데이터 필터
3. **명시적 검증**: 다른 테넌트 리소스 접근 시도 시 403 반환

### 인증/인가 중앙 통제

인증과 인가를 개별 컨트롤러가 아닌 **중앙 가드/데코레이터에서 처리**한다.

| 구성 요소 | 역할 |
|----------|------|
| `JwtAuthGuard` | 모든 보호 라우트에서 토큰 유효성 검증 |
| `PermissionGuard` | 역할 기반 권한 검증 |
| `@RequireAuth` | 인증 + 권한을 한 번에 적용하는 데코레이터 |

이 방식의 장점:
- 권한 검증 로직 중복 방지
- 새 API 추가 시 권한 누락 가능성 최소화
- 일관된 에러 응답 보장

### 설계 철학

> **"편의보다 안전 우선"**

- 기본값은 항상 "접근 거부"
- 권한은 명시적으로 부여해야만 획득
- 상세 에러 정보는 외부에 노출하지 않음
- 모든 인증 실패는 동일한 메시지로 응답

---

## 3. 기술 스택 상세

### 런타임 및 프레임워크

| 기술 | 버전 | 선택 이유 |
|------|------|----------|
| Node.js | 18+ | 비동기 I/O 효율성, TypeScript 생태계 |
| NestJS | 11.x | 모듈화된 아키텍처, 의존성 주입, 엔터프라이즈 패턴 지원 |
| TypeScript | 5.x | 타입 안정성, 리팩토링 용이성 |

### 데이터베이스 및 ORM

| 기술 | 버전 | 선택 이유 |
|------|------|----------|
| MySQL | 8.x | 안정성, 트랜잭션 지원, 운영 경험 |
| TypeORM | 0.3.x | NestJS 통합, 데코레이터 기반 엔티티 정의 |

TypeORM 선택 이유:
- Active Record와 Data Mapper 패턴 모두 지원
- 마이그레이션 시스템 내장
- 관계 정의가 직관적

### 인증 및 보안

| 기술 | 용도 |
|------|------|
| Passport.js + passport-jwt | JWT 기반 인증 전략 |
| @nestjs/jwt | JWT 토큰 생성 및 검증 |
| bcrypt | 비밀번호 해싱 (salt rounds: 10) |
| @nestjs/throttler | Rate Limiting (요청 횟수 제한) |

JWT 선택 이유:
- 서버 상태 저장 불필요 (Stateless)
- 수평 확장 용이
- 토큰에 필요한 정보(tenantId, userSeq) 포함 가능

### API 문서화

| 기술 | 용도 |
|------|------|
| @nestjs/swagger | OpenAPI 3.0 명세 자동 생성 |
| swagger-ui-express | API 문서 UI 제공 (/api) |

### Swagger 태그 구성

| 태그 | 설명 |
|------|------|
| Health | 헬스체크 및 시스템 진단 |
| Auth | 인증 관련 API (로그인, 회원가입, 토큰 관리) |
| Users | 사용자 관리 API |
| Roles | 역할 관리 API (역할 CRUD, 권한/사용자 할당) |
| Tenants | 테넌트 관리 API (슈퍼 관리자 전용, 멀티테넌시) |
| Permissions | 권한 카탈로그 조회 API |
| Permissions Admin | 페이지/액션/권한 CRUD API (슈퍼 관리자 전용) |
| Super Admin | 슈퍼 관리자 대시보드 API (슈퍼 관리자 전용, 시스템 통계) |
| Websites | 웹사이트 관리 API (상담 유입 웹사이트 CRUD) |
| Security - Block IP | IP 차단 관리 API (CRUD, 대량 등록, 차단 여부 확인) |
| Security - Block HP | 휴대폰 차단 관리 API (CRUD, 대량 등록, 차단 여부 확인) |
| Security - Block Word | 금칙어 관리 API (CRUD, 대량 등록, 금칙어 포함 여부 확인) |
| Counsels | 상담 관리 API (CRUD, 상태 변경, 메모, 중복 감지, 보안 차단) |
| Counsel Fields | 상담 동적 필드 정의 조회 API (테넌트별 커스텀 필드) |

---

## 4. 프로젝트 디렉터리 구조

```
backend/
├── src/
│   ├── main.ts                    # 애플리케이션 진입점
│   ├── app.module.ts              # 루트 모듈
│   │
│   ├── common/                    # 전역 공통 모듈
│   │   ├── decorators/            # 커스텀 데코레이터
│   │   │   ├── require-auth.decorator.ts      # JWT + 권한 검증 복합 데코레이터
│   │   │   ├── require-permission.decorator.ts # 권한 메타데이터 설정
│   │   │   └── transactional.decorator.ts     # 트랜잭션 데코레이터
│   │   ├── dto/                   # 공통 DTO
│   │   │   └── error-response.dto.ts          # 표준 에러 응답 형식
│   │   ├── exceptions/            # 커스텀 예외 클래스
│   │   │   └── base.exception.ts              # 비즈니스 예외 정의
│   │   ├── filters/               # 전역 예외 필터
│   │   │   └── global-exception.filter.ts     # 모든 에러 표준화
│   │   ├── guards/                # 인증/인가 가드
│   │   │   └── permission.guard.ts            # RBAC 권한 검증
│   │   └── utils/                 # 유틸리티 함수
│   │       ├── permission.util.ts             # 권한 키 생성
│   │       └── transaction.util.ts            # 트랜잭션 유틸리티
│   │
│   ├── config/                    # 환경 설정
│   │   ├── configuration.ts       # 환경 변수 로드
│   │   ├── database.config.ts     # DB 연결 설정
│   │   └── validation.ts          # 환경 변수 검증
│   │
│   ├── database/                  # 데이터베이스 설정
│   │   ├── database.module.ts     # TypeORM 모듈 등록
│   │   ├── datasource.ts          # 마이그레이션용 DataSource
│   │   └── typeorm.module-options.ts
│   │
│   └── modules/                   # 도메인 모듈
│       ├── auth/                  # 인증 모듈
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── dto/               # 인증 관련 DTO
│       │   ├── entities/          # RefreshToken 엔티티
│       │   ├── guards/            # JwtAuthGuard
│       │   ├── strategies/        # JwtStrategy
│       │   └── types/             # SafeUser 타입
│       │
│       ├── users/                 # 사용자 관리 모듈
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── users.module.ts
│       │   ├── dto/               # 사용자 관련 DTO
│       │   └── entities/          # User 엔티티
│       │
│       ├── roles/                 # 역할 관리 모듈
│       │   ├── roles.controller.ts
│       │   ├── roles.service.ts
│       │   ├── roles.module.ts
│       │   ├── dto/               # 역할 관련 DTO
│       │   └── entities/          # Role, UserRole, RolePermission 엔티티
│       │
│       ├── rbac/                  # RBAC 권한 관리 모듈
│       │   ├── permissions.controller.ts       # 권한 카탈로그 조회
│       │   ├── permissions-admin.controller.ts # 페이지/액션/권한 CRUD
│       │   ├── permissions.service.ts
│       │   ├── permissions-admin.service.ts
│       │   ├── permissions.module.ts
│       │   ├── dto/               # 권한 관련 DTO
│       │   └── entities/          # Page, Action, Permission 엔티티
│       │
│       ├── tenants/               # 테넌트 관리 모듈
│       │   ├── tenants.controller.ts
│       │   ├── tenants.service.ts
│       │   ├── tenants.module.ts
│       │   ├── dto/               # 테넌트 관련 DTO
│       │   └── entities/          # Tenant, TenantStatus 엔티티
│       │
│       ├── super/                 # 슈퍼 관리자 모듈
│       │   ├── super.controller.ts
│       │   ├── super.service.ts
│       │   ├── super.module.ts
│       │   └── dto/               # 대시보드 통계 DTO
│       │
│       ├── health/                # 헬스체크 모듈
│       │   ├── health.controller.ts
│       │   ├── health.service.ts
│       │   └── health.module.ts
│       │
│       ├── websites/              # 웹사이트 관리 모듈
│       │   ├── websites.controller.ts
│       │   ├── websites.service.ts
│       │   ├── websites.module.ts
│       │   ├── dto/               # 웹사이트 관련 DTO
│       │   └── entities/          # Website 엔티티
│       │
│       ├── security/              # 보안(차단) 관리 모듈
│       │   ├── block-ip.controller.ts
│       │   ├── block-ip.service.ts
│       │   ├── block-hp.controller.ts
│       │   ├── block-hp.service.ts
│       │   ├── block-word.controller.ts
│       │   ├── block-word.service.ts
│       │   ├── security.module.ts
│       │   ├── dto/               # 차단 관련 DTO
│       │   └── entities/          # BlockIp, BlockHp, BlockWord 엔티티
│       │
│       ├── boards/                # 게시판/게시글 관리
│       │   └── entities/
│       ├── codes/                 # 공통 코드 (엔티티만 정의)
│       │   └── entities/
│       └── counsel/               # 상담 관리 모듈
│           ├── counsel.controller.ts
│           ├── counsel-fields.controller.ts
│           ├── counsel.module.ts
│           ├── dto/               # 상담 관련 DTO
│           ├── entities/          # Counsel, CounselFieldDef, CounselFieldValue, CounselLog, CounselMemoLog
│           └── services/          # CounselService, CounselStatusService, CounselMemoService, CounselFieldService
│
├── test/                          # E2E 테스트
├── .env.development               # 개발 환경 변수
├── .env.production                # 운영 환경 변수 (git 제외)
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 모듈별 역할

| 모듈 | 역할 | 주요 기능 | 상태 |
|------|------|----------|------|
| `auth` | 인증 | 회원가입, 로그인, 토큰 발급/갱신/폐기, 비밀번호 변경, 프로필 수정 | ✅ 완료 |
| `users` | 사용자 관리 | 사용자 CRUD, 페이지네이션, 상태 관리, 비밀번호 관리, 역할 증분 수정 | ✅ 완료 |
| `roles` | 역할 관리 | 역할 CRUD, 권한 할당, 사용자 할당 | ✅ 완료 |
| `rbac` | RBAC 권한 관리 | 페이지/액션/권한 CRUD (페이지네이션, 검색, 필터, 정렬), 권한 카탈로그 조회 | ✅ 완료 |
| `tenants` | 테넌트 관리 | 테넌트 CRUD, 상태 변경, 커스텀 상태(TenantStatus) 관리 (슈퍼 관리자 전용) | ✅ 완료 |
| `super` | 슈퍼 관리자 | 시스템 대시보드 통계 조회 | ✅ 완료 |
| `health` | 헬스체크 | 서버 상태, DB 연결 상태 확인 | ✅ 완료 |
| `websites` | 웹사이트 관리 | 상담 유입 웹사이트 CRUD, 상태 관리 | ✅ 완료 |
| `security` | 보안(차단) 관리 | IP/휴대폰/금칙어 차단 CRUD, 대량 등록, 차단 여부 확인 | ✅ 완료 |
| `counsel` | 상담 관리 | 상담 CRUD, 상태 변경, 메모 관리, 동적 필드, 중복 감지(Advisory Lock), 보안 차단 연동 | ✅ 완료 |

### 엔티티 위치 구조

| 모듈 | 엔티티 | 설명 |
|------|--------|------|
| `users/entities/` | User | 사용자 정보 |
| `roles/entities/` | Role, UserRole, RolePermission | 역할 및 매핑 정보 |
| `rbac/entities/` | Page, Action, Permission | RBAC 권한 카탈로그 |
| `tenants/entities/` | Tenant, TenantStatus | 테넌트 정보 및 커스텀 상태 |
| `auth/entities/` | RefreshToken | 리프레시 토큰 정보 |
| `websites/entities/` | Website | 웹사이트 정보 |
| `security/entities/` | BlockIp, BlockHp, BlockWord | 보안 차단 정보 |
| `counsel/entities/` | Counsel, CounselFieldDef, CounselFieldValue, CounselLog, CounselMemoLog | 상담 및 동적 필드 정보 |

### common 모듈 상세

| 디렉터리 | 역할 | 주요 파일 |
|----------|------|----------|
| `decorators/` | 커스텀 데코레이터 | `@RequireAuth` (JWT+권한 복합), `@RequirePermission` |
| `exceptions/` | 커스텀 예외 | `AuthenticationException`, `AuthorizationException`, `ValidationException`, `ResourceNotFoundException`, `BusinessConflictException` |
| `filters/` | 예외 처리 | `GlobalExceptionFilter` (모든 에러 표준화, 내부/외부 메시지 분리) |
| `guards/` | 접근 제어 | `PermissionGuard` (RBAC 검증) |
| `utils/` | 유틸리티 | `PermissionUtil` (권한 키 생성), `TransactionUtil` (트랜잭션 관리) |
| `dto/` | 공통 DTO | `StandardErrorResponseDto` (에러 응답 형식) |

---

## 5. 인증(Authentication) 흐름

### 전체 흐름

```
1. 로그인 요청
   +---> 회사명 + 아이디 + 비밀번호 제출

2. 자격 증명 검증
   +---> 테넌트 조회 -> 사용자 조회 -> 비밀번호 검증

3. 토큰 발급
   +---> 액세스 토큰 + 리프레시 토큰 발급

4. API 요청 인증
   +---> Authorization 헤더에 액세스 토큰 포함

5. 토큰 검증
   +---> JwtStrategy에서 토큰 검증 -> 사용자 정보 + 권한 로드
```

### 토큰에 포함되는 정보

**액세스 토큰 (JWT Payload)**

| 필드 | 의미 |
|------|------|
| `sub` | 사용자 고유 식별자 (userSeq) |
| `tenantName` | 테넌트명 |
| `userId` | 사용자 아이디 |
| `tokenVersion` | 토큰 버전 (강제 무효화용 — DB의 tokenVersion과 비교하여 불일치 시 거부) |
| `iat` | 발급 시간 |
| `exp` | 만료 시간 |

**request.user에 주입되는 정보**

토큰 검증 후 `JwtStrategy`에서 다음 정보를 `request.user`에 주입한다:

- `userSeq`, `userId`, `userName`
- `tenantId`, `tenantName`
- `permissions` (역할 기반 권한 맵)
- `tokenVersion`

### 인증 실패 처리

모든 인증 실패는 **동일한 에러 메시지**로 응답한다.

```json
{
  "error": {
    "code": "AUTH001",
    "message": "Authentication required",
    "statusCode": 401
  }
}
```

상세 원인(토큰 만료, 사용자 없음, 비밀번호 틀림 등)은 **서버 로그에만 기록**한다.

### Rate Limiting (요청 횟수 제한)

브루트포스 공격 및 자동화 봇 차단을 위해 인증 API에 요청 횟수 제한을 적용한다.

| API 엔드포인트 | 제한 | 사유 |
|---------------|------|------|
| `/auth/login` | 5회/60초 | 비밀번호 추측 공격 방어 |
| `/auth/refresh` | 10회/60초 | 토큰 갱신 남용 방지 |
| `/auth/signup` | 3회/60초 | 자동 가입 스크립트 차단 |
| 기타 모든 API | 60회/60초 | 일반적인 DDoS 완화 |

**제한 초과 시 응답 (429 Too Many Requests)**

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**구현 방식**

- `@nestjs/throttler` 패키지 사용
- IP 주소 기반 요청 횟수 추적
- ThrottlerGuard를 전역 가드로 등록
- 민감한 API는 `@Throttle()` 데코레이터로 개별 설정

### 상세 정책

인증 정책의 상세 내용은 [docs/auth.md](../docs/auth.md) 참고

---

## 6. 권한(Authorization) 및 스코프 정책

### 권한 모델

역할 기반 접근 제어(RBAC)를 사용한다.

```
사용자 ---> 역할(Role) ---> 권한(Permission)
                               |
                               +--- 페이지(Page)
                               +--- 동작(Action)
```

### 엔티티 관계 구조

#### 테넌트-사용자-역할 관계

```
+-------------+       +-------------+       +-------------+
|   Tenant    |       |    User     |       |    Role     |
+-------------+       +-------------+       +-------------+
| tenant_id   |<------| tenant_id   |       | role_id     |
| tenant_name |       | user_seq    |       | role_name   |
| display_name|       | user_id     |       | tenant_id   |----+
| is_active   |       | user_name   |       | is_active   |    |
+-------------+       +-------------+       +-------------+    |
       ^                    |                     ^            |
       |                    |                     |            |
       |                    v                     |            |
       |              +-------------+             |            |
       +--------------| user_roles  |-------------+            |
                      +-------------+                          |
                      | user_seq    | (PK)                     |
                      | tenant_id   | (PK) <-------------------+
                      | role_id     | (PK)
                      +-------------+
```

#### 권한 구조 (전역 카탈로그) - rbac/entities/

```
+-------------+       +---------------+       +-------------+
|    Page     |       |  Permission   |       |   Action    |
+-------------+       +---------------+       +-------------+
| page_id     |<------| page_id       |------>| action_id   |
| page_name   |       | action_id     |       | action_name |
| path        |       | permission_id |       | display_name|
| parent_id   |       | display_name  |       +-------------+
+-------------+       +---------------+
                             ^
                             |
                      +---------------+
                      |role_permissions| (roles/entities/)
                      +---------------+
                      | role_id       | (PK)
                      | permission_id | (PK)
                      +---------------+
```

#### 엔티티 파일 위치

| 엔티티 | 파일 위치 |
|--------|----------|
| User | `modules/users/entities/user.entity.ts` |
| Tenant, TenantStatus | `modules/tenants/entities/` |
| Role | `modules/roles/entities/role.entity.ts` |
| UserRole | `modules/roles/entities/user-role.entity.ts` |
| RolePermission | `modules/roles/entities/role-permission.entity.ts` |
| Page | `modules/rbac/entities/page.entity.ts` |
| Action | `modules/rbac/entities/action.entity.ts` |
| Permission | `modules/rbac/entities/permission.entity.ts` |
| RefreshToken | `modules/auth/entities/refresh-token.entity.ts` |

### 테넌트 격리 설계

| 엔티티 | 테넌트 격리 | 파일 위치 | 설명 |
|--------|------------|----------|------|
| `Tenant` | - | `tenants/entities/` | 최상위 격리 단위 (회사) |
| `User` | ✅ `tenant_id` | `users/entities/` | 사용자는 반드시 하나의 테넌트에 소속 |
| `Role` | ✅ `tenant_id` | `roles/entities/` | 역할은 테넌트별로 독립 관리 |
| `UserRole` | ✅ `tenant_id` (복합 PK) | `roles/entities/` | 사용자-역할 매핑도 테넌트로 격리 |
| `RolePermission` | 간접 격리 | `roles/entities/` | Role이 테넌트 소속이므로 간접 격리됨 |
| `Page` | ❌ 전역 | `rbac/entities/` | 페이지 카탈로그는 시스템 공통 |
| `Action` | ❌ 전역 | `rbac/entities/` | 동작 카탈로그는 시스템 공통 |
| `Permission` | ❌ 전역 | `rbac/entities/` | 페이지+동작 조합, 시스템 공통 |
| `RefreshToken` | ✅ `user_seq` | `auth/entities/` | 사용자별 토큰 관리 |

### 격리 방식의 의미

**테넌트 종속 엔티티 (`User`, `Role`, `UserRole`)**
- 테넌트 A의 역할은 테넌트 B에서 볼 수 없음
- 테넌트 A의 사용자에게 테넌트 B의 역할을 부여할 수 없음
- 같은 이름의 역할이 각 테넌트에 독립적으로 존재 가능

**전역 카탈로그 (`Page`, `Action`, `Permission`)**
- 시스템 관리자가 중앙에서 관리
- 모든 테넌트가 동일한 페이지/동작 카탈로그 공유
- 권한 카탈로그 변경 시 전체 테넌트에 일괄 적용

### 권한 키 형식

```
{pageName}.{actionName}
```

예시:
- `users.read` - 사용자 목록 조회
- `users.create` - 사용자 생성
- `roles.delete` - 역할 삭제

### 권한 검증 시점

권한 검증은 **PermissionGuard**에서 수행된다.

```
요청 ---> JwtAuthGuard (인증) ---> PermissionGuard (권한) ---> Controller
```

### 테넌트 스코프 검증

모든 데이터 접근에서 테넌트 스코프가 검증된다.

| 작업 | 검증 방식 |
|------|----------|
| 조회 | 쿼리에 `tenantId` 조건 자동 추가 |
| 생성 | `request.user.tenantId`를 신규 레코드에 할당 |
| 수정/삭제 | 대상 리소스의 `tenantId`와 요청자의 `tenantId` 일치 확인 |

불일치 시 403 Forbidden 반환:

```json
{
  "error": {
    "code": "AUTH101",
    "message": "Forbidden",
    "statusCode": 403
  }
}
```

---

## 7. 요청 처리 흐름 (Request Lifecycle)

### 전체 흐름

```
+-------------------------------------------------------------------+
|                          요청 수신                                  |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  RequestIdMiddleware (전역)                                        |
|  - 모든 요청에 고유 UUID 생성 또는 클라이언트 ID 재사용              |
|  - request.requestId에 저장                                        |
|  - 응답 헤더 X-Request-ID로 반환                                    |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  ThrottlerGuard (전역)                                              |
|  - IP별 요청 횟수 확인                                              |
|  - 제한 초과 시 429 반환                                            |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  GlobalExceptionFilter                                             |
|  (모든 예외 포착, 표준 에러 응답 변환, requestId 포함)                 |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  JwtAuthGuard                                                      |
|  - 토큰 존재 확인                                                   |
|  - 토큰 유효성 검증                                                 |
|  - JwtStrategy 실행 -> request.user 주입                           |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  PermissionGuard                                                   |
|  - @RequirePermission 메타데이터 확인                               |
|  - request.user.permissions에서 권한 검증                           |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  Controller                                                        |
|  - 요청 파라미터 검증                                               |
|  - Service 호출                                                    |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  Service                                                           |
|  - 비즈니스 로직 수행                                               |
|  - 테넌트 스코프 적용                                               |
|  - Repository 호출                                                 |
+-------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------+
|  Repository / TypeORM                                              |
|  - 데이터베이스 쿼리 실행                                            |
+-------------------------------------------------------------------+
```

### 가드 적용 순서

데코레이터 `@RequireAuth('page.action')` 사용 시:

1. **JwtAuthGuard** - 토큰 검증, 사용자 정보 로드
2. **PermissionGuard** - 권한 검증

두 가드를 모두 통과해야 컨트롤러 메서드가 실행된다.

---

## 8. 환경 변수 및 설정 관리

### 필수 환경 변수

| 변수명 | 필수 | 용도 | 예시 |
|--------|------|------|------|
| `NODE_ENV` | ✅ | 실행 환경 | `development`, `production` |
| `PORT` | - | 서버 포트 | `3000` |
| `DB_HOST` | ✅ | 데이터베이스 호스트 | `localhost` |
| `DB_PORT` | ✅ | 데이터베이스 포트 | `3306` |
| `DB_USERNAME` | ✅ | 데이터베이스 사용자 | `root` |
| `DB_PASSWORD` | ✅ | 데이터베이스 비밀번호 | (비공개) |
| `DB_DATABASE` | ✅ | 데이터베이스명 | `flowdesk_admin_dev` |
| `JWT_SECRET` | ✅ | JWT 서명 비밀키 | (32자 이상 랜덤 문자열) |
| `JWT_EXPIRES_IN` | - | 액세스 토큰 만료 시간 | `3600s` |
| `REFRESH_EXPIRES_DAYS` | - | 리프레시 토큰 만료 일수 | `7` |

### 환경별 설정 파일

| 파일 | 용도 |
|------|------|
| `.env.development` | 로컬 개발 환경 |
| `.env.production` | 운영 환경 (Git 제외) |
| `.env.example` | 환경 변수 템플릿 (Git 포함) |

### 보안 주의사항

| 변수 | 주의 사항 |
|------|----------|
| `JWT_SECRET` | 절대 Git에 커밋하지 않음. 운영 환경에서는 환경 변수로 주입 |
| `DB_PASSWORD` | 개발/운영 환경에서 다른 값 사용. 운영 비밀번호는 비밀 관리 도구 사용 |

---

## 9. 로컬 개발 및 실행 방법

### 요구 사항

| 항목 | 버전 |
|------|------|
| Node.js | 18.x 이상 |
| npm | 9.x 이상 |
| MySQL | 8.x |

### 설치 및 실행

```bash
# 1. 의존성 설치
cd backend
npm install

# 2. 환경 변수 설정
cp .env.example .env.development
# .env.development 파일 수정

# 3. 데이터베이스 마이그레이션
npm run migration:run

# 4. 개발 서버 실행
npm run start:dev
```

### 실행 확인 포인트

| 확인 항목 | 방법 |
|----------|------|
| 서버 실행 | `http://localhost:3000` 접속 |
| 헬스체크 | `GET /health` → `{ "status": "ok" }` |
| DB 연결 | 헬스체크 응답에서 `database` 상태 확인 |
| Swagger | `http://localhost:3000/api` 접속 |

### 스크립트 목록

| 스크립트 | 용도 |
|----------|------|
| `npm run start:dev` | 개발 모드 실행 (watch) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start:prod` | 프로덕션 실행 |
| `npm run migration:run` | 마이그레이션 실행 |
| `npm run migration:generate` | 마이그레이션 생성 |
| `npm run lint` | ESLint 검사 및 수정 |
| `npm run test` | 단위 테스트 |
| `npm run test:e2e` | E2E 테스트 |

---

## 10. 개발 시 주의사항 및 규칙

### 필수 규칙

#### 1. 테넌트 스코프 누락 금지

**모든 데이터 접근 쿼리에 `tenantId` 조건을 포함해야 한다.**

```
❌ 잘못된 예: findAll() 에서 tenantId 없이 전체 조회
✅ 올바른 예: findAll(tenantId) 에서 where 조건에 tenantId 포함
```

위반 시 문제:
- 다른 회사 데이터 노출 (보안 사고)
- 멀티테넌트 격리 원칙 붕괴

#### 2. 인증 가드 누락 금지

**보호가 필요한 모든 엔드포인트에 `@RequireAuth` 또는 `@UseGuards(JwtAuthGuard)`를 적용해야 한다.**

```
❌ 잘못된 예: 권한 검증 없이 데이터 수정 API 노출
✅ 올바른 예: @RequireAuth('users', 'update') 데코레이터 적용
```

위반 시 문제:
- 미인증 사용자 접근 가능
- 권한 없는 사용자 데이터 조작 가능

#### 3. 에러 응답 표준화

**모든 에러는 커스텀 예외 클래스를 사용해야 한다.**

| 상황 | 사용할 예외 |
|------|-----------|
| 인증 실패 | `AuthenticationException` |
| 권한 부족 | `AuthorizationException` |
| 입력 검증 실패 | `ValidationException` |
| 리소스 없음 | `ResourceNotFoundException` |
| 비즈니스 충돌 | `BusinessConflictException` |

#### 4. 민감 정보 로그 주의

**비밀번호, 토큰 원문, 개인정보는 로그에 기록하지 않는다.**

```
❌ 잘못된 예: logger.log({ password: dto.password })
✅ 올바른 예: logger.log({ userId: dto.userId })
```

### 에러 코드 체계

| 에러 코드 | HTTP 상태 | 의미 | 예시 상황 |
|---------|---------|------|----------|
| `AUTH001` | 401 | 인증 실패 | 토큰 없음/만료/위조, 비밀번호 불일치 |
| `AUTH101` | 403 | 권한 없음 | 필요한 권한 미보유, 다른 테넌트 접근 |
| `VAL001` | 400 | 입력 검증 실패 | 필수값 누락, 형식 오류 |
| `RES001` | 404 | 리소스 없음 | 사용자/역할/테넌트 없음 |
| `BIZ001` | 409 | 비즈니스 충돌 | 중복 ID, 이미 존재하는 데이터 |
| `BIZ002` | 409 | 삭제 제약 | 사용 중인 역할/권한 삭제 시도 |
| `RATE_LIMIT` | 429 | 요청 횟수 초과 | Rate Limit 제한 초과 |
| `SYS001` | 500 | 시스템 오류 | DB 연결 실패, 예상치 못한 오류 |

### 에러 응답 형식

모든 에러 응답은 다음 형식을 따른다:

```json
{
  "error": {
    "code": "AUTH001",
    "message": "Authentication required",
    "statusCode": 401
  },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-01T12:34:56.789Z",
    "path": "/api/users"
  }
}
```

**meta.requestId**: 요청 추적을 위한 고유 식별자. 서버 로그와 연결하여 에러 디버깅에 사용한다.

---

## 11. 문서 연결

### 관련 문서 목록

| 문서 | 경로 | 참고 시점 |
|------|------|----------|
| 온보딩 가이드 | [docs/onboarding.md](../docs/onboarding.md) | 서비스 최초 사용 흐름 이해 시 |
| 사용자 플로우 | [docs/user-flow.md](../docs/user-flow.md) | 회원가입/로그인/팀원 추가 상세 흐름 확인 시 |
| 인증/권한 정책 | [docs/auth.md](../docs/auth.md) | 인증/인가 정책 상세 확인 시 |
| 엔티티 구조 | [docs/entities-structure.md](../docs/entities-structure.md) | 엔티티 설계 및 관계 구조 확인 시 |

### 문서 참고 가이드

| 상황 | 참고 문서 |
|------|----------|
| 처음 프로젝트에 합류 | onboarding.md → 이 README |
| 인증 로직 수정 필요 | auth.md → JWT Strategy 코드 |
| 새 API 추가 | 이 README의 요청 처리 흐름 → 기존 컨트롤러 참고 |
| 권한 체계 수정 | auth.md → PermissionGuard 코드 |
| 에러 처리 방식 확인 | 이 README의 에러 코드 체계 → GlobalExceptionFilter 코드 |

---

## 부록: 빠른 참조

### API 문서 (Swagger UI)

| 환경 | URL | 비고 |
|------|-----|------|
| 로컬 개발 | http://localhost:3000/api | 개발 환경에서만 활성화 |
| 개발 서버 | https://flowdesk-admin-production.up.railway.app/api | Railway 배포 환경 |

> **참고**: 프로덕션 환경(`NODE_ENV=production`)에서는 Swagger가 비활성화될 수 있습니다.

### 주요 경로

#### Auth (인증)
| 경로 | 메서드 | 용도 | 인증 | 비고 |
|------|--------|------|------|------|
| `/auth/signup` | POST | 회원가입 (테넌트 + 관리자 생성) | - | - |
| `/auth/login` | POST | 로그인 | - | - |
| `/auth/refresh` | POST | 토큰 갱신 | - | - |
| `/auth/logout` | POST | 로그아웃 (리프레시 토큰 폐기) | ✅ | - |
| `/auth/logout-all` | POST | 모든 기기에서 로그아웃 | ✅ | - |
| `/auth/me` | GET | 현재 사용자 정보 및 권한 조회 | ✅ | menuTree 포함 |
| `/auth/change-password` | POST | 비밀번호 변경 (본인) | ✅ | - |
| `/auth/me/profile` | PATCH | 내 프로필 수정 (corpName, userName, userEmail, userTel, userHp) | ✅ | - |

#### Users (사용자 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/users` | GET | 사용자 목록 조회 (페이지네이션) | users.read |
| `/users/:userSeq` | GET | 사용자 상세 조회 | users.read |
| `/users` | POST | 사용자 생성 | users.create |
| `/users/:userSeq` | PATCH | 사용자 정보 수정 | users.update |
| `/users/:userSeq/status` | PATCH | 사용자 상태 변경 | users.update |
| `/users/:userSeq/password` | PATCH | 사용자 비밀번호 변경 (관리자) | users.update |
| `/users/:userSeq/invalidate-tokens` | POST | 토큰 무효화 (강제 로그아웃) | users.update |
| `/users/:userSeq/roles` | PATCH | 역할 증분 수정 (add/remove) | users.update |

#### Roles (역할 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/roles` | GET | 역할 목록 조회 | roles.read |
| `/roles/:id` | GET | 역할 상세 조회 (권한 + 사용자 포함) | roles.read |
| `/roles` | POST | 역할 생성 | roles.create |
| `/roles/:id` | PATCH | 역할 수정 | roles.update |
| `/roles/:id/status` | PATCH | 역할 상태 변경 | roles.update |
| `/roles/:id` | DELETE | 역할 삭제 | roles.delete |
| `/roles/:id/permissions` | PUT | 다른 역할의 권한 복사 (전체 교체) | roles.update |
| `/roles/:id/permissions` | PATCH | 역할 권한 증분 수정 (add/remove) | roles.update |

#### Permissions (권한 카탈로그)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/permissions/catalog` | GET | 권한 카탈로그 조회 (매트릭스용) | permissions.read |

#### Permissions Admin (페이지/액션/권한 관리 - 슈퍼 관리자 전용)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/permissions/admin/pages` | GET | 페이지 목록 (page, limit, q, parentId, isActive, sort, order) | super.pages.read |
| `/permissions/admin/pages/:id` | GET | 페이지 상세 (하위 페이지 포함) | super.pages.read |
| `/permissions/admin/pages` | POST | 페이지 생성 | super.pages.create |
| `/permissions/admin/pages/:id` | PATCH | 페이지 수정 | super.pages.update |
| `/permissions/admin/pages/:id/status` | PATCH | 페이지 상태 변경 | super.pages.update |
| `/permissions/admin/pages/:id` | DELETE | 페이지 삭제 | super.pages.delete |
| `/permissions/admin/actions` | GET | 액션 목록 (page, limit, q, isActive, sort, order) | super.actions.read |
| `/permissions/admin/actions/:id` | GET | 액션 상세 조회 | super.actions.read |
| `/permissions/admin/actions` | POST | 액션 생성 | super.actions.create |
| `/permissions/admin/actions/:id` | PATCH | 액션 수정 | super.actions.update |
| `/permissions/admin/actions/:id/status` | PATCH | 액션 상태 변경 | super.actions.update |
| `/permissions/admin/actions/:id` | DELETE | 액션 삭제 | super.actions.delete |
| `/permissions/admin/permissions` | GET | 권한 목록 (page, limit, q, pageId, actionId, isActive, sort, order) | super.permissions.read |
| `/permissions/admin/permissions/:id` | GET | 권한 상세 조회 | super.permissions.read |
| `/permissions/admin/permissions` | POST | 권한 생성 | super.permissions.create |
| `/permissions/admin/permissions/:id` | PATCH | 권한 수정 | super.permissions.update |
| `/permissions/admin/permissions/:id/status` | PATCH | 권한 상태 변경 | super.permissions.update |
| `/permissions/admin/permissions/:id` | DELETE | 권한 삭제 | super.permissions.delete |

> **Permissions Admin 목록 API 쿼리 파라미터 참고:**
> - Pages: `q`(pageName/displayName/description Like), `parentId`(all/null/숫자), `isActive`(0/1), `sort`(sortOrder → 계층정렬, pageId, pageName, displayName, isActive, childCount, permissionCount)
> - Actions: `q`(actionName/displayName Like), `isActive`(0/1), `sort`(actionId, actionName, displayName, isActive, permissionCount)
> - Permissions: `q`(displayName/description/pageName/actionName Like), `pageId`, `actionId`, `isActive`(0/1), `sort`(permissionId, pageId, actionId, displayName, isActive)

#### Tenants (테넌트 관리 - 슈퍼 관리자 전용)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/tenants` | GET | 테넌트 목록 조회 | super.tenants.read |
| `/tenants/:id` | GET | 테넌트 상세 조회 | super.tenants.read |
| `/tenants` | POST | 테넌트 생성 | super.tenants.create |
| `/tenants/:id` | PATCH | 테넌트 수정 | super.tenants.update |
| `/tenants/:id/status` | PATCH | 테넌트 상태 변경 | super.tenants.update |
| `/tenants/:id` | DELETE | 테넌트 삭제 | super.tenants.delete |

#### Tenant Status (테넌트 커스텀 상태 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/tenants/:tenantId/statuses` | GET | 상태 목록 (statusGroup 그룹핑, q, isActive) | super.tenants.read |
| `/tenants/:tenantId/statuses/:id` | GET | 상태 상세 | super.tenants.read |
| `/tenants/:tenantId/statuses` | POST | 상태 생성 | super.tenants.create |
| `/tenants/:tenantId/statuses/:id` | PATCH | 상태 수정 | super.tenants.update |
| `/tenants/:tenantId/statuses/:id/status` | PATCH | 활성 여부 변경 | super.tenants.update |
| `/tenants/:tenantId/statuses/:id` | DELETE | 상태 삭제 | super.tenants.delete |

#### Websites (웹사이트 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/websites` | GET | 웹사이트 목록 (page, limit, q, isActive, sort, order) | websites.read |
| `/websites/:webCode` | GET | 웹사이트 상세 | websites.read |
| `/websites` | POST | 웹사이트 생성 | websites.create |
| `/websites/:webCode` | PATCH | 웹사이트 수정 | websites.update |
| `/websites/:webCode/status` | PATCH | 웹사이트 상태 변경 | websites.update |
| `/websites/:webCode` | DELETE | 웹사이트 삭제 | websites.delete |

#### Boards (게시판/게시글 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/boards` | POST | 게시판 생성 | board_types.create |
| `/boards` | GET | 게시판 목록 | board_types.read |
| `/boards/:boardId` | GET | 게시판 상세 | board_types.read |
| `/boards/:boardId` | PATCH | 게시판 수정 | board_types.update |
| `/boards/:boardId` | DELETE | 게시판 비활성화 | board_types.delete |
| `/boards/:boardId/posts` | POST | 게시글 생성 | boards.posts.create |
| `/boards/:boardId/posts` | GET | 게시글 목록 | boards.posts.read |
| `/boards/:boardId/posts/:postId` | GET | 게시글 상세 | boards.posts.read |
| `/boards/:boardId/posts/:postId` | PATCH | 게시글 수정 | boards.posts.update |
| `/boards/:boardId/posts/:postId` | DELETE | 게시글 소프트 삭제 | boards.posts.delete |

#### Counsels (상담 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/counsels` | POST | 상담 신청 (랜딩 페이지 Public API) | **인증 불필요** |
| `/counsels` | GET | 상담 목록 조회 (page, limit, q, counselStat, empSeq, webCode, duplicateState, startDate, endDate, resvStartDate, resvEndDate) | counsels.read |
| `/counsels/:id` | GET | 상담 상세 조회 (fieldValues, logs, memos 포함) | counsels.read |
| `/counsels/:id` | PATCH | 상담 수정 (기본필드 + fieldValues 전체 교체) | counsels.update |
| `/counsels/:id` | DELETE | 상담 삭제 (소프트 삭제, delete_state='Y') | counsels.delete |
| `/counsels/:id/status` | PATCH | 상담 상태 변경 (SCHEDULED 시 counselResvDtm 필수) | counsels.update |
| `/counsels/:id/logs` | GET | 상담 상태 변경 이력 조회 | counsels.read |
| `/counsels/:id/memo` | POST | 상담 메모 작성 (현재 상태 스냅샷) | counsels.update |
| `/counsels/:id/memo` | GET | 상담 메모 목록 조회 | counsels.read |

> **POST /counsels (Public API)**: 인증 없이 호출 가능. `webCode`로 테넌트를 식별하며, 클라이언트 IP 자동 감지.  
> 보안 3단계 검증 (휴대폰 차단 → IP 차단 → 금칙어 차단) 후 Advisory Lock 기반 중복 감지 수행.  
> 상태 자동 할당: 중복이면 `DUPLICATE`, 아니면 `NEW` (statusKey 기반).

#### Counsel Fields (상담 동적 필드)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/counsel-fields` | GET | 활성 필드 정의 목록 조회 (sortOrder ASC, null last) | counsels.read |

#### Security - Block IP (IP 차단 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/security/block-ip` | GET | IP 차단 목록 (page, limit, q, isActive) | security.read |
| `/security/block-ip/:id` | GET | IP 차단 상세 | security.read |
| `/security/block-ip` | POST | IP 차단 등록 | security.create |
| `/security/block-ip/bulk` | POST | IP 대량 차단 등록 | security.create |
| `/security/block-ip/:id` | PATCH | IP 차단 수정 | security.update |
| `/security/block-ip/:id` | DELETE | IP 차단 삭제 | security.delete |
| `/security/block-ip/check` | GET | IP 차단 여부 확인 (query: ip) | security.read |

#### Security - Block HP (휴대폰 차단 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/security/block-hp` | GET | 휴대폰 차단 목록 (page, limit, q, isActive) | security.read |
| `/security/block-hp/:id` | GET | 휴대폰 차단 상세 | security.read |
| `/security/block-hp` | POST | 휴대폰 차단 등록 | security.create |
| `/security/block-hp/bulk` | POST | 휴대폰 대량 차단 등록 | security.create |
| `/security/block-hp/:id` | PATCH | 휴대폰 차단 수정 | security.update |
| `/security/block-hp/:id` | DELETE | 휴대폰 차단 삭제 | security.delete |
| `/security/block-hp/check` | GET | 휴대폰 차단 여부 확인 (query: hp) | security.read |

#### Security - Block Word (금칙어 관리)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/security/block-word` | GET | 금칙어 목록 (page, limit, q, isActive, matchType) | security.read |
| `/security/block-word/:id` | GET | 금칙어 상세 | security.read |
| `/security/block-word` | POST | 금칙어 등록 (EXACT/CONTAINS/REGEX) | security.create |
| `/security/block-word/bulk` | POST | 금칙어 대량 등록 | security.create |
| `/security/block-word/:id` | PATCH | 금칙어 수정 | security.update |
| `/security/block-word/:id` | DELETE | 금칙어 삭제 | security.delete |
| `/security/block-word/check` | GET | 금칙어 포함 여부 확인 (query: text) | security.read |

#### Super Admin (슈퍼 관리자 전용 - 대시보드)
| 경로 | 메서드 | 용도 | 권한 |
|------|--------|------|------|
| `/super/dashboard` | GET | 시스템 통계 조회 | super.dashboard.read |

#### Health (헬스체크)
| 경로 | 메서드 | 용도 | 인증 |
|------|--------|------|------|
| `/health` | GET | 서버 상태 확인 | - |

### 디버깅 팁

| 문제 | 확인 사항 |
|------|----------|
| 401 응답 | 토큰 포함 여부, 토큰 만료 여부 |
| 403 응답 | 권한 설정, 테넌트 일치 여부 |
| 500 응답 | 서버 로그 확인, DB 연결 상태 |
| 에러 추적 | 에러 응답의 `meta.requestId`로 서버 로그 검색 |

### Request ID를 활용한 에러 추적

에러 발생 시 클라이언트는 `meta.requestId`를 확인하고, 이를 서버 관리자에게 전달하면 정확한 로그를 찾을 수 있다:

```bash
# 서버 로그에서 특정 requestId 검색
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log
```
