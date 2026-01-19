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
|   Frontend    |---->|    Backend    |---->|   Database    |
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

JWT 선택 이유:
- 서버 상태 저장 불필요 (Stateless)
- 수평 확장 용이
- 토큰에 필요한 정보(tenantId, userSeq) 포함 가능

### API 문서화

| 기술 | 용도 |
|------|------|
| @nestjs/swagger | OpenAPI 3.0 명세 자동 생성 |
| swagger-ui-express | API 문서 UI 제공 (/api) |

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
│   │   ├── dto/                   # 공통 DTO (에러 응답 등)
│   │   ├── exceptions/            # 커스텀 예외 클래스
│   │   ├── filters/               # 전역 예외 필터
│   │   ├── guards/                # 인증/인가 가드
│   │   └── utils/                 # 유틸리티 함수
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
│       ├── iam/                   # 사용자 관리 모듈
│       ├── permissions/           # 권한 관리 모듈
│       ├── tenants/               # 테넌트 엔티티
│       ├── health/                # 헬스체크
│       ├── boards/                # 게시판 (예정)
│       ├── codes/                 # 공통 코드
│       ├── counsel/               # 상담 (예정)
│       ├── security/              # 보안 로그 (예정)
│       └── websites/              # 웹사이트 관리 (예정)
│
├── test/                          # E2E 테스트
├── .env.development               # 개발 환경 변수
├── .env.production                # 운영 환경 변수 (git 제외)
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 모듈별 역할

| 모듈 | 역할 | 주요 기능 |
|------|------|----------|
| `auth` | 인증 | 회원가입, 로그인, 토큰 발급/갱신/폐기 |
| `iam` | 사용자 관리 | 팀원 CRUD, 비밀번호 변경, 상태 관리 |
| `permissions` | 권한 관리 | 역할/페이지/동작 카탈로그 조회 |
| `tenants` | 테넌트 | 회사 엔티티 정의 (회원가입 시 생성) |
| `health` | 헬스체크 | 서버 상태, DB 연결 상태 확인 |

### common 모듈 상세

| 디렉터리 | 역할 | 주요 파일 |
|----------|------|----------|
| `decorators/` | 커스텀 데코레이터 | `@RequireAuth`, `@RequirePermission` |
| `exceptions/` | 커스텀 예외 | `AuthenticationException`, `AuthorizationException` |
| `filters/` | 예외 처리 | `GlobalExceptionFilter` (모든 에러 표준화) |
| `guards/` | 접근 제어 | `PermissionGuard` (RBAC 검증) |
| `utils/` | 유틸리티 | `PermissionUtil` (권한 키 생성) |

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
| `tokenVersion` | 토큰 버전 (강제 무효화용) |
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

#### 권한 구조 (전역 카탈로그)

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
                      |role_permissions|
                      +---------------+
                      | role_id       | (PK)
                      | permission_id | (PK)
                      +---------------+
```

### 테넌트 격리 설계

| 엔티티 | 테넌트 격리 | 설명 |
|--------|------------|------|
| `Tenant` | - | 최상위 격리 단위 (회사) |
| `User` | ✅ `tenant_id` | 사용자는 반드시 하나의 테넌트에 소속 |
| `Role` | ✅ `tenant_id` | 역할은 테넌트별로 독립 관리 |
| `UserRole` | ✅ `tenant_id` (복합 PK) | 사용자-역할 매핑도 테넌트로 격리 |
| `Page` | ❌ 전역 | 페이지 카탈로그는 시스템 공통 |
| `Action` | ❌ 전역 | 동작 카탈로그는 시스템 공통 |
| `Permission` | ❌ 전역 | 페이지+동작 조합, 시스템 공통 |
| `RolePermission` | 간접 격리 | Role이 테넌트 소속이므로 간접 격리됨 |

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
|  GlobalExceptionFilter                                             |
|  (모든 예외 포착, 표준 에러 응답 변환)                                |
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
✅ 올바른 예: @RequireAuth('users.update') 데코레이터 적용
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

| 에러 코드 | HTTP 상태 | 의미 |
|---------|---------|------|
| `AUTH001` | 401 | 인증 실패 |
| `AUTH101` | 403 | 권한 없음 |
| `VAL001` | 400 | 입력 검증 실패 |
| `RES001` | 404 | 리소스 없음 |
| `BIZ001` | 409 | 비즈니스 충돌 |

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

| 경로 | 용도 |
|------|------|
| `POST /auth/signup` | 회원가입 (테넌트 + 관리자 생성) |
| `POST /auth/login` | 로그인 |
| `GET /auth/me` | 현재 사용자 정보 |
| `GET /users` | 사용자 목록 (테넌트 내) |
| `GET /health` | 헬스체크 |

### 디버깅 팁

| 문제 | 확인 사항 |
|------|----------|
| 401 응답 | 토큰 포함 여부, 토큰 만료 여부 |
| 403 응답 | 권한 설정, 테넌트 일치 여부 |
| 500 응답 | 서버 로그 확인, DB 연결 상태 |
