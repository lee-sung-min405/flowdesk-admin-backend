# flowdesk-admin

회사(테넌트) 단위로 데이터를 완전 격리하는 멀티테넌트 B2B SaaS 관리자 시스템

멀티테넌트 SaaS에서 가장 치명적인 문제인 테넌트 간 데이터 격리와 권한 오염을 설계 수준에서 검증하기 위한 백엔드 중심 프로젝트다.

---

## 핵심 개념

- 모든 데이터는 회사(테넌트) 단위로 분리되며, 다른 회사의 데이터에 접근할 수 없다
- 회원가입 시 회사와 관리자 계정이 함께 생성된다
- 관리자는 자신의 회사에 소속된 팀원만 추가하고 관리할 수 있다
- 모든 API 요청은 요청자의 회사 스코프 내에서만 데이터를 조회하고 수정한다
- 역할 기반 접근 제어(RBAC)로 회사 내 권한을 세분화한다

---

## 프로젝트 구조

```
flowdesk-admin/
├── docs/           # 설계 문서
├── backend/        # API 서버 (현재 개발 중)
└── frontend/       # 관리자 UI (구현 예정)
```

| 디렉터리 | 설명 |
|----------|------|
| `docs/` | 사용자 플로우, 인증/권한 정책, 엔티티 구조 등 설계 문서 |
| `backend/` | NestJS 기반 REST API 서버. 인증, 사용자 관리, 권한 검증 구현 |
| `frontend/` | React 기반 관리자 UI. 백엔드 API 안정화 후 개발 예정 |

**개발 전략**: 백엔드 API와 데이터 모델을 먼저 안정화한 후 프론트엔드를 구현하는 단계적 접근 방식을 채택했다. 현재 시점에서 검증 가능한 결과물은 백엔드 서버다.

---

## 설계 문서

아래 문서들은 구현 전에 작성된 설계 기준 문서다. 시스템의 의도와 제약 조건을 이해하려면 이 문서들을 참고하라.

| 문서 | 설명 |
|------|------|
| [사용자 플로우](./docs/user-flow.md) | 회원가입, 로그인, 팀원 관리 등 주요 시나리오 |
| [온보딩 가이드](./docs/onboarding.md) | 서비스 최초 사용 흐름 |
| [인증/권한 정책](./docs/auth.md) | JWT 인증, 토큰 정책, RBAC 권한 체계 |
| [엔티티 구조](./docs/entities-structure.md) | 테넌트 격리 설계, 엔티티 관계 및 제약 조건 |
| [Backend README](./backend/README.md) | 백엔드 서버 구조, 실행 방법, 개발 가이드 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | NestJS, TypeORM, TypeScript |
| Database | MySQL |
| Auth | JWT, RBAC |
| Frontend | React (구현 예정) |

---

## 로컬 실행

### Backend

```bash
cd backend
npm install
npm run start:dev
```

상세 설정 및 환경 변수는 [backend/README.md](./backend/README.md) 참고

### Frontend

구현 예정
