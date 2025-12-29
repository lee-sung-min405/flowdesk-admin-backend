# flowdesk-admin
Multi-tenant B2B CRM & Counseling Admin SaaS built with NestJS and React.js.

---

## Overview

**flowdesk-admin**은  
멀티테넌트 SaaS 환경에서 가장 치명적인 리스크인

- 테넌트 간 데이터 섞임
- 권한(RBAC) 오염
- 쿼리 실수로 인한 정보 유출

을 **애플리케이션 로직이 아닌 DB 설계로 원천 차단**하는 것을 목표로 한  
관리자(Admin) 시스템 사이드 프로젝트입니다.

이 프로젝트의 핵심은 기능 구현이 아니라  
**“사고를 막는 구조”를 설계하는 능력**을 보여주는 데 있습니다.

---

## BackEnd

> 🚧 개발 예정

- NestJS 기반 API 서버
- Tenant-aware 인증 / 인가
- DB 스키마를 신뢰하는 얇은 서비스 레이어 지향
- RBAC 기반 접근 제어

---

## Frontend

> 🚧 개발 예정

- React 기반 관리자 UI
- Role / Permission 기반 메뉴 렌더링
- 테넌트별 데이터 완전 분리 UI

---

## MySQL (Core Design)

### 설계 목표

- 멀티테넌트 환경에서 **Tenant Boundary를 DB가 직접 보장**
- “쿼리에서 tenant 조건을 빼먹는 실수”를 전제로 한 방어적 설계
- 데이터 섞임 / 권한 유출을 **구조적으로 불가능하게 만드는 것**

> tenant 조건을 잘 넣자 ❌  
> tenant 조건을 빼도 사고가 안 나게 하자 ✅

---

### 핵심 설계 원칙

#### 1. 모든 핵심 도메인은 tenant_id를 직접 가진다

- counsel (상담)
- post / board (게시판)
- tenant_status (상태 관리)
- roles / user_roles (RBAC)
- counsel_field_def / counsel_field_value (커스텀 필드)

👉 “이 데이터가 어느 테넌트 소속인지”를 DB가 항상 알고 있도록 설계

---

#### 2. Foreign Key는 항상 `(id, tenant_id)` 복합 참조

단일 PK 참조는 멀티테넌트 환경에서 불완전합니다.

**예시**
- post(board_id, tenant_id) → board(board_id, tenant_id)
- counsel(tenant_id, counsel_stat) → tenant_status(tenant_id, tenant_status_id)
- user_roles(role_id, tenant_id) → roles(role_id, tenant_id)

👉 다른 테넌트 리소스를 참조하는 시도 자체가 DB 레벨에서 실패

---

#### 3. 가장 위험한 도메인(counsel)을 최우선 보호

상담 데이터는 가장 민감한 도메인입니다.

- counsel ↔ websites
- counsel ↔ tenant_status
- counsel ↔ logs / memo_logs
- counsel ↔ custom fields

모든 관계를 **tenant_id 포함 FK**로 연결하여  
테넌트 간 상담 데이터 혼입 가능성을 제거했습니다.

---

## RBAC (Role-Based Access Control) Design

### RBAC 설계 목표

- 테넌트 간 권한 오염을 **DB 레벨에서 원천 차단**
- “다른 테넌트의 Role을 잘못 부여하는 사고” 방지
- 권한 검증 로직을 단순화하고, DB를 신뢰 가능한 방어선으로 사용

---

### RBAC 구성 요소

#### 1. pages (접근 대상)

- 시스템 내 접근 가능한 페이지/메뉴 단위
- 글로벌 리소스 (tenant 비종속)
- page_name은 전역 유니크 (UI 식별자)

---

#### 2. actions (행위)

- VIEW, CREATE, UPDATE, DELETE 등
- 글로벌 리소스
- action_name 전역 유니크

---

### 3. Permissions (권한의 원자 단위)

> **“어떤 페이지에서 어떤 행동이 가능한가”**

- 전역 정의
- 권한의 최소 단위 (Atomic Permission)

---

## 4. roles (테넌트별 역할)

- role은 반드시 tenant 소속
- 같은 role_name이라도 tenant_id가 다르면 완전히 다른 Role
- (tenant_id, role_name) 유니크 제약
- 테넌트별 권한 정책을 완전히 독립적으로 운영 가능

---

#### 5. role_permissions (역할이 가진 권한)

- role ↔ permission 매핑 테이블
- role이 tenant 단위이므로 → 권한도 자연스럽게 tenant 스코프 유지

---

#### 6. user_roles (사용자에게 역할 부여)

- role ↔ permission 매핑 테이블
- role이 tenant 단위이므로 → 권한도 자연스럽게 tenant 스코프 유지

> **“핵심 포인트”**
- user_roles에 tenant_id 명시
- 복합 FK 강제
(user_seq, tenant_id) → users
(role_id, tenant_id) → roles
- 다른 테넌트의 Role을 사용자에게 부여하는 시도 자체가
- DB 레벨에서 즉시 실패

---
<img width="1056" height="2782" alt="flowdesk_admin_prod" src="https://github.com/user-attachments/assets/abe36c34-cc9b-49e8-a31c-26e42b0fce61" />
