# flowdesk-admin

Multi-tenant B2B CRM & Counseling Admin SaaS built with NestJS and React.js.

---

## 📋 Overview

**flowdesk-admin**은 멀티테넌트 SaaS 환경에서 가장 치명적인 리스크인

- 테넌트 간 데이터 섞임
- 권한(RBAC) 오염
- 쿼리 실수로 인한 정보 유출

을 **애플리케이션 로직이 아닌 DB 설계로 원천 차단**하는 것을 목표로 한 관리자(Admin) 시스템 사이드 프로젝트입니다.

이 프로젝트의 핵심은 기능 구현이 아니라 **"사고를 막는 구조"를 설계하는 능력**을 보여주는 데 있습니다.

---

## 🏗️ 프로젝트 구조

```
flowdesk-admin/
├── backend/          # NestJS + TypeORM + MySQL
│   ├── .env.development
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/          # 재사용 데코레이터·유틸
│   │   ├── config/          # 환경·DB 설정 및 유효성
│   │   ├── database/        # TypeORM DataSource / 모듈 옵션
│   │   └── modules/         # 도메인별 모듈 구조
│   │       ├── iam/         # 사용자, 역할, 권한
│   │       ├── tenants/     # 테넌트 관리
│   │       ├── codes/       # 공통 코드
│   │       ├── boards/      # 게시판
│   │       ├── counsel/     # 상담 관리
│   │       ├── security/    # 차단 관리 (IP, 연락처, 키워드)
│   │       └── websites/    # 웹사이트 관리
│   └── entities-structure.md # 엔티티 상세 문서 (updated 2026-01-13)
└── README.md
```

---

## 🚀 기술 스택

### Backend

- **Framework**: NestJS (v11+)
- **ORM**: TypeORM (v0.3+)
- **Database**: MySQL 8.0+
- **Language**: TypeScript
- **인증/인가**: JWT, RBAC

### Frontend

> 🚧 개발 예정

- React.js
- Role / Permission 기반 메뉴 렌더링
- 테넌트별 데이터 완전 분리 UI

---

## 🗄️ MySQL (Core Design)

### 설계 목표

멀티테넌트 환경에서 **Tenant Boundary를 DB가 직접 보장**하는 것이 핵심입니다.

- "쿼리에서 tenant 조건을 빼먹는 실수"를 전제로 한 방어적 설계
- 데이터 섞임 / 권한 유출을 **구조적으로 불가능하게 만드는 것**

> **핵심 철학**  
> tenant 조건을 잘 넣자 ❌  
> tenant 조건을 빼도 사고가 안 나게 하자 ✅

---

### 핵심 설계 원칙

#### 1. 모든 핵심 도메인은 tenant_id를 직접 가진다

테넌트 스코프가 필요한 모든 테이블은 `tenant_id` 컬럼을 포함합니다.

**테넌트 스코프 엔티티 목록:**
- `users` - 사용자
- `roles` - 역할
- `user_roles` - 사용자-역할 매핑
- `board` - 게시판
- `post` - 게시물
- `counsel` - 상담
- `counsel_field_def` - 상담 필드 정의
- `counsel_field_value` - 상담 필드 값
- `counsel_log` - 상담 로그
- `counsel_memo_log` - 상담 메모 로그
- `tenant_status` - 테넌트별 상태 관리
- `websites` - 웹사이트
- `block_hp` - 차단 연락처
- `block_ip` - 차단 IP
- `block_word` - 차단 키워드

👉 **"이 데이터가 어느 테넌트 소속인지"를 DB가 항상 알고 있도록 설계**

---

#### 2. Foreign Key는 항상 `(id, tenant_id)` 복합 참조

단일 PK 참조는 멀티테넌트 환경에서 불완전합니다. 모든 FK는 복합 키로 구성되어 다른 테넌트 리소스를 참조하는 시도 자체가 DB 레벨에서 실패합니다.

