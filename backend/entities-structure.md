# FlowDesk Admin - 엔티티 구조 문서

## 목차
1. [폴더 구조](#폴더-구조)
2. [IAM 모듈](#iam-모듈)
3. [Tenants 모듈](#tenants-모듈)
4. [Codes 모듈](#codes-모듈)
5. [Boards 모듈](#boards-모듈)
6. [Counsel 모듈](#counsel-모듈)
7. [Security 모듈](#security-모듈)
8. [Websites 모듈](#websites-모듈)
9. [엔티티 관계도](#엔티티-관계도)
10. [주요 특징](#주요-특징)

---

### RefreshToken (리프레시 토큰)
**파일**: `src/modules/auth/entities/refresh-token.entity.ts`
**테이블**: `refresh_tokens`

리프레시 토큰은 액세스 토큰 만료 시 새 액세스 토큰을 발급하기 위해 사용됩니다. 이 프로젝트에서는 보안을 강화하기 위해 `tokenId.secret` 포맷을 사용합니다. 서버는 `tokenId`와 `secret`의 bcrypt 해시(`token_hash`)만 저장하며, 원시 `secret` 값은 저장하지 않습니다.

#### 주요 속성
- `tokenId` (PK): 토큰 ID (varchar(36) 또는 UUID 문자열)
- `tokenHash`: 토큰 비밀의 bcrypt 해시 (varchar(200)) — 원시 secret은 저장하지 않음
- `userSeq`: 소유자 사용자 일련번호 (int) — `users.user_seq` FK
- `expiresAt`: 만료일시 (datetime)
- `revoked`: 폐기 여부 (tinyint(1), default: 0)
- `createdAt`: 생성일시 (datetime, default: CURRENT_TIMESTAMP)

#### 인덱스
- PRIMARY: `token_id`
- INDEX: `user_seq`

#### 동작 및 보안 설명
- 클라이언트는 리프레시 토큰을 `tokenId.secret` 형식으로 보관합니다. 서버는 클라이언트가 제출한 토큰을 `.`로 분리하여 `tokenId`로 DB 레코드를 조회한 뒤, 제출된 `secret`을 `tokenHash`와 bcrypt.compare로 검증합니다.
- 리프레시 교환(refresh) 동작은 토큰 회전(rotation) 정책을 따릅니다: 검증 성공 시 기존 토큰을 원자적으로(`WHERE revoked = 0`) `revoked = 1`로 표시하고 새 토큰을 생성해 반환합니다. 이 과정은 동시성 공격(동일 토큰의 재사용)을 막기 위해 조건부 업데이트를 사용합니다.
- 단일 토큰 폐기(`logout`)는 `tokenId`와 `secret`을 검증한 뒤 요청자 소유권을 확인하고 해당 레코드를 폐기합니다.
- 전체 폐기(`logout-all`)는 해당 사용자의 모든 리프레시 토큰을 `revoked = 1`로 설정하고 `users.token_version`을 증가시켜 기존 액세스 토큰을 즉시 무효화합니다.


## 폴더 구조

```
backend/
├── .env.development
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.mjs
├── README.md
├── src/
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   └── transactional.decorator.ts
│   │   └── utils/
│   │       └── transaction.util.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   └── validation.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── datasource.ts
│   │   └── typeorm.module-options.ts
│   ├── modules/
│   │   ├── iam/
│   │   │   └── entities/
│   │   │       ├── user.entity.ts
│   │   │       ├── role.entity.ts
│   │   │       ├── user-role.entity.ts
│   │   │       ├── action.entity.ts
│   │   │       ├── page.entity.ts
│   │   │       ├── permission.entity.ts
│   │   │       └── role-permission.entity.ts
│   │   ├── tenants/
│   │   │   └── entities/
│   │   │       ├── tenant.entity.ts
│   │   │       └── tenant-status.entity.ts
│   │   ├── codes/
│   │   │   └── entities/
│   │   │       ├── code-group.entity.ts
│   │   │       └── code.entity.ts
│   │   ├── boards/
│   │   │   └── entities/
│   │   │       ├── board.entity.ts
│   │   │       └── post.entity.ts
│   │   ├── counsel/
│   │   │   └── entities/
│   │   │       ├── counsel.entity.ts
│   │   │       ├── counsel-field-def.entity.ts
│   │   │       ├── counsel-field-value.entity.ts
│   │   │       ├── counsel-log.entity.ts
│   │   │       └── counsel-memo-log.entity.ts
│   │   ├── security/
│   │   │   └── entities/
│   │   │       ├── block-hp.entity.ts
│   │   │       ├── block-ip.entity.ts
│   │   │       └── block-word.entity.ts
│   │   └── websites/
│   │       └── entities/
│   │           └── website.entity.ts
│   └── test/
│       ├── app.e2e-spec.ts
│       └── jest-e2e.json
``` 

---

## IAM 모듈
 
---

## 공통·설정·데이터베이스 설명

- **`src/common`**: 애플리케이션 전반에서 재사용되는 헬퍼와 데코레이터 보관소.
  - `decorators/transactional.decorator.ts`: 메서드 수준에서 데이터베이스 트랜잭션 경계를 쉽게 적용하는 데코레이터입니다. 주로 서비스 레이어의 복합 작업을 트랜잭션으로 묶을 때 사용합니다.
  - `utils/transaction.util.ts`: 트랜잭션 실행 유틸리티(예: EntityManager 전달, 재시도 로직, 에러 처리)들이 위치합니다.

- **`src/config`**: 환경별 설정과 설정 관련 유효성 검증을 담당합니다.
  - `configuration.ts`: 애플리케이션 설정값을 중앙에서 로드/노출하는 함수(예: `ConfigModule`에 제공할 값)를 포함합니다.
  - `database.config.ts`: 데이터베이스 연결 정보(호스트, 포트, 사용자, DB명, sync 옵션 등)를 구성하고 노출합니다.
  - `validation.ts`: 환경변수(`.env`) 유효성 검증 스키마(Via `Joi` 등) 정의로 잘못된 배포/개발 설정을 조기에 차단합니다.

- **`src/database`**: TypeORM/데이터소스 설정과 DB 모듈화를 담당합니다.
  - `datasource.ts`: TypeORM `DataSource` 인스턴스(또는 데이터소스 팩토리)를 생성/내보내며 마이그레이션·커넥션 초기화 진입점 역할을 합니다.
  - `typeorm.module-options.ts`: Nest용 TypeORM 모듈 옵션을 팩토리 형태로 제공하는 파일(동적 설정 주입용)입니다.
  - `database.module.ts`: `DataSource`/`TypeOrmModule`을 애플리케이션에 연결하여 `@InjectRepository` 등으로 엔티티 리포지토리를 주입할 수 있게 하는 모듈입니다.

---


### User (사용자)
**파일**: `src/modules/iam/entities/user.entity.ts`  
**테이블**: `users`

#### 주요 속성
- `userSeq` (PK): 사용자 일련번호 (int, AUTO_INCREMENT)
- `userId`: 아이디 (varchar(200))
- `userPwd`: 비밀번호 (varchar(200))
- `corpName`: 회사명 (varchar(250))
- `userName`: 이름 (varchar(200))
- `userEmail`: 이메일 (varchar(250), nullable)
- `userTel`: 대표전화 (varchar(200), nullable)
- `userHp`: 휴대전화 (varchar(200), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `regDtm`: 등록일시 (datetime, default: CURRENT_TIMESTAMP)
- `stopDtm`: 활동정지일시 (datetime, nullable)
- `tenantId`: 테넌트 ID (int, default: 1)
 - `tokenVersion`: 토큰 버전 (INT, default: 0) — 서버에서 발급한 액세스 토큰에 포함되는 `tokenVersion` 값과 일치해야만 토큰이 유효합니다. 로그아웃-전체(`logout-all`) 시 이 값을 증가시켜 기존 액세스 토큰을 즉시 무효화합니다.

#### 인덱스
- UNIQUE: `[user_seq, tenant_id]`
- UNIQUE: `[tenant_id, user_id]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계

---

### Role (역할)
**파일**: `src/modules/iam/entities/role.entity.ts`  
**테이블**: `roles`

#### 주요 속성
- `roleId` (PK): 역할 ID (int, AUTO_INCREMENT)
- `roleName`: 역할명 (varchar(100))
- `displayName`: 표시명 (varchar(100), nullable)
- `description`: 설명 (text, nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)
- `tenantId`: 테넌트 ID (int, default: 1)

#### 인덱스
- UNIQUE: `[tenant_id, role_name]`
- UNIQUE: `[role_id, tenant_id]`
- INDEX: `[tenant_id]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계

---

### Action (액션)
**파일**: `src/modules/iam/entities/action.entity.ts`  
**테이블**: `actions`

#### 주요 속성
- `actionId` (PK): 액션 ID (int, AUTO_INCREMENT)
- `actionName`: 액션명 (varchar(50))
- `displayName`: 표시명 (varchar(100), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[action_name]`

---

### Page (페이지)
**파일**: `src/modules/iam/entities/page.entity.ts`  
**테이블**: `pages`

#### 주요 속성
- `pageId` (PK): 페이지 ID (int, AUTO_INCREMENT)
- `parentId`: 부모 페이지 ID (int, nullable)
- `pageName`: 페이지명 (varchar(100))
- `path`: 경로 (varchar(255))
- `displayName`: 표시명 (varchar(100))
- `description`: 설명 (text, nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `sortOrder`: 정렬 순서 (tinyint, nullable)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[page_name]`
- INDEX: `[parent_id]`

#### 관계
- `parent` (ManyToOne → Page): 부모 페이지 (self-referencing)

---

### Permission (권한)
**파일**: `src/modules/iam/entities/permission.entity.ts`  
**테이블**: `permissions`

#### 주요 속성
- `permissionId` (PK): 권한 ID (int, AUTO_INCREMENT)
- `pageId`: 페이지 ID (int)
- `actionId`: 액션 ID (int)
- `displayName`: 표시명 (varchar(100), nullable)
- `description`: 설명 (text, nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[page_id, action_id]`
- INDEX: `[action_id]`

#### 관계
- `page` (ManyToOne → Page): 페이지 관계
- `action` (ManyToOne → Action): 액션 관계

---

### RolePermission (역할-권한 조인)
**파일**: `src/modules/iam/entities/role-permission.entity.ts`  
**테이블**: `role_permissions`

#### 주요 속성
- `roleId` (PK): 역할 ID (int)
- `permissionId` (PK): 권한 ID (int)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 관계
- `role` (ManyToOne → Role): 역할 관계
- `permission` (ManyToOne → Permission): 권한 관계

---

### UserRole (사용자-역할 조인)
**파일**: `src/modules/iam/entities/user-role.entity.ts`  
**테이블**: `user_roles`

#### 주요 속성
- `userSeq` (PK): 사용자 일련번호 (int)
- `tenantId` (PK): 테넌트 ID (int)
- `roleId` (PK): 역할 ID (int)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- INDEX: `[user_seq, tenant_id]`
- INDEX: `[role_id, tenant_id]`

#### 관계
- `user` (ManyToOne → User): 사용자 관계 (복합 FK)
- `role` (ManyToOne → Role): 역할 관계 (복합 FK)

---

## Tenants 모듈

### Tenant (테넌트)
**파일**: `src/modules/tenants/entities/tenant.entity.ts`  
**테이블**: `tenants`

#### 주요 속성
- `tenantId` (PK): 테넌트 ID (int, AUTO_INCREMENT)
- `tenantName`: 테넌트명 (varchar(100))
- `displayName`: 표시명 (varchar(100), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)
- `domain`: 도메인 (varchar(200), nullable)

#### 인덱스
- UNIQUE: `[tenant_name]`

---

### TenantStatus (테넌트 상태)
**파일**: `src/modules/tenants/entities/tenant-status.entity.ts`  
**테이블**: `tenant_status`

#### 주요 속성
- `tenantStatusId` (PK): 테넌트 상태 ID (int, AUTO_INCREMENT)
- `tenantId`: 테넌트 ID (int)
- `statusGroup`: 상태 그룹 (varchar(50)) - 예: COUNSEL_TYPE, COUNSEL_STATUS
- `statusKey`: 상태 키 (varchar(50))
- `statusName`: 상태명 (varchar(100))
- `description`: 설명 (varchar(255), nullable)
- `color`: 상태 색상 HEX (varchar(7), nullable)
- `sortOrder`: 정렬 순서 (int, nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[tenant_id, status_group, status_key]`
- UNIQUE: `[tenant_id, tenant_status_id]`
- INDEX: `[tenant_id, status_group]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계

---

## Codes 모듈

### CodeGroup (코드 그룹)
**파일**: `src/modules/codes/entities/code-group.entity.ts`  
**테이블**: `code_groups`

#### 주요 속성
- `codeGroupId` (PK): 코드 그룹 ID (int, AUTO_INCREMENT)
- `codeGroupKey`: 코드 그룹 키 (varchar(50))
- `codeGroupName`: 코드 그룹명 (varchar(100))
- `description`: 설명 (varchar(255), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[code_group_key]`

---

### Code (코드)
**파일**: `src/modules/codes/entities/code.entity.ts`  
**테이블**: `codes`

#### 주요 속성
- `codeId` (PK): 코드 ID (int, AUTO_INCREMENT)
- `codeGroupId`: 코드 그룹 ID (int)
- `codeKey`: 코드 키 (varchar(50))
- `codeName`: 코드명 (varchar(100))
- `description`: 설명 (varchar(255), nullable)
- `sortOrder`: 정렬 순서 (int, nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[code_group_id, code_key]`
- INDEX: `[code_group_id]`

#### 관계
- `codeGroup` (ManyToOne → CodeGroup): 코드 그룹 관계

---

## Boards 모듈

### Board (게시판)
**파일**: `src/modules/boards/entities/board.entity.ts`  
**테이블**: `board`

#### 주요 속성
- `boardId` (PK): 게시판 ID (int, AUTO_INCREMENT)
- `tenantId`: 테넌트 ID (int)
- `boardKey`: 게시판 키 (varchar(64)) - 예: NOTICE, QNA
- `name`: 게시판명 (varchar(256))
- `description`: 설명 (varchar(255), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `sortOrder`: 정렬 순서 (int, nullable)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[tenant_id, board_key]`
- UNIQUE: `[board_id, tenant_id]`
- INDEX: `[tenant_id, is_active, sort_order]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계

---

### Post (게시물)
**파일**: `src/modules/boards/entities/post.entity.ts`  
**테이블**: `post`

#### 주요 속성
- `postId` (PK): 게시물 ID (int, AUTO_INCREMENT)
- `boardId`: 게시판 ID (int)
- `tenantId`: 테넌트 ID (int)
- `userSeq`: 작성자 일련번호 (int)
- `title`: 제목 (varchar(255))
- `content`: 내용 (longtext)
- `isNotice`: 공지 여부 (tinyint, default: 0)
- `isActive`: 노출 여부 (tinyint, default: 1)
- `deleteState`: 삭제 여부 (enum: 'Y'|'N', default: 'N')
- `startDtm`: 노출 시작일시 (datetime, nullable)
- `endDtm`: 노출 종료일시 (datetime, nullable)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)
- `deletedAt`: 삭제일시 (datetime, nullable)

#### 인덱스
- INDEX: `[board_id]`
- INDEX: `[tenant_id, is_active, is_notice, created_at]`
- INDEX: `[user_seq]`
- INDEX: `[board_id, tenant_id]`
- INDEX: `[user_seq, tenant_id]`

#### 관계
- `board` (ManyToOne → Board): 게시판 관계 (복합 FK)
- `tenant` (ManyToOne → Tenant): 테넌트 관계
- `user` (ManyToOne → User): 작성자 관계 (복합 FK)

#### Enum
```typescript
export enum DeleteState {
  Y = 'Y',
  N = 'N',
}
```

---

## Counsel 모듈

### Counsel (상담)
**파일**: `src/modules/counsel/entities/counsel.entity.ts`  
**테이블**: `counsel`

#### 주요 속성
- `counselSeq` (PK): 상담 일련번호 (bigint, AUTO_INCREMENT)
- `webCode`: 웹사이트 코드 (varchar(20))
- `tenantId`: 테넌트 ID (int)
- `name`: 신청자명 (varchar(50), nullable)
- `counselHp`: 신청인 휴대전화 (varchar(50))
- `counselIp`: 신청인 IP (varchar(50))
- `counselStat`: 상담 상태 (int) - tenant_status_id 참조
- `empSeq`: 담당자 일련번호 (int, nullable)
- `counselSource`: 소스 (varchar(50), nullable)
- `counselMedium`: 미듐 (varchar(50), nullable)
- `counselCampaign`: 캠페인 (varchar(50), nullable)
- `counselResvDtm`: 방문 예약일시 (datetime, nullable)
- `counselMemo`: 메모 (tinytext, nullable)
- `regDtm`: 등록일시 (datetime, default: CURRENT_TIMESTAMP)
- `editDtm`: 수정일시 (datetime, default: CURRENT_TIMESTAMP, onUpdate)
- `duplicateState`: 확인 여부 (char(1), default: 'N')
- `deleteState`: 삭제 여부 (enum: 'Y'|'N', default: 'N')

#### 인덱스
- UNIQUE: `[counsel_seq, tenant_id]`
- INDEX: `[emp_seq]`
- INDEX: `[web_code]`
- INDEX: `[counsel_stat]`
- INDEX: `[web_code, tenant_id]`
- INDEX: `[tenant_id, counsel_stat]`

#### 관계
- `website` (ManyToOne → Website): 웹사이트 관계 (복합 FK)
- `status` (ManyToOne → TenantStatus): 상태 관계 (복합 FK)
- `employee` (ManyToOne → User): 담당자 관계

#### Enum
```typescript
export enum DeleteState {
  Y = 'Y',
  N = 'N',
}
```

---

### CounselFieldDef (상담 필드 정의)
**파일**: `src/modules/counsel/entities/counsel-field-def.entity.ts`  
**테이블**: `counsel_field_def`

#### 주요 속성
- `fieldId` (PK): 필드 정의 ID (bigint, AUTO_INCREMENT)
- `tenantId`: 테넌트 ID (int)
- `fieldKey`: 필드 키 (varchar(64)) - 예: desired_time, product
- `label`: 라벨 (varchar(100))
- `fieldType`: 타입 (varchar(20)) - text, textarea, number, date, datetime, select, multiselect, checkbox, radio, email, phone, url
- `isRequired`: 필수 여부 (tinyint, default: 0)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `sortOrder`: 정렬 순서 (int, nullable)
- `placeholder`: 플레이스홀더 (varchar(150), nullable)
- `helpText`: 도움말 (varchar(255), nullable)
- `defaultValue`: 기본값 (varchar(255), nullable)
- `optionsJson`: 선택형 옵션 JSON (longtext, nullable) - JSON transformer 적용
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[tenant_id, field_key]`
- UNIQUE: `[field_id, tenant_id]`
- INDEX: `[tenant_id, is_active, sort_order]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계

#### 특수 처리
- `optionsJson`: JSON 컬럼은 transformer로 자동 변환
  ```typescript
  transformer: {
    to: (value: Record<string, any> | null) => value ? JSON.stringify(value) : null,
    from: (value: string | null) => (value ? JSON.parse(value) : null),
  }
  ```

---

### CounselFieldValue (상담 필드 값)
**파일**: `src/modules/counsel/entities/counsel-field-value.entity.ts`  
**테이블**: `counsel_field_value`

#### 주요 속성
- `counselSeq` (PK): 상담 PK (bigint)
- `tenantId` (PK): 테넌트 ID (int)
- `fieldId` (PK): 필드 정의 PK (bigint)
- `valueText`: 값(문자열) (text, nullable)
- `valueNumber`: 값(숫자형) (decimal(20,6), nullable)
- `valueDate`: 값(날짜형) (date, nullable)
- `valueDatetime`: 값(일시형) (datetime, nullable)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- INDEX: `[field_id]`
- INDEX: `[value_text]` (prefix: 100)
- INDEX: `[counsel_seq, tenant_id]`
- INDEX: `[field_id, tenant_id]`

#### 관계
- `counsel` (ManyToOne → Counsel): 상담 관계 (복합 FK)
- `fieldDef` (ManyToOne → CounselFieldDef): 필드 정의 관계 (복합 FK)

---

### CounselLog (상담 로그)
**파일**: `src/modules/counsel/entities/counsel-log.entity.ts`  
**테이블**: `counsel_log`

#### 주요 속성
- `counselSeq` (PK): 상담 PK (bigint)
- `tenantId` (PK): 테넌트 ID (int)
- `logNo` (PK): 로그 번호 (int)
- `counselStat`: 상담 상태 (int)
- `regDtm`: 등록일시 (datetime, default: CURRENT_TIMESTAMP)

#### 인덱스
- INDEX: `[counsel_stat]`
- INDEX: `[tenant_id, counsel_stat]`
- INDEX: `[counsel_seq, tenant_id]`

#### 관계
- `counsel` (ManyToOne → Counsel): 상담 관계 (복합 FK)
- `status` (ManyToOne → TenantStatus): 상태 관계 (복합 FK)

---

### CounselMemoLog (상담 메모 로그)
**파일**: `src/modules/counsel/entities/counsel-memo-log.entity.ts`  
**테이블**: `counsel_memo_log`

#### 주요 속성
- `memoLogId` (PK): 메모 로그 ID (bigint, AUTO_INCREMENT)
- `counselSeq`: 상담 PK (bigint)
- `tenantId`: 테넌트 ID (int)
- `statusId`: 메모 당시 상담상태 (int)
- `memoText`: 메모 내용 (text)
- `createdBy`: 작성자 user_seq (int, nullable)
- `createdAt`: 작성일시 (datetime, default: CURRENT_TIMESTAMP)
- `isDeleted`: 삭제 여부 (tinyint, default: 0)
- `deletedAt`: 삭제일시 (datetime, nullable)
- `deletedBy`: 삭제자 user_seq (int, nullable)

#### 인덱스
- INDEX: `[counsel_seq, created_at]`
- INDEX: `[status_id]`
- INDEX: `[created_by]`
- INDEX: `[deleted_by]`
- INDEX: `[tenant_id, status_id]`
- INDEX: `[counsel_seq, tenant_id]`

#### 관계
- `counsel` (ManyToOne → Counsel): 상담 관계 (복합 FK)
- `status` (ManyToOne → TenantStatus): 상태 관계 (복합 FK)
- `creator` (ManyToOne → User): 작성자 관계
- `deleter` (ManyToOne → User): 삭제자 관계

---

## Security 모듈

### BlockHp (차단 연락처)
**파일**: `src/modules/security/entities/block-hp.entity.ts`  
**테이블**: `block_hp`

#### 주요 속성
- `dbhIdx` (PK): 차단 연락처 PK (bigint, AUTO_INCREMENT)
- `tenantId`: 테넌트 ID (int)
- `blockHp`: 차단 연락처 (varchar(20))
- `reason`: 차단 사유 (varchar(255), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdBy`: 등록자 user_seq (int, nullable)
- `createdAt`: 등록일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[tenant_id, block_hp]`
- INDEX: `[tenant_id, is_active]`
- INDEX: `[block_hp]`
- INDEX: `[created_by]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계
- `creator` (ManyToOne → User): 등록자 관계

---

### BlockIp (차단 IP)
**파일**: `src/modules/security/entities/block-ip.entity.ts`  
**테이블**: `block_ip`

#### 주요 속성
- `dbiIdx` (PK): 차단 IP PK (bigint, AUTO_INCREMENT)
- `tenantId`: 테넌트 ID (int)
- `blockIp`: 차단 IP (varchar(45)) - IPv4/IPv6
- `reason`: 차단 사유 (varchar(255), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdBy`: 등록자 user_seq (int, nullable)
- `createdAt`: 등록일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[tenant_id, block_ip]`
- INDEX: `[tenant_id, is_active]`
- INDEX: `[block_ip]`
- INDEX: `[created_by]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계
- `creator` (ManyToOne → User): 등록자 관계

---

### BlockWord (차단 키워드)
**파일**: `src/modules/security/entities/block-word.entity.ts`  
**테이블**: `block_word`

#### 주요 속성
- `dbwIdx` (PK): 차단 키워드 PK (bigint, AUTO_INCREMENT)
- `tenantId`: 테넌트 ID (int)
- `blockWord`: 차단 키워드 (varchar(100))
- `matchType`: 매칭 방식 (varchar(10), default: 'CONTAINS')
- `reason`: 차단 사유 (varchar(255), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `createdBy`: 등록자 user_seq (int, nullable)
- `createdAt`: 등록일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)

#### 인덱스
- UNIQUE: `[tenant_id, block_word, match_type]`
- INDEX: `[tenant_id, is_active]`
- INDEX: `[block_word]`
- INDEX: `[created_by]`

#### 관계
- `tenant` (ManyToOne → Tenant): 테넌트 관계
- `creator` (ManyToOne → User): 등록자 관계

#### Enum
```typescript
export enum MatchType {
  EXACT = 'EXACT',
  CONTAINS = 'CONTAINS',
  REGEX = 'REGEX',
}
```

---

## Websites 모듈

### Website (웹사이트)
**파일**: `src/modules/websites/entities/website.entity.ts`  
**테이블**: `websites`

#### 주요 속성
- `webCode` (PK): 웹사이트 코드 (varchar(20))
- `userSeq`: 광고주 일련번호 (int)
- `webUrl`: 웹사이트 URL (varchar(50))
- `webTitle`: 웹사이트 제목 (varchar(255), nullable)
- `webImg`: 웹사이트 이미지 (varchar(150), nullable)
- `webDesc`: 웹사이트 설명 (varchar(250), nullable)
- `webMemo`: 웹사이트 메모 (varchar(250), nullable)
- `isActive`: 활성 여부 (tinyint, default: 1)
- `duplicateAllowAfterDays`: 중복 허용 일수 (int, default: 30)
- `createdAt`: 생성일시 (datetime, auto)
- `updatedAt`: 수정일시 (datetime, auto)
- `tenantId`: 테넌트 ID (int)

#### 인덱스
- UNIQUE: `[web_code, tenant_id]`
- INDEX: `[tenant_id]`
- INDEX: `[user_seq, tenant_id]`

#### 관계
- `user` (ManyToOne → User): 사용자 관계 (복합 FK)
- `tenant` (ManyToOne → Tenant): 테넌트 관계

---

## 엔티티 관계도

```
Tenant (1) ──< (N) User
Tenant (1) ──< (N) Role
Tenant (1) ──< (N) TenantStatus
Tenant (1) ──< (N) Board
Tenant (1) ──< (N) Website
Tenant (1) ──< (N) Counsel
Tenant (1) ──< (N) CounselFieldDef
Tenant (1) ──< (N) BlockHp
Tenant (1) ──< (N) BlockIp
Tenant (1) ──< (N) BlockWord

User (1) ──< (N) UserRole
User (1) ──< (N) Website
User (1) ──< (N) Post
User (1) ──< (N) Counsel (emp_seq)
User (1) ──< (N) CounselMemoLog (created_by)
User (1) ──< (N) BlockHp (created_by)
User (1) ──< (N) BlockIp (created_by)
User (1) ──< (N) BlockWord (created_by)

Role (1) ──< (N) UserRole
Role (1) ──< (N) RolePermission

Page (1) ──< (N) Permission
Page (1) ──< (N) Page (parent)

Action (1) ──< (N) Permission

Permission (1) ──< (N) RolePermission

CodeGroup (1) ──< (N) Code

Board (1) ──< (N) Post

Website (1) ──< (N) Counsel

TenantStatus (1) ──< (N) Counsel
TenantStatus (1) ──< (N) CounselLog
TenantStatus (1) ──< (N) CounselMemoLog

Counsel (1) ──< (N) CounselFieldValue
Counsel (1) ──< (N) CounselLog
Counsel (1) ──< (N) CounselMemoLog

CounselFieldDef (1) ──< (N) CounselFieldValue
```

---

## 주요 특징

### 1. 테넌트 스코프
- 대부분의 엔티티가 `tenant_id`를 포함하여 멀티테넌트 지원
- 복합 외래키를 통한 테넌트 격리 보장

### 2. 타임스탬프 관리
- `created_at`/`updated_at`: `@CreateDateColumn`/`@UpdateDateColumn` 사용
- `reg_dtm`/`edit_dtm`: `@Column` + `default: () => 'CURRENT_TIMESTAMP'` 사용

### 3. Enum 타입
- `DeleteState`: 'Y'|'N' (Post, Counsel)
- `MatchType`: EXACT|CONTAINS|REGEX (BlockWord)

### 4. JSON 컬럼 처리
- `CounselFieldDef.optionsJson`: longtext + transformer로 JSON 자동 변환

### 5. 복합 외래키
- `@JoinColumns`를 사용하여 복합 FK 매핑
- 예: `[user_seq, tenant_id]`, `[web_code, tenant_id]`, `[tenant_id, tenant_status_id]`

### 6. 인덱스 전략
- UNIQUE 제약: 비즈니스 키 조합
- INDEX: 조회 성능 최적화를 위한 복합 인덱스

### 7. 소프트 삭제
- `delete_state` enum 또는 `is_deleted` tinyint 사용
- `deleted_at` 컬럼으로 삭제 시점 기록

### 8. 관계 설정
- `onDelete: 'CASCADE'`: 부모 삭제 시 자식 자동 삭제
- `onDelete: 'SET NULL'`: 부모 삭제 시 자식 FK를 NULL로 설정
- `onUpdate: 'CASCADE'`: 부모 업데이트 시 자식 FK 자동 업데이트

---

## 총 엔티티 개수

**총 22개 엔티티**

- IAM 모듈: 7개
- Tenants 모듈: 2개
- Codes 모듈: 2개
- Boards 모듈: 2개
- Counsel 모듈: 5개
- Security 모듈: 3개
- Websites 모듈: 1개

---

**문서 생성일**: 2026-01-13  
**프로젝트**: FlowDesk Admin  
**기술 스택**: NestJS + TypeORM + MySQL + TypeScript
