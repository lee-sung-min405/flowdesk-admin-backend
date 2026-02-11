# 엔티티 구조 설계 문서

이 문서는 시스템의 데이터 모델(엔티티) 구조와 설계 의도를 설명한다.

---

## 목차

1. [엔티티 설계 개요](#1-엔티티-설계-개요)
2. [핵심 엔티티 분류](#2-핵심-엔티티-분류)
3. [테넌트(회사) 중심 구조](#3-테넌트회사-중심-구조)
4. [사용자 관련 엔티티 구조](#4-사용자-관련-엔티티-구조)
5. [인증/권한 관련 엔티티 개념](#5-인증권한-관련-엔티티-개념)
6. [주요 엔티티 간 관계 설명](#6-주요-엔티티-간-관계-설명)
7. [엔티티 스코프 및 제약 조건](#7-엔티티-스코프-및-제약-조건)
8. [엔티티 설계 시 주의사항](#8-엔티티-설계-시-주의사항)
9. [문서 연결](#9-문서-연결)

---

## 1. 엔티티 설계 개요

### 설계 목표

- **멀티테넌트 격리**: 회사(테넌트) 간 데이터가 완전히 분리되어야 한다
- **비즈니스 개념 표현**: 각 엔티티는 명확한 비즈니스 개념 하나를 표현한다
- **확장 가능성**: 새로운 기능 추가 시 기존 구조를 손상하지 않아야 한다
- **일관된 스코프**: 데이터 접근 시 테넌트 범위가 항상 적용되어야 한다

### 엔티티 분리 기준

멀티테넌트 환경에서 엔티티는 다음 기준으로 분리된다:

| 구분 | 설명 | 예시 |
|------|------|------|
| 테넌트 종속 | 특정 회사에만 속하는 데이터 | 사용자, 역할, 게시물 |
| 전역 카탈로그 | 모든 테넌트가 공유하는 기준 데이터 | 페이지, 동작, 권한 정의 |
| 시스템 공통 | 테넌트와 무관한 시스템 운영 데이터 | 공통 코드 |

### 전제 조건

> **엔티티 = 비즈니스 개념**

각 엔티티는 기술적 테이블이 아니라 비즈니스 도메인의 명확한 개념을 표현한다. 엔티티를 추가할 때는 "이것이 어떤 비즈니스 개념인가?"를 먼저 정의해야 한다.

---

## 2. 핵심 엔티티 분류

### 테넌트(회사) 관련 엔티티

**목적**: 멀티테넌트 시스템의 최상위 격리 단위를 정의한다.

| 엔티티 | 책임 |
|--------|------|
| Tenant | 회사(고객사) 정보. 모든 비즈니스 데이터의 소유자 |
| TenantStatus | 테넌트별 커스텀 상태 정의 (상담 상태, 처리 단계 등) |

**설계 이유**: 하나의 시스템에서 여러 회사가 독립적으로 서비스를 사용하므로, 모든 데이터의 소유권 기준이 필요하다.

---

### 사용자 및 계정 관련 엔티티

**목적**: 시스템을 사용하는 사람(계정)을 표현한다.

| 엔티티 | 책임 | 파일 위치 |
|--------|------|----------|
| User | 로그인 가능한 사용자. 인증 정보와 기본 프로필 보유 | `users/entities/user.entity.ts` |
| RefreshToken | 토큰 갱신을 위한 리프레시 토큰 관리 | `auth/entities/refresh-token.entity.ts` |

**설계 이유**: 사용자는 시스템의 모든 활동 주체다. 인증 정보와 비즈니스 활동을 연결하는 핵심 엔티티다.

---

### 인증/권한 관련 엔티티

**목적**: 사용자가 어떤 기능에 접근할 수 있는지 제어한다.

| 엔티티 | 책임 | 파일 위치 |
|--------|------|----------|
| Role | 권한의 묶음. 테넌트별로 독립 관리 | `roles/entities/role.entity.ts` |
| UserRole | 사용자와 역할의 연결 (N:M 관계 해소) | `roles/entities/user-role.entity.ts` |
| RolePermission | 역할과 권한의 연결 (N:M 관계 해소) | `roles/entities/role-permission.entity.ts` |
| Page | 접근 제어 대상이 되는 페이지/기능 정의 | `rbac/entities/page.entity.ts` |
| Action | 수행 가능한 동작 유형 (조회, 생성, 수정, 삭제 등) | `rbac/entities/action.entity.ts` |
| Permission | 페이지 + 동작의 조합. 시스템 전역 카탈로그 | `rbac/entities/permission.entity.ts` |

**설계 이유**: 역할 기반 접근 제어(RBAC)를 구현하기 위해 권한 체계를 구조화했다. 역할은 테넌트별로 다르게 정의할 수 있지만, 권한 카탈로그는 시스템 전체에서 일관되게 유지한다.

**모듈 분리 원칙**:
- `roles/`: 테넌트 종속 엔티티 (Role, UserRole, RolePermission)
- `rbac/`: 전역 카탈로그 엔티티 (Page, Action, Permission)

---

### 비즈니스 도메인 엔티티

**목적**: 실제 비즈니스 활동(상담, 게시물 등)을 표현한다.

| 엔티티 | 책임 |
|--------|------|
| Counsel | 상담 신청 정보 |
| CounselFieldDef | 상담 입력 필드 정의 (테넌트별 커스터마이징) |
| CounselFieldValue | 상담별 필드 값 저장 |
| CounselLog | 상담 상태 변경 이력 |
| CounselMemoLog | 상담 메모 기록 |
| Board | 게시판 정의 |
| Post | 게시물 |
| Website | 상담 유입 웹사이트 정보 |

---

### 보안/차단 관련 엔티티

**목적**: 악성 접근이나 스팸을 차단한다.

| 엔티티 | 책임 | 파일 위치 | API 구현 상태 |
|--------|------|----------|--------------|
| BlockHp | 차단된 휴대전화 번호 | `security/entities/block-hp.entity.ts` | ✅ 완료 |
| BlockIp | 차단된 IP 주소 (IPv4/IPv6 지원) | `security/entities/block-ip.entity.ts` | ✅ 완료 |
| BlockWord | 차단된 키워드 (EXACT/CONTAINS/REGEX 매칭) | `security/entities/block-word.entity.ts` | ✅ 완료 |

**Security 모듈 API 기능**:
- CRUD (목록 조회, 상세 조회, 등록, 수정, 삭제)
- 대량 등록 (POST /bulk) - 줄바꿈/쉼표로 구분된 여러 항목 일괄 등록
- 차단 여부 확인 (GET /check) - 특정 IP/휴대폰/텍스트가 차단되었는지 조회

---

### 웹사이트 관련 엔티티

**목적**: 상담 유입 웹사이트를 관리한다.

| 엔티티 | 책임 | 파일 위치 | API 구현 상태 |
|--------|------|----------|--------------|
| Website | 상담 유입 웹사이트 정보 관리 | `websites/entities/website.entity.ts` | ✅ 완료 |

**Website 모듈 API 기능**:
- CRUD (목록 조회, 상세 조회, 생성, 수정, 삭제)
- 상태 변경 (PATCH /:webCode/status) - 활성/비활성 상태 변경

---

### 공통/보조 엔티티

**목적**: 시스템 전반에서 사용하는 기준 데이터를 관리한다.

| 엔티티 | 책임 |
|--------|------|
| CodeGroup | 공통 코드 그룹 정의 |
| Code | 공통 코드 값 |

---

## 3. 테넌트(회사) 중심 구조

### 핵심 원칙

> **모든 비즈니스 데이터는 특정 테넌트에 종속된다.**

테넌트는 시스템의 최상위 격리 단위다. 하나의 테넌트 내에서 생성된 모든 데이터는 해당 테넌트에만 귀속된다.

### 테넌트 격리 방식

```
Tenant (회사)
    |
    +--- User (사용자)
    |       |
    |       +--- UserRole (역할 할당)
    |
    +--- Role (역할 정의)
    |       |
    |       +--- RolePermission (권한 할당)
    |
    +--- Counsel, Board, Post, Website, ...
```

### 데이터 격리 보장 방법

1. **물리적 구분**: 대부분의 테이블에 `tenant_id` 컬럼 존재
2. **쿼리 필터링**: 모든 데이터 접근 시 `tenant_id` 조건 적용
3. **비즈니스 규칙**: 다른 테넌트의 데이터에 접근 시도 시 시스템에서 차단

### 테넌트 간 데이터가 섞일 수 없는 이유

- 사용자는 정확히 하나의 테넌트에만 소속
- 사용자가 보유한 역할도 같은 테넌트의 역할만 가능
- 모든 비즈니스 엔티티 조회 시 사용자의 테넌트 ID로 필터링

---

## 4. 사용자 관련 엔티티 구조

### 관리자와 팀원의 차이

| 구분 | 관리자 | 팀원 |
|------|--------|------|
| 생성 시점 | 회원가입 시 자동 생성 | 관리자가 수동 추가 |
| 권한 범위 | 전체 관리 권한 보유 | 부여된 역할에 따라 제한 |
| 책임 | 회사 설정, 팀원 관리 | 할당된 업무 수행 |

### 소속 구조

**하나의 사용자 = 하나의 회사**

- 사용자는 반드시 하나의 테넌트에 소속된다
- 생성 시점에 테넌트가 지정되며, 이후 변경할 수 없다
- 사용자가 다른 회사에서 활동하려면 별도 계정이 필요하다

### 사용자-테넌트 관계

```
Tenant (1) ────< (N) User
   |
   +--- 테넌트 A
   |       +--- 관리자 1
   |       +--- 팀원 1, 2, 3
   |
   +--- 테넌트 B
           +--- 관리자 2
           +--- 팀원 4, 5
```

### 사용자 관련 제약

- 사용자 ID는 테넌트 내에서 유일해야 함 (다른 테넌트와 중복 가능)
- 비활성화된 사용자도 데이터는 유지됨 (이력 보존)
- 사용자 삭제 시 연관 데이터 처리 정책 필요

---

## 5. 인증/권한 관련 엔티티 개념

### 인증 정보와 사용자 정보

**현재 설계**: 사용자 엔티티에 인증 정보(비밀번호) 포함

| 정보 유형 | 저장 위치 |
|----------|----------|
| 아이디/비밀번호 | User 엔티티 |
| 리프레시 토큰 | RefreshToken 엔티티 (별도) |
| 토큰 버전 | User 엔티티 (tokenVersion) |

### 권한 구조: 역할 기반

```
User ---(N:M)---> Role ---(N:M)---> Permission
                   |                     |
            테넌트 종속              전역 카탈로그
```

**권한은 역할 단위로 부여된다.**

- 사용자에게 직접 권한을 부여하지 않음
- 역할에 권한을 할당하고, 사용자에게 역할을 부여
- 한 사용자가 여러 역할을 가질 수 있음

### 테넌트 종속 vs 전역

| 엔티티 | 스코프 | 파일 위치 | 이유 |
|--------|--------|----------|------|
| Role | 테넌트 종속 | `roles/entities/` | 회사마다 다른 역할 체계 가능 |
| UserRole | 테넌트 종속 | `roles/entities/` | 사용자-역할 매핑도 회사별 |
| RolePermission | 간접 종속 | `roles/entities/` | Role이 테넌트 종속이므로 |
| Page | 전역 | `rbac/entities/` | 시스템 기능은 모든 회사가 동일 |
| Action | 전역 | `rbac/entities/` | 동작 유형(CRUD)은 공통 |
| Permission | 전역 | `rbac/entities/` | 권한 카탈로그는 시스템 공통 |

### 권한의 회사 내 유효 범위

- 역할 "영업팀장"은 테넌트 A에서만 유효
- 테넌트 A의 역할을 테넌트 B 사용자에게 부여할 수 없음
- 같은 이름의 역할이 각 테넌트에 독립적으로 존재 가능

---

## 6. 주요 엔티티 간 관계 설명

### 1:N 관계 (직접 연결)

| 부모 | 자식 | 설명 |
|------|------|------|
| Tenant | User | 회사에 소속된 사용자들 |
| Tenant | Role | 회사에서 정의한 역할들 |
| Tenant | Board | 회사의 게시판들 |
| Tenant | Website | 회사가 관리하는 웹사이트들 |
| Board | Post | 게시판에 속한 게시물들 |
| User | Post | 사용자가 작성한 게시물들 |
| Website | Counsel | 웹사이트를 통해 접수된 상담들 |
| Page | Permission | 페이지에 정의된 권한들 |
| Action | Permission | 동작과 연결된 권한들 |

### N:M 관계 (중간 엔티티 사용)

| 관계 | 중간 엔티티 | 설명 |
|------|------------|------|
| User ↔ Role | UserRole | 사용자에게 역할 할당 |
| Role ↔ Permission | RolePermission | 역할에 권한 부여 |

**중간 엔티티를 사용하는 이유**:
- 관계에 추가 속성(할당 일시 등) 저장 가능
- 테넌트 스코프를 복합 키로 포함 가능
- 관계 변경 이력 관리 용이

### 자기 참조 관계

| 엔티티 | 관계 | 설명 |
|--------|------|------|
| Page | parent → Page | 페이지 계층 구조 (메뉴 트리) |

### 확장 포인트

**상담 필드 동적 확장**:

```
Counsel (1) ────< (N) CounselFieldValue
                         |
CounselFieldDef (1) ─────+
```

- 테넌트별로 다른 상담 입력 필드 정의 가능
- 필드 정의(CounselFieldDef)와 값(CounselFieldValue) 분리
- 새로운 필드 추가 시 스키마 변경 불필요

---

## 7. 엔티티 스코프 및 제약 조건

### 테넌트 종속 엔티티

다음 엔티티는 반드시 `tenant_id`를 포함하며, 테넌트 스코프가 적용된다:

| 그룹 | 엔티티 |
|------|--------|
| 사용자/권한 | User, Role, UserRole |
| 비즈니스 | Counsel, CounselFieldDef, CounselFieldValue, CounselLog, CounselMemoLog |
| 게시판 | Board, Post |
| 웹사이트 | Website |
| 보안 | BlockHp, BlockIp, BlockWord |
| 설정 | TenantStatus |

### 전역 엔티티

다음 엔티티는 테넌트와 무관하게 시스템 전체에서 공유된다:

| 엔티티 | 파일 위치 | 이유 |
|--------|----------|------|
| Page | `rbac/entities/page.entity.ts` | 시스템 기능(메뉴)은 모든 테넌트 공통 |
| Action | `rbac/entities/action.entity.ts` | 동작 유형(CRUD)은 공통 정의 |
| Permission | `rbac/entities/permission.entity.ts` | 페이지+동작 조합 카탈로그 |
| CodeGroup, Code | `codes/entities/` | 공통 코드는 시스템 차원 관리 |

### 삭제/비활성화 시 제약

| 엔티티 | 삭제 정책 | 연관 데이터 처리 |
|--------|----------|-----------------|
| Tenant | 소프트 삭제 | 모든 종속 데이터 접근 차단 |
| User | 비활성화 | 작성 데이터는 유지, 로그인 차단 |
| Role | 비활성화 | 기존 할당은 유지, 신규 할당 차단 |
| Board | 비활성화 | 게시물은 유지, 신규 작성 차단 |

### 참조 무결성 제약

- User 삭제 시 UserRole 연쇄 삭제
- Role 삭제 시 RolePermission, UserRole 연쇄 삭제
- Page 삭제 시 하위 Page의 parent를 NULL로 설정

---

## 8. 엔티티 설계 시 주의사항

### 잘못 설계했을 때 발생하는 문제

| 실수 | 결과 |
|------|------|
| tenant_id 누락 | 다른 회사 데이터 노출 (보안 사고) |
| 전역 엔티티에 tenant_id 추가 | 불필요한 중복, 관리 복잡성 증가 |
| N:M 관계 직접 연결 | 관계 속성 추가 불가, 확장성 저하 |
| 사용자-테넌트 다대다 설계 | 권한 스코프 관리 복잡화 |

### 멀티테넌트 환경에서 흔한 실수

1. **스코프 누락**: 쿼리에서 tenant_id 조건을 빠뜨림
2. **교차 참조**: 테넌트 A의 역할을 테넌트 B 사용자에게 연결 시도
3. **전역 데이터 수정**: 권한 카탈로그를 특정 테넌트용으로 변경
4. **삭제 연쇄 미고려**: 부모 삭제 시 자식 데이터 처리 누락

### 엔티티 추가 시 필수 규칙

| 규칙 | 설명 |
|------|------|
| 스코프 결정 | 테넌트 종속인지 전역인지 먼저 결정 |
| 소유자 명시 | 데이터 소유 주체(User, Tenant 등) 명확화 |
| 관계 설계 | 1:N, N:M 관계와 연쇄 삭제 정책 정의 |
| 인덱스 계획 | tenant_id 포함 복합 인덱스 설계 |
| 감사 컬럼 | 생성/수정 일시, 생성자 컬럼 포함 |

---

## 9. 문서 연결

### 관련 문서

| 문서 | 경로 | 관련 내용 |
|------|------|----------|
| 사용자 플로우 | [user-flow.md](./user-flow.md) | 엔티티가 실제로 생성/수정되는 흐름 |
| 인증/권한 정책 | [auth.md](./auth.md) | 권한 엔티티의 런타임 동작 |
| 백엔드 README | [backend/README.md](../backend/README.md) | 엔티티 구현 및 ORM 설정 |
| 온보딩 가이드 | [onboarding.md](./onboarding.md) | 초기 엔티티 생성 흐름 |

### 역할 분리

| 문서 | 설명 범위 |
|------|----------|
| 이 문서 | 엔티티 **설계 의도**와 **관계 구조** |
| backend/README.md | 엔티티 **구현 방법**과 **개발 규칙** |
| auth.md | 권한 엔티티의 **런타임 정책** |
| user-flow.md | 엔티티 **생성/수정 시나리오** |

---

## 부록 A: 엔티티 관계 개요

```
                                 +------------------+
                                 |      Tenant      |
                                 +------------------+
                                         |
         +---------------+---------------+---------------+---------------+
         |               |               |               |               |
         v               v               v               v               v
     +------+       +------+       +-------+       +-------+       +---------+
     | User |       | Role |       | Board |       |Website|       |TenantSts|
     +------+       +------+       +-------+       +-------+       +---------+
  [users/]       [roles/]                              |
         |               |               |               |
         +-------+-------+               v               v
                 |                   +------+       +---------+
                 v                   | Post |       | Counsel |
            +----------+             +------+       +---------+
            | UserRole |                                 |
            +----------+                    +------------+------------+
            [roles/]                        |            |            |
                                        +-------+    +-------+    +--------+
                 +------+               |RolePrm|    |CnslFld|    |CnslLog |
                 | Role |-------------->+-------+    +-------+    +--------+
                 +------+               [roles/]
                                            |
                                            v
                                     +------------+
                                     | Permission |
                                     +------------+
                                       [rbac/]
                                            |
                              +-------------+-------------+
                              |                           |
                           +------+                   +--------+
                           | Page |                   | Action |
                           +------+                   +--------+
                           [rbac/]                    [rbac/]
```

**범례**:
- 실선: 직접 관계 (FK)
- 화살표 방향: 1(부모) → N(자식)
- 중간 엔티티: N:M 관계 해소용
- `[모듈/]`: 엔티티가 위치한 모듈 폴더

---

## 부록 B: 모듈별 엔티티 상세 명세

### 프로젝트 구조

```
backend/src/modules/
├── auth/
│   └── entities/
│       └── refresh-token.entity.ts
├── users/
│   └── entities/
│       └── user.entity.ts
├── roles/
│   └── entities/
│       ├── role.entity.ts
│       ├── user-role.entity.ts
│       └── role-permission.entity.ts
├── rbac/
│   └── entities/
│       ├── page.entity.ts
│       ├── action.entity.ts
│       └── permission.entity.ts
├── tenants/
│   └── entities/
│       ├── tenant.entity.ts
│       └── tenant-status.entity.ts
├── codes/
│   └── entities/
│       ├── code-group.entity.ts
│       └── code.entity.ts
├── boards/
│   └── entities/
│       ├── board.entity.ts
│       └── post.entity.ts
├── counsel/
│   └── entities/
│       ├── counsel.entity.ts
│       ├── counsel-field-def.entity.ts
│       ├── counsel-field-value.entity.ts
│       ├── counsel-log.entity.ts
│       └── counsel-memo-log.entity.ts
├── security/
│   └── entities/
│       ├── block-hp.entity.ts
│       ├── block-ip.entity.ts
│       └── block-word.entity.ts
└── websites/
    └── entities/
        └── website.entity.ts
```

---

### Auth 모듈

#### RefreshToken (리프레시 토큰)

**파일**: `src/modules/auth/entities/refresh-token.entity.ts`  
**테이블**: `refresh_tokens`

| 속성 | 타입 | 설명 |
|------|------|------|
| `id` | PK, int | 토큰 레코드 ID (AUTO_INCREMENT) |
| `tokenId` | varchar(100) | 토큰 식별자 (클라이언트 전달용) |
| `tokenHash` | varchar(255) | bcrypt 해시된 토큰 시크릿 |
| `userSeq` | int | 사용자 일련번호 (FK → User) |
| `expiresAt` | datetime | 만료 일시 |
| `revoked` | tinyint | 폐기 여부 (default: 0) |
| `createdAt` | datetime | 생성 일시 |

**인덱스**:
- UNIQUE: `[token_id]`

**보안 설계**:
- 클라이언트에 전달되는 토큰 형식: `{tokenId}.{secret}` (예: `abc123.a1b2c3d4...`)
- DB 저장: `tokenId` + bcrypt 해시된 `secret`
- 검증 프로세스: `tokenId`로 조회 → `bcrypt.compare()`로 시크릿 검증
- 토큰 회전(Rotation): 리프레시 시 기존 토큰 무효화 + 신규 발급

---

### Users 모듈

#### User (사용자)

**파일**: `src/modules/users/entities/user.entity.ts`  
**테이블**: `users`

| 속성 | 타입 | 설명 |
|------|------|------|
| `userSeq` | PK, int | 사용자 일련번호 (AUTO_INCREMENT) |
| `userId` | varchar(200) | 로그인 아이디 |
| `userPwd` | varchar(200) | bcrypt 해시된 비밀번호 |
| `corpName` | varchar(250) | 회사명 |
| `userName` | varchar(200) | 사용자명 |
| `userEmail` | varchar(250) | 이메일 (nullable) |
| `userTel` | varchar(200) | 대표전화 (nullable) |
| `userHp` | varchar(200) | 휴대전화 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `tokenVersion` | int | 토큰 버전 (default: 0) |
| `regDtm` | datetime | 등록일시 |
| `stopDtm` | datetime | 활동정지일시 (nullable) |
| `tenantId` | int | 테넌트 ID (FK → Tenant) |

**인덱스**:
- UNIQUE: `[user_seq, tenant_id]`
- UNIQUE: `[tenant_id, user_id]`

**tokenVersion 설명**:
- 서버에서 발급한 액세스 토큰에 포함되는 `tokenVersion` 값과 일치해야만 토큰이 유효
- 로그아웃-전체(`logout-all`) 시 이 값을 증가시켜 기존 액세스 토큰 즉시 무효화

---

### Roles 모듈

#### Role (역할)

**파일**: `src/modules/roles/entities/role.entity.ts`  
**테이블**: `roles`

| 속성 | 타입 | 설명 |
|------|------|------|
| `roleId` | PK, int | 역할 ID (AUTO_INCREMENT) |
| `roleName` | varchar(100) | 역할명 |
| `displayName` | varchar(100) | 표시명 (nullable) |
| `description` | text | 설명 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |
| `tenantId` | int | 테넌트 ID (FK → Tenant) |

**인덱스**:
- UNIQUE: `[tenant_id, role_name]`
- UNIQUE: `[role_id, tenant_id]`
- INDEX: `[tenant_id]`

**관계**:
- `userRoles`: OneToMany → UserRole
- `rolePermissions`: OneToMany → RolePermission

---

#### UserRole (사용자-역할 매핑)

**파일**: `src/modules/roles/entities/user-role.entity.ts`  
**테이블**: `user_roles`

| 속성 | 타입 | 설명 |
|------|------|------|
| `userSeq` | PK, int | 사용자 일련번호 |
| `tenantId` | PK, int | 테넌트 ID |
| `roleId` | PK, int | 역할 ID |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |

**복합 PK**: `[userSeq, tenantId, roleId]`

**인덱스**:
- INDEX: `[user_seq, tenant_id]`
- INDEX: `[role_id, tenant_id]`

**관계**:
- `user`: ManyToOne → User (CASCADE)
- `role`: ManyToOne → Role (CASCADE)

---

#### RolePermission (역할-권한 매핑)

**파일**: `src/modules/roles/entities/role-permission.entity.ts`  
**테이블**: `role_permissions`

| 속성 | 타입 | 설명 |
|------|------|------|
| `roleId` | PK, int | 역할 ID |
| `permissionId` | PK, int | 권한 ID |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |

**복합 PK**: `[roleId, permissionId]`

**관계**:
- `role`: ManyToOne → Role (CASCADE)
- `permission`: ManyToOne → Permission (CASCADE)

---

### RBAC 모듈

#### Page (페이지)

**파일**: `src/modules/rbac/entities/page.entity.ts`  
**테이블**: `pages`

| 속성 | 타입 | 설명 |
|------|------|------|
| `pageId` | PK, int | 페이지 ID (AUTO_INCREMENT) |
| `parentId` | int | 부모 페이지 ID (nullable) |
| `pageName` | varchar(100) | 페이지명 (권한 식별자) |
| `path` | varchar(255) | 라우트 경로 |
| `displayName` | varchar(100) | 표시명 |
| `description` | text | 설명 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `sortOrder` | tinyint | 정렬 순서 (nullable) |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**:
- UNIQUE: `[page_name]`
- INDEX: `[parent_id]`

**자기 참조**: `parent` (ManyToOne → Page) - 메뉴 계층 구조

---

#### Action (액션)

**파일**: `src/modules/rbac/entities/action.entity.ts`  
**테이블**: `actions`

| 속성 | 타입 | 설명 |
|------|------|------|
| `actionId` | PK, int | 액션 ID (AUTO_INCREMENT) |
| `actionName` | varchar(50) | 액션명 (read, create, update, delete 등) |
| `displayName` | varchar(100) | 표시명 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**:
- UNIQUE: `[action_name]`

---

#### Permission (권한)

**파일**: `src/modules/rbac/entities/permission.entity.ts`  
**테이블**: `permissions`

| 속성 | 타입 | 설명 |
|------|------|------|
| `permissionId` | PK, int | 권한 ID (AUTO_INCREMENT) |
| `pageId` | int | 페이지 ID (FK → Page) |
| `actionId` | int | 액션 ID (FK → Action) |
| `displayName` | varchar(100) | 표시명 (nullable) |
| `description` | text | 설명 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**:
- UNIQUE: `[page_id, action_id]`
- INDEX: `[action_id]`

**관계**:
- `page`: ManyToOne → Page (CASCADE)
- `action`: ManyToOne → Action (CASCADE)
- `rolePermissions`: OneToMany → RolePermission

**권한 식별**: `{pageName}.{actionName}` (예: `users.read`, `roles.create`)

---

### Tenants 모듈

#### Tenant (테넌트)

**파일**: `src/modules/tenants/entities/tenant.entity.ts`  
**테이블**: `tenants`

| 속성 | 타입 | 설명 |
|------|------|------|
| `tenantId` | PK, int | 테넌트 ID (AUTO_INCREMENT) |
| `tenantName` | varchar(100) | 테넌트명 (로그인 시 식별자) |
| `displayName` | varchar(100) | 표시명 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `domain` | varchar(200) | 도메인 (nullable) |
| `createdAt` | datetime | 생성일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**:
- UNIQUE: `[tenant_name]`

**역할**: 멀티테넌트 시스템의 최상위 격리 단위. 모든 비즈니스 데이터의 소유자.

---

### Counsel 모듈

#### Counsel (상담)

**파일**: `src/modules/counsel/entities/counsel.entity.ts`  
**테이블**: `counsel`

| 속성 | 타입 | 설명 |
|------|------|------|
| `counselSeq` | PK, bigint | 상담 일련번호 (AUTO_INCREMENT) |
| `webCode` | varchar(20) | 웹사이트 코드 (FK) |
| `tenantId` | int | 테넌트 ID |
| `name` | varchar(50) | 신청자명 (nullable) |
| `counselHp` | varchar(50) | 신청인 휴대전화 |
| `counselIp` | varchar(50) | 신청인 IP |
| `counselStat` | int | 상담 상태 (tenant_status_id 참조) |
| `empSeq` | int | 담당자 일련번호 (nullable) |
| `counselSource` | varchar(50) | UTM Source (nullable) |
| `counselMedium` | varchar(50) | UTM Medium (nullable) |
| `counselCampaign` | varchar(50) | UTM Campaign (nullable) |
| `deleteState` | enum | 삭제 여부 ('Y' \| 'N') |

---

#### CounselFieldDef / CounselFieldValue (동적 필드)

**설계 목적**: 테넌트별로 다른 상담 입력 필드 정의 가능

| 테이블 | 역할 |
|--------|------|
| `counsel_field_def` | 필드 정의 (필드명, 타입, 옵션 등) |
| `counsel_field_value` | 상담별 필드 값 저장 |

**필드 타입 지원**: text, textarea, number, date, datetime, select, multiselect, checkbox, radio, email, phone, url

**JSON 컬럼 처리** (`optionsJson`):
```typescript
transformer: {
  to: (value) => value ? JSON.stringify(value) : null,
  from: (value) => value ? JSON.parse(value) : null,
}
```

---

### Security 모듈

#### BlockHp / BlockIp / BlockWord (차단 관리)

| 테이블 | 차단 대상 | 특수 속성 |
|--------|----------|----------|
| `block_hp` | 휴대전화 번호 | - |
| `block_ip` | IP 주소 (IPv4/IPv6) | - |
| `block_word` | 키워드 | `matchType` (EXACT, CONTAINS, REGEX) |

**공통 속성**: `tenantId`, `reason`, `isActive`, `createdBy`, `createdAt`

---

## 부록 C: 엔티티 관계 상세도

```
Tenant (1) --< (N) User
Tenant (1) --< (N) Role
Tenant (1) --< (N) TenantStatus
Tenant (1) --< (N) Board
Tenant (1) --< (N) Website
Tenant (1) --< (N) Counsel
Tenant (1) --< (N) CounselFieldDef
Tenant (1) --< (N) BlockHp
Tenant (1) --< (N) BlockIp
Tenant (1) --< (N) BlockWord

User (1) --< (N) UserRole          [roles/entities/]
User (1) --< (N) Website
User (1) --< (N) Post
User (1) --< (N) Counsel (emp_seq)
User (1) --< (N) CounselMemoLog (created_by)
User (1) --< (N) RefreshToken      [auth/entities/]

Role (1) --< (N) UserRole          [roles/entities/]
Role (1) --< (N) RolePermission    [roles/entities/]

Page (1) --< (N) Permission        [rbac/entities/]
Page (1) --< (N) Page (parent)     [rbac/entities/]

Action (1) --< (N) Permission      [rbac/entities/]

Permission (1) --< (N) RolePermission

CodeGroup (1) --< (N) Code

Board (1) --< (N) Post

Website (1) --< (N) Counsel

TenantStatus (1) --< (N) Counsel
TenantStatus (1) --< (N) CounselLog
TenantStatus (1) --< (N) CounselMemoLog

Counsel (1) --< (N) CounselFieldValue
Counsel (1) --< (N) CounselLog
Counsel (1) --< (N) CounselMemoLog

CounselFieldDef (1) --< (N) CounselFieldValue
```

### 모듈 간 참조 관계

```
auth/ ──────────> users/
   │                │
   └── RefreshToken │
         (FK: user_seq → User)
                    │
roles/ <────────────┘
   │
   ├── Role
   ├── UserRole ────> users/User
   └── RolePermission ───> rbac/Permission
                              │
rbac/ <───────────────────────┘
   │
   ├── Page (self-ref)
   ├── Action
   └── Permission ───> Page, Action
```

---

## 부록 D: 구현 특징 요약

### 타임스탬프 관리

| 패턴 | 사용 예 |
|------|--------|
| `@CreateDateColumn` / `@UpdateDateColumn` | 대부분의 엔티티 |
| `default: () => 'CURRENT_TIMESTAMP'` | 레거시 호환 컬럼 (`reg_dtm`, `edit_dtm`) |

### Enum 타입

| Enum | 값 | 사용처 |
|------|---|-------|
| `DeleteState` | 'Y', 'N' | Post, Counsel |
| `MatchType` | EXACT, CONTAINS, REGEX | BlockWord |

### 복합 외래키

테넌트 격리를 위해 복합 FK 사용:
- `[user_seq, tenant_id]`
- `[web_code, tenant_id]`
- `[tenant_id, tenant_status_id]`

### 관계 삭제 정책

| 정책 | 설명 | 예시 |
|------|------|------|
| `CASCADE` | 부모 삭제 시 자식 자동 삭제 | UserRole, RolePermission |
| `SET NULL` | 부모 삭제 시 FK를 NULL로 | Page.parent |

### 인덱스 전략

| 목적 | 전략 |
|------|------|
| 테넌트 격리 | 모든 조회 쿼리에 `tenant_id` 복합 인덱스 |
| 유니크 제약 | 비즈니스 키 조합 (예: `[tenant_id, user_id]`) |
| 조회 최적화 | 자주 사용되는 필터 조건 복합 인덱스 |

---

## 부록 E: 엔티티 통계

**총 22개 엔티티**

| 모듈 | 엔티티 수 | 주요 엔티티 |
|------|----------|------------|
| Auth | 1 | RefreshToken |
| Users | 1 | User |
| Roles | 3 | Role, UserRole, RolePermission |
| RBAC | 3 | Page, Action, Permission |
| Tenants | 2 | Tenant, TenantStatus |
| Codes | 2 | CodeGroup, Code |
| Boards | 2 | Board, Post |
| Counsel | 5 | Counsel, CounselFieldDef, CounselFieldValue, CounselLog, CounselMemoLog |
| Security | 3 | BlockHp, BlockIp, BlockWord |
| Websites | 1 | Website |

### 모듈별 엔티티 분류

| 분류 | 모듈 | 설명 | API 구현 상태 |
|------|------|------|--------------|
| 테넌트 종속 | Users, Roles, Tenants | 테넌트별로 격리된 데이터 | ✅ 완료 |
| 전역 카탈로그 | RBAC, Codes | 시스템 공통 마스터 데이터 | ✅ 완료 (RBAC) |
| 인증 전용 | Auth | 토큰 관리 | ✅ 완료 |
| 웹사이트 관리 | Websites | 상담 유입 웹사이트 | ✅ 완료 |
| 보안 관리 | Security | IP/휴대폰/금칙어 차단 | ✅ 완료 |
| 비즈니스 도메인 | Boards, Counsel, Codes | 게시판, 상담, 공통코드 | 🔜 예정 |

---

## 부록 F: Security 모듈 상세 명세

### BlockIp (IP 차단)

**파일**: `src/modules/security/entities/block-ip.entity.ts`  
**테이블**: `block_ip`

| 속성 | 타입 | 설명 |
|------|------|------|
| `dbiIdx` | PK, int | IP 차단 ID (AUTO_INCREMENT) |
| `tenantId` | int | 테넌트 ID (FK → Tenant) |
| `blockIp` | varchar(45) | 차단 IP (IPv4/IPv6 지원) |
| `reason` | varchar(255) | 차단 사유 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `createdBy` | int | 등록자 userSeq |
| `createdAt` | datetime | 등록일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**: UNIQUE `[tenant_id, block_ip]`

**API 엔드포인트**:
| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/security/block-ip` | 목록 조회 | `security.read` |
| GET | `/security/block-ip/:id` | 상세 조회 | `security.read` |
| GET | `/security/block-ip/check?ip=` | 차단 여부 확인 | `security.read` |
| POST | `/security/block-ip` | 단건 등록 | `security.create` |
| POST | `/security/block-ip/bulk` | 대량 등록 | `security.create` |
| PATCH | `/security/block-ip/:id` | 수정 | `security.update` |
| DELETE | `/security/block-ip/:id` | 삭제 | `security.delete` |

---

### BlockHp (휴대폰 차단)

**파일**: `src/modules/security/entities/block-hp.entity.ts`  
**테이블**: `block_hp`

| 속성 | 타입 | 설명 |
|------|------|------|
| `dbhIdx` | PK, int | 휴대폰 차단 ID (AUTO_INCREMENT) |
| `tenantId` | int | 테넌트 ID (FK → Tenant) |
| `blockHp` | varchar(20) | 차단 휴대폰 번호 (하이픈 없이 저장) |
| `reason` | varchar(255) | 차단 사유 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `createdBy` | int | 등록자 userSeq |
| `createdAt` | datetime | 등록일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**: UNIQUE `[tenant_id, block_hp]`

**API 엔드포인트**:
| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/security/block-hp` | 목록 조회 | `security.read` |
| GET | `/security/block-hp/:id` | 상세 조회 | `security.read` |
| GET | `/security/block-hp/check?hp=` | 차단 여부 확인 | `security.read` |
| POST | `/security/block-hp` | 단건 등록 | `security.create` |
| POST | `/security/block-hp/bulk` | 대량 등록 | `security.create` |
| PATCH | `/security/block-hp/:id` | 수정 | `security.update` |
| DELETE | `/security/block-hp/:id` | 삭제 | `security.delete` |

---

### BlockWord (금칙어 차단)

**파일**: `src/modules/security/entities/block-word.entity.ts`  
**테이블**: `block_word`

| 속성 | 타입 | 설명 |
|------|------|------|
| `dbwIdx` | PK, int | 금칙어 ID (AUTO_INCREMENT) |
| `tenantId` | int | 테넌트 ID (FK → Tenant) |
| `blockWord` | varchar(100) | 차단 단어 |
| `matchType` | enum | 매칭 타입 (EXACT, CONTAINS, REGEX) |
| `reason` | varchar(255) | 차단 사유 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `createdBy` | int | 등록자 userSeq |
| `createdAt` | datetime | 등록일시 |
| `updatedAt` | datetime | 수정일시 |

**인덱스**: UNIQUE `[tenant_id, block_word, match_type]`

**MatchType 설명**:
| 타입 | 설명 | 예시 |
|------|------|------|
| EXACT | 정확히 일치 | "욕설" → "욕설"만 차단 |
| CONTAINS | 포함 여부 | "욕설" → "이건욕설임" 차단 |
| REGEX | 정규표현식 | "욕.*설" → "욕!설", "욕ㅅㅓㄹ" 차단 |

**API 엔드포인트**:
| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/security/block-word` | 목록 조회 | `security.read` |
| GET | `/security/block-word/:id` | 상세 조회 | `security.read` |
| GET | `/security/block-word/check?text=` | 차단 여부 확인 | `security.read` |
| POST | `/security/block-word` | 단건 등록 | `security.create` |
| POST | `/security/block-word/bulk` | 대량 등록 | `security.create` |
| PATCH | `/security/block-word/:id` | 수정 | `security.update` |
| DELETE | `/security/block-word/:id` | 삭제 | `security.delete` |

---

## 부록 G: Websites 모듈 상세 명세

### Website (웹사이트)

**파일**: `src/modules/websites/entities/website.entity.ts`  
**테이블**: `website`

| 속성 | 타입 | 설명 |
|------|------|------|
| `tenantId` | PK, int | 테넌트 ID (FK → Tenant) |
| `webCode` | PK, varchar(20) | 웹사이트 코드 |
| `userSeq` | int | 담당자 userSeq (nullable) |
| `webUrl` | varchar(300) | 웹사이트 URL |
| `webTitle` | varchar(100) | 웹사이트 제목 |
| `webImg` | varchar(300) | 이미지 URL (nullable) |
| `webDesc` | text | 설명 (nullable) |
| `webMemo` | text | 메모 (nullable) |
| `isActive` | tinyint | 활성 여부 (default: 1) |
| `duplicateAllowAfterDays` | int | 중복 허용 일수 (nullable) |
| `createdAt` | datetime | 등록일시 |
| `updatedAt` | datetime | 수정일시 |

**복합 PK**: `[tenantId, webCode]`

**API 엔드포인트**:
| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/websites` | 목록 조회 | `websites.read` |
| GET | `/websites/:webCode` | 상세 조회 | `websites.read` |
| POST | `/websites` | 생성 | `websites.create` |
| PATCH | `/websites/:webCode` | 수정 | `websites.update` |
| PATCH | `/websites/:webCode/status` | 상태 변경 | `websites.update` |
| DELETE | `/websites/:webCode` | 삭제 | `websites.delete` |