**복합 FK 예시:**
- `post(board_id, tenant_id)` → `board(board_id, tenant_id)`
- `counsel(web_code, tenant_id)` → `websites(web_code, tenant_id)`
- `counsel(tenant_id, counsel_stat)` → `tenant_status(tenant_id, tenant_status_id)`
- `user_roles(user_seq, tenant_id)` → `users(user_seq, tenant_id)`
- `user_roles(role_id, tenant_id)` → `roles(role_id, tenant_id)`
- `counsel_field_value(counsel_seq, tenant_id)` → `counsel(counsel_seq, tenant_id)`
- `counsel_field_value(field_id, tenant_id)` → `counsel_field_def(field_id, tenant_id)`

👉 **다른 테넌트 리소스를 참조하는 시도 자체가 DB 레벨에서 즉시 실패**

---

#### 3. 가장 위험한 도메인(counsel)을 최우선 보호

상담 데이터는 가장 민감한 도메인입니다. 모든 관계를 **tenant_id 포함 복합 FK**로 연결하여 테넌트 간 상담 데이터 혼입 가능성을 제거했습니다.

**Counsel 도메인 보호 구조:**
- `counsel` ↔ `websites` (복합 FK: `web_code, tenant_id`)
- `counsel` ↔ `tenant_status` (복합 FK: `tenant_id, counsel_stat`)
- `counsel` ↔ `counsel_log` (복합 FK: `counsel_seq, tenant_id`)
- `counsel` ↔ `counsel_memo_log` (복합 FK: `counsel_seq, tenant_id`)
- `counsel` ↔ `counsel_field_value` (복합 FK: `counsel_seq, tenant_id`)

---

## 🔐 RBAC (Role-Based Access Control) Design

### RBAC 설계 목표

- 테넌트 간 권한 오염을 **DB 레벨에서 원천 차단**
- "다른 테넌트의 Role을 잘못 부여하는 사고" 방지
- 권한 검증 로직을 단순화하고, DB를 신뢰 가능한 방어선으로 사용

---

### RBAC 구성 요소

#### 1. Pages (접근 대상)

**엔티티**: `pages`  
**특성**: 글로벌 리소스 (tenant 비종속)

- 시스템 내 접근 가능한 페이지/메뉴 단위
- `page_name`은 전역 유니크 (UI 식별자)
- 계층 구조 지원 (`parent_id`로 부모-자식 관계)

---

#### 2. Actions (행위)

**엔티티**: `actions`  
**특성**: 글로벌 리소스 (tenant 비종속)

- VIEW, CREATE, UPDATE, DELETE 등
- `action_name` 전역 유니크

---

#### 3. Permissions (권한의 원자 단위)

**엔티티**: `permissions`  
**특성**: 글로벌 리소스 (tenant 비종속)

> **"어떤 페이지에서 어떤 행동이 가능한가"**

- `page_id` + `action_id` 조합으로 정의
- 권한의 최소 단위 (Atomic Permission)
- `(page_id, action_id)` 유니크 제약

---

#### 4. Roles (테넌트별 역할)

**엔티티**: `roles`  
**특성**: 테넌트 스코프 (tenant 종속)

- role은 반드시 tenant 소속
- 같은 `role_name`이라도 `tenant_id`가 다르면 완전히 다른 Role
- `(tenant_id, role_name)` 유니크 제약
- 테넌트별 권한 정책을 완전히 독립적으로 운영 가능

---

#### 5. RolePermissions (역할이 가진 권한)

**엔티티**: `role_permissions`  
**특성**: 조인 테이블 (created_at/updated_at 포함)

- `role` ↔ `permission` 매핑 테이블
- role이 tenant 단위이므로 → 권한도 자연스럽게 tenant 스코프 유지
- 복합 PK: `(role_id, permission_id)`

---

#### 6. UserRoles (사용자에게 역할 부여)

**엔티티**: `user_roles`  
**특성**: 조인 테이블 (created_at/updated_at 포함)

> **"핵심 포인트"**

- `user_roles`에 `tenant_id` 명시
- 복합 PK: `(user_seq, tenant_id, role_id)`
- 복합 FK 강제:
  - `(user_seq, tenant_id)` → `users(user_seq, tenant_id)`
  - `(role_id, tenant_id)` → `roles(role_id, tenant_id)`

👉 **다른 테넌트의 Role을 사용자에게 부여하는 시도 자체가 DB 레벨에서 즉시 실패**

---

### RBAC 데이터 흐름

```
Pages (글로벌)
  ↓
Actions (글로벌)
  ↓
Permissions = Pages × Actions (글로벌)
  ↓
Roles (테넌트별)
  ↓
RolePermissions = Roles × Permissions
  ↓
UserRoles = Users × Roles (복합 FK로 테넌트 격리 보장)
```

---

## 📊 엔티티 통계

**총 22개 엔티티**

- **IAM 모듈**: 7개 (User, Role, UserRole, Action, Page, Permission, RolePermission)
- **Tenants 모듈**: 2개 (Tenant, TenantStatus)
- **Codes 모듈**: 2개 (CodeGroup, Code)
- **Boards 모듈**: 2개 (Board, Post)
- **Counsel 모듈**: 5개 (Counsel, CounselFieldDef, CounselFieldValue, CounselLog, CounselMemoLog)
- **Security 모듈**: 3개 (BlockHp, BlockIp, BlockWord)
- **Websites 모듈**: 1개 (Website)

상세한 엔티티 구조는 [`backend/entities-structure.md`](./backend/entities-structure.md) 참조

---

## 🛡️ 보안 설계 하이라이트

### 1. 테넌트 격리

- 모든 테넌트 스코프 엔티티는 `tenant_id` 필수
- 복합 FK로 다른 테넌트 리소스 참조 불가능
- UNIQUE 제약으로 테넌트별 비즈니스 키 보장

### 2. 권한 격리

- `user_roles`의 복합 FK로 다른 테넌트 Role 부여 불가능
- `role_permissions`를 통한 권한 체인은 자동으로 tenant 스코프 유지

### 3. 상담 데이터 보호

- 민감한 상담 데이터는 모든 관계를 복합 FK로 연결
- `counsel`, `counsel_log`, `counsel_memo_log`, `counsel_field_value` 모두 tenant 격리

### 4. 차단 기능

- `block_hp`, `block_ip`, `block_word` 모두 테넌트별 관리
- `(tenant_id, block_value)` 유니크 제약

---

## 📝 주요 특징

### 타임스탬프 관리

- `created_at`/`updated_at`: `@CreateDateColumn`/`@UpdateDateColumn` 사용
- `reg_dtm`/`edit_dtm`: `@Column` + `default: () => 'CURRENT_TIMESTAMP'` 사용

### Enum 타입

- `DeleteState`: 'Y'|'N' (Post, Counsel)
- `MatchType`: EXACT|CONTAINS|REGEX (BlockWord)

### JSON 컬럼 처리

- `CounselFieldDef.optionsJson`: longtext + transformer로 JSON 자동 변환

### 소프트 삭제

- `delete_state` enum 또는 `is_deleted` tinyint 사용
- `deleted_at` 컬럼으로 삭제 시점 기록

---

## 🗺️ ERD

<img width="1056" height="2782" alt="flowdesk_admin_prod" src="https://github.com/user-attachments/assets/abe36c34-cc9b-49e8-a31c-26e42b0fce61" />

---

## 📚 참고 문서

- [엔티티 구조 상세 문서](./backend/entities-structure.md) - 모든 엔티티의 상세 스펙
- [Backend README](./backend/README.md) - 백엔드 프로젝트 설정 및 실행 방법

---

## 🎯 프로젝트 목표

이 프로젝트는 **"완벽한 코드"**가 아니라 **"사고를 막는 구조"**를 설계하는 것을 목표로 합니다.

- ✅ DB 레벨에서 테넌트 격리 보장
- ✅ 복합 FK로 잘못된 참조 방지
- ✅ RBAC 권한 오염 원천 차단
- ✅ 방어적 설계로 실수 방지

---

**프로젝트**: FlowDesk Admin  
**기술 스택**: NestJS + TypeORM + MySQL + TypeScript  
**라이선스**: UNLICENSED
