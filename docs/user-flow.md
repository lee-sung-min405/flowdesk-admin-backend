# 사용자 플로우: 회원가입부터 팀원 관리까지

> **FlowDesk Admin** 시스템의 사용자 여정을 설명하는 문서입니다.  
> 회원가입, 로그인, 팀원 관리 등 핵심 플로우를 다룹니다.

---

## 📋 목차

### Part 1. 사용자 플로우 (기본)
1. [전체 흐름 요약](#1-전체-흐름-요약)
2. [회원가입 플로우](#2-회원가입-플로우)
3. [로그인 플로우](#3-로그인-플로우)
4. [팀원 추가 플로우](#4-팀원-추가-플로우)
5. [팀원 로그인 플로우](#5-팀원-로그인-플로우)
6. [데이터 격리 및 보안](#6-데이터-격리-및-보안)
7. [API 요약](#7-api-요약)

### Part 2. 관리 플로우 (RBAC/역할/테넌트)
8. [역할 관리 플로우](#8-역할-관리-플로우)
9. [권한 관리 플로우](#9-권한-관리-플로우)
10. [테넌트 관리 플로우 (슈퍼 관리자 전용)](#10-테넌트-관리-플로우-슈퍼-관리자-전용)
11. [슈퍼 관리자 대시보드](#11-슈퍼-관리자-대시보드)
12. [관리 플로우 시나리오 종합](#12-관리-플로우-시나리오-종합)

---

## 1. 전체 흐름 요약

### 1.1 사용자 여정 개요

```mermaid
flowchart TB
    subgraph Phase1["1️⃣ 회원가입"]
        A1[신규 사용자] --> A2[회원가입 페이지]
        A2 --> A3[회사 + 관리자 정보 입력]
        A3 --> A4[POST /auth/signup]
        A4 --> A5[회사 & 관리자 계정 생성]
    end
    
    subgraph Phase2["2️⃣ 관리자 로그인"]
        B1[관리자] --> B2[로그인 페이지]
        B2 --> B3[POST /auth/login]
        B3 --> B4[액세스 토큰 발급]
    end
    
    subgraph Phase3["3️⃣ 팀원 추가"]
        C1[관리자] --> C2[사용자 관리 메뉴]
        C2 --> C3[팀원 정보 입력]
        C3 --> C4[POST /users]
        C4 --> C5[팀원 계정 생성]
    end
    
    subgraph Phase4["4️⃣ 팀원 로그인"]
        D1[팀원] --> D2[로그인 페이지]
        D2 --> D3[POST /auth/login]
        D3 --> D4[같은 회사 데이터 접근]
    end
    
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    
    style Phase1 fill:#e1f5fe
    style Phase2 fill:#fff3e0
    style Phase3 fill:#e8f5e9
    style Phase4 fill:#fce4ec
```

### 1.2 주요 역할

| 역할 | 설명 | 주요 권한 |
|------|------|----------|
| **신규 사용자** | 시스템에 처음 가입하는 사람 | 없음 (Public API만 사용) |
| **관리자** | 회원가입 시 자동 생성되는 첫 번째 사용자 | 모든 권한 (users.*, roles.*, etc.) |
| **팀원** | 관리자가 추가한 일반 사용자 | 역할에 따른 권한 |

---

## 2. 회원가입 플로우

### 2.1 시나리오

> **김철수** 대표가 "마케팅솔루션" 회사를 위해 CRM을 시작하려고 합니다.

### 2.2 사용자 화면 흐름

```mermaid
flowchart LR
    subgraph User["👤 사용자 (김철수)"]
        U1[회원가입 페이지 접속]
        U2[정보 입력]
        U3[가입하기 클릭]
        U4[가입 완료 확인]
    end
    
    subgraph Form["📝 입력 정보"]
        F1["회사명: 마케팅솔루션"]
        F2["이름: 김철수"]
        F3["이메일: ceo@marketing.com"]
        F4["휴대폰: 010-1234-5678"]
        F5["비밀번호: MyPass123!"]
    end
    
    U1 --> U2
    U2 --> Form
    Form --> U3
    U3 --> U4
```

### 2.3 시스템 처리 상세

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 클라이언트
    participant API as 🌐 POST /auth/signup
    participant Service as ⚙️ AuthService
    participant DB as 🗄️ Database
    
    Client->>API: 회원가입 요청
    Note over Client,API: {<br/>  companyName: "마케팅솔루션",<br/>  adminName: "김철수",<br/>  email: "ceo@marketing.com",<br/>  phone: "010-1234-5678",<br/>  password: "MyPass123!"<br/>}
    
    API->>Service: signup(dto)
    
    rect rgb(255, 245, 238)
        Note over Service,DB: 🔍 검증 단계
        Service->>DB: 이메일 중복 체크
        DB-->>Service: 결과 (없음 ✅)
        Service->>DB: 회사명 중복 체크
        DB-->>Service: 결과 (없음 ✅)
    end
    
    rect rgb(232, 245, 233)
        Note over Service,DB: ✨ 생성 단계 (Transaction)
        Service->>DB: INSERT INTO tenants
        Note over DB: 🏢 Tenant 생성<br/>ID: 1<br/>Name: "마케팅솔루션"
        DB-->>Service: tenantId = 1
        
        Service->>Service: bcrypt.hash(password)
        Service->>DB: INSERT INTO users
        Note over DB: 👤 User 생성<br/>ID: "ceo@marketing.com"<br/>tenantId: 1
        DB-->>Service: userSeq = 1
    end
    
    Service-->>API: SignupResponseDto
    API-->>Client: 201 Created
    Note over Client,API: ✅ 회원가입 완료!
```

### 2.4 API 상세

#### Request

```http
POST /auth/signup
Content-Type: application/json

{
  "companyName": "마케팅솔루션",
  "adminName": "김철수",
  "email": "ceo@marketing.com",
  "phone": "010-1234-5678",
  "password": "MyPass123!"
}
```

#### Response (성공)

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "회원가입이 완료되었습니다.",
  "tenant": {
    "tenantId": 1,
    "tenantName": "마케팅솔루션"
  },
  "admin": {
    "userSeq": 1,
    "userId": "ceo@marketing.com",
    "userName": "김철수"
  }
}
```

#### Response (에러)

```mermaid
flowchart TB
    subgraph Errors["❌ 에러 응답"]
        E1["409 BIZ001<br/>이미 사용 중인 이메일입니다."]
        E2["409 BIZ001<br/>이미 사용 중인 회사명입니다."]
        E3["400 VAL001<br/>비밀번호는 영문, 숫자, 특수문자를<br/>각각 최소 1개 이상 포함해야 합니다."]
    end
```

### 2.5 생성되는 데이터

```mermaid
erDiagram
    TENANTS {
        int tenant_id PK "1"
        string tenant_name "마케팅솔루션"
        string display_name "마케팅솔루션"
        int is_active "1"
        datetime created_at "2026-01-20"
    }
    
    USERS {
        int user_seq PK "1"
        int tenant_id FK "1"
        string user_id "ceo@marketing.com"
        string user_name "김철수"
        string corp_name "마케팅솔루션"
        string user_email "ceo@marketing.com"
        string user_hp "010-1234-5678"
        string user_pwd "bcrypt_hash"
        int is_active "1"
        int token_version "0"
    }
    
    TENANTS ||--o{ USERS : "has"
```

---

## 3. 로그인 플로우

### 3.1 시나리오

> **김철수**가 방금 가입한 계정으로 로그인합니다.

### 3.2 시스템 처리 상세

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 클라이언트
    participant API as 🌐 POST /auth/login
    participant Service as ⚙️ AuthService
    participant DB as 🗄️ Database
    participant JWT as 🔐 JWT Service
    
    Client->>API: 로그인 요청
    Note over Client,API: {<br/>  tenantName: "마케팅솔루션",<br/>  userId: "ceo@marketing.com",<br/>  password: "MyPass123!"<br/>}
    
    API->>Service: login(dto)
    
    rect rgb(255, 245, 238)
        Note over Service,DB: 🔍 인증 단계
        Service->>DB: SELECT tenant
        DB-->>Service: tenant (tenantId: 1) ✅
        
        Service->>DB: SELECT user WHERE tenant_id AND user_id
        DB-->>Service: user (userSeq: 1) ✅
        
        Service->>Service: bcrypt.compare(password, hash)
        Note over Service: 비밀번호 일치 ✅
        
        Service->>DB: SELECT user permissions
        DB-->>Service: permissions ✅
    end
    
    rect rgb(232, 245, 233)
        Note over Service,JWT: 🎟️ 토큰 발급
        Service->>JWT: sign(payload)
        JWT-->>Service: accessToken
        
        Service->>DB: INSERT refresh_token
        DB-->>Service: refreshToken
    end
    
    Service-->>API: LoginResponseDto
    API-->>Client: 200 OK
    Note over Client,API: ✅ 로그인 성공!<br/>accessToken + refreshToken
```

### 3.3 토큰에 포함되는 정보

```mermaid
flowchart LR
    subgraph AccessToken["🔐 Access Token (JWT)"]
        A1["sub: 1 (userSeq)"]
        A2["tenantName: 마케팅솔루션"]
        A3["userId: ceo@marketing.com"]
        A4["tokenVersion: 0"]
        A5["exp: 1시간 후"]
    end
    
    subgraph RefreshToken["🔄 Refresh Token"]
        R1["tokenId: uuid"]
        R2["secret: random_hash"]
        R3["userSeq: 1"]
        R4["expiresAt: 7일 후"]
    end
```

### 3.4 API 상세

#### Request

```http
POST /auth/login
Content-Type: application/json

{
  "tenantName": "마케팅솔루션",
  "userId": "ceo@marketing.com",
  "password": "MyPass123!"
}
```

#### Response (성공)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "3600s",
  "refreshToken": "abc123-uuid.randomsecret",
  "refreshExpiresAt": "2026-01-27T10:00:00.000Z",
  "user": {
    "userSeq": 1,
    "userId": "ceo@marketing.com",
    "userName": "김철수",
    "tenantId": 1,
    "tenantName": "마케팅솔루션"
  }
}
```

---

## 4. 팀원 추가 플로우

### 4.1 시나리오

> **김철수** (관리자)가 직원 **박영희**를 마케팅 담당자로 추가합니다.

### 4.2 전체 흐름

```mermaid
flowchart TB
    subgraph Admin["👤 관리자 (김철수)"]
        A1[사용자 관리 메뉴]
        A2[팀원 추가 클릭]
        A3[정보 입력]
        A4[추가하기 클릭]
    end
    
    subgraph System["⚙️ 시스템"]
        S1{JWT 검증}
        S2{권한 확인<br/>users.create}
        S3{중복 체크}
        S4[계정 생성]
    end
    
    subgraph Result["✅ 결과"]
        R1[박영희 계정 생성]
        R2[같은 tenantId 자동 설정]
        R3[로그인 정보 전달]
    end
    
    A1 --> A2 --> A3 --> A4
    A4 --> S1
    S1 -->|✅ 유효| S2
    S1 -->|❌ 만료/위조| E1[401 AUTH001]
    S2 -->|✅ 권한 있음| S3
    S2 -->|❌ 권한 없음| E2[403 AUTH101]
    S3 -->|✅ 중복 없음| S4
    S3 -->|❌ ID 중복| E3[409 BIZ001]
    S4 --> R1 --> R2 --> R3
    
    style E1 fill:#ffcdd2
    style E2 fill:#ffcdd2
    style E3 fill:#ffcdd2
```

### 4.3 시스템 처리 상세

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 관리자 (김철수)
    participant API as 🌐 POST /users
    participant JWTGuard as 🔐 JWT Guard
    participant PermGuard as 🛡️ Permission Guard
    participant Service as ⚙️ UsersService
    participant DB as 🗄️ Database
    
    Client->>API: 팀원 추가 요청
    Note over Client,API: Authorization: Bearer {token}<br/>{<br/>  userId: "park.younghee",<br/>  password: "Welcome123!",<br/>  userName: "박영희",<br/>  ...<br/>}
    
    rect rgb(255, 248, 225)
        Note over API,JWTGuard: 1️⃣ JWT 인증
        API->>JWTGuard: JWT 검증
        JWTGuard->>DB: SELECT user + permissions
        DB-->>JWTGuard: user (userSeq=1, tenantId=1)
        JWTGuard-->>API: request.user 설정 ✅
    end
    
    rect rgb(225, 245, 254)
        Note over API,PermGuard: 2️⃣ 권한 검증
        API->>PermGuard: @RequireAuth('users', 'create')
        PermGuard->>PermGuard: users.create 권한 확인
        PermGuard-->>API: ✅ 권한 있음
    end
    
    rect rgb(232, 245, 233)
        Note over API,Service: 3️⃣ 사용자 생성
        API->>Service: create(tenantId=1, dto)
        Service->>DB: 중복 체크 (tenant_id + user_id)
        DB-->>Service: 없음 ✅
        
        Service->>Service: bcrypt.hash(password)
        Service->>DB: INSERT INTO users
        Note over DB: 👤 User 생성<br/>userSeq: 2<br/>tenantId: 1 (자동!)
        DB-->>Service: savedUser
    end
    
    Service-->>API: UserDetailDto
    API-->>Client: 201 Created
    Note over Client,API: ✅ 팀원 추가 완료!
```

### 4.4 핵심 포인트: Tenant 자동 설정

```mermaid
flowchart LR
    subgraph JWT["🔐 JWT 토큰"]
        J1["userSeq: 1"]
        J2["tenantId: 1"]
    end
    
    subgraph Request["📝 요청"]
        R1["userId: park.younghee"]
        R2["userName: 박영희"]
        R3["❌ tenantId 없음"]
    end
    
    subgraph Created["✅ 생성된 사용자"]
        C1["userSeq: 2"]
        C2["userId: park.younghee"]
        C3["tenantId: 1 ← 자동!"]
    end
    
    JWT --> |"request.user.tenantId"| Created
    Request --> Created
```

> **Tenant 격리**: 관리자는 자신의 회사에만 팀원을 추가할 수 있습니다.  
> tenantId는 요청 Body가 아닌 JWT 토큰에서 자동으로 추출됩니다.

### 4.5 API 상세

#### Request

```http
POST /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "userId": "park.younghee",
  "password": "Welcome123!",
  "corpName": "마케팅솔루션",
  "userName": "박영희",
  "userEmail": "park@marketing.com",
  "userHp": "010-9876-5432"
}
```

#### Response (성공)

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "userSeq": 2,
  "userId": "park.younghee",
  "corpName": "마케팅솔루션",
  "userName": "박영희",
  "userEmail": "park@marketing.com",
  "userHp": "010-9876-5432",
  "isActive": 1,
  "tokenVersion": 0,
  "regDtm": "2026-01-20T10:30:00.000Z",
  "stopDtm": null,
  "tenantId": 1
}
```

---

## 5. 팀원 로그인 플로우

### 5.1 시나리오

> **박영희**가 전달받은 로그인 정보로 시스템에 접속합니다.

### 5.2 시스템 처리

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 박영희
    participant API as 🌐 POST /auth/login
    participant Service as ⚙️ AuthService
    participant DB as 🗄️ Database
    
    Client->>API: 로그인 요청
    Note over Client,API: {<br/>  tenantName: "마케팅솔루션",<br/>  userId: "park.younghee",<br/>  password: "Welcome123!"<br/>}
    
    API->>Service: login(dto)
    
    Service->>DB: SELECT tenant
    DB-->>Service: tenant (tenantId: 1) ✅
    
    Service->>DB: SELECT user
    DB-->>Service: user (userSeq: 2) ✅
    
    Service->>Service: 비밀번호 검증 ✅
    
    Service->>DB: SELECT permissions
    Note over DB: 박영희의 권한 조회<br/>(역할에 따른 권한)
    DB-->>Service: permissions
    
    Service-->>API: LoginResponseDto
    API-->>Client: 200 OK
    Note over Client,API: ✅ 로그인 성공!<br/>김철수와 같은 tenantId=1<br/>→ 같은 회사 데이터 접근 가능
```

### 5.3 동일 회사 데이터 공유

```mermaid
flowchart TB
    subgraph Tenant1["🏢 마케팅솔루션 (Tenant #1)"]
        subgraph Users["👥 사용자"]
            U1["김철수<br/>(관리자)"]
            U2["박영희<br/>(팀원)"]
        end
        
        subgraph Data["📊 공유 데이터"]
            D1["고객 목록"]
            D2["상담 내역"]
            D3["게시판"]
        end
    end
    
    U1 --> Data
    U2 --> Data
    
    Note1["✅ 같은 tenantId = 같은 데이터 접근"]
    
    style Tenant1 fill:#e3f2fd
```

---

## 6. 데이터 격리 및 보안

### 6.1 Multi-Tenant 격리 구조

```mermaid
flowchart TB
    subgraph System["🌐 FlowDesk Admin 시스템"]
        subgraph TenantA["🏢 Tenant A: 마케팅솔루션"]
            A1["👤 김철수 (관리자)"]
            A2["👤 박영희 (팀원)"]
            A3["📊 고객 100건"]
            A4["💬 상담 500건"]
        end
        
        subgraph TenantB["🏢 Tenant B: 테크스타트업"]
            B1["👤 이민수 (관리자)"]
            B2["👤 최지훈 (팀원)"]
            B3["📊 고객 50건"]
            B4["💬 상담 200건"]
        end
    end
    
    Wall["🔒 데이터 격리 벽"]
    
    TenantA -.->|"❌ 접근 불가"| TenantB
    TenantB -.->|"❌ 접근 불가"| TenantA
    
    style Wall fill:#ff5722,color:#fff
```

### 6.2 격리 구현 방식

```mermaid
flowchart LR
    subgraph Request["📥 API 요청"]
        R1["GET /customers"]
        R2["Authorization: Bearer {token}"]
    end
    
    subgraph JWT["🔐 JWT 추출"]
        J1["tenantId: 1"]
        J2["userSeq: 1"]
    end
    
    subgraph Query["🗄️ DB 쿼리"]
        Q1["SELECT * FROM customers<br/>WHERE tenant_id = 1"]
    end
    
    subgraph Result["📤 응답"]
        RS1["마케팅솔루션의<br/>고객만 반환"]
    end
    
    Request --> JWT --> Query --> Result
```

### 6.3 보안 체크리스트

| 항목 | 구현 방식 | 상태 |
|------|-----------|------|
| **비밀번호 저장** | bcrypt hash (salt rounds: 10) | ✅ |
| **Tenant 격리** | JWT에서 tenantId 추출 후 쿼리 필터링 | ✅ |
| **권한 검증** | PermissionGuard + @RequireAuth | ✅ |
| **중복 방지** | DB 유니크 제약 + 사전 체크 | ✅ |
| **Transaction** | 회원가입 시 원자성 보장 | ✅ |
| **에러 메시지** | 내부/외부 메시지 분리 | ✅ |
| **토큰 무효화** | tokenVersion 증가 → 즉시 무효화 | ✅ |

---

## 7. API 요약

### 7.1 인증 관련 API

| 엔드포인트 | 메서드 | 설명 | 인증 | 권한 |
|-----------|--------|------|------|------|
| `/auth/signup` | POST | 회원가입 (회사 + 관리자) | ❌ | ❌ |
| `/auth/login` | POST | 로그인 | ❌ | ❌ |
| `/auth/refresh` | POST | 토큰 갱신 | ❌ | ❌ |
| `/auth/logout` | POST | 로그아웃 (단일 토큰) | ✅ | ❌ |
| `/auth/logout-all` | POST | 전체 로그아웃 | ✅ | ❌ |
| `/auth/me` | GET | 내 정보 + 권한 조회 | ✅ | ❌ |

### 7.2 사용자 관리 API

| 엔드포인트 | 메서드 | 설명 | 인증 | 권한 |
|-----------|--------|------|------|------|
| `/users` | GET | 사용자 목록 조회 | ✅ | `users.read` |
| `/users/:userSeq` | GET | 사용자 상세 조회 | ✅ | `users.read` |
| `/users` | POST | 사용자 생성 | ✅ | `users.create` |
| `/users/:userSeq` | PATCH | 사용자 정보 수정 | ✅ | `users.update` |
| `/users/:userSeq/status` | PATCH | 활성/정지 상태 변경 | ✅ | `users.update` |
| `/users/:userSeq/password` | PATCH | 비밀번호 변경 | ✅ | `users.update` |
| `/users/:userSeq/invalidate-tokens` | POST | 강제 로그아웃 | ✅ | `users.update` |

### 7.3 에러 코드

```mermaid
flowchart TB
    subgraph ErrorCodes["📋 에러 코드"]
        AUTH["🔐 인증/인가"]
        VAL["✅ 유효성"]
        BIZ["💼 비즈니스"]
        RES["📦 리소스"]
        SYS["⚙️ 시스템"]
    end
    
    AUTH --> AUTH001["AUTH001 (401)<br/>인증 실패"]
    AUTH --> AUTH101["AUTH101 (403)<br/>권한 없음"]
    
    VAL --> VAL001["VAL001 (400)<br/>유효성 검사 실패"]
    
    BIZ --> BIZ001["BIZ001 (409)<br/>중복 데이터"]
    
    RES --> RES001["RES001 (404)<br/>리소스 없음"]
    
    SYS --> SYS001["SYS001 (500)<br/>시스템 오류"]
```

---

---

# Part 2. 관리 플로우 (RBAC/역할/테넌트)

> **Part 2**에서는 시스템 관리자 수준의 역할 관리, 권한 설정, 테넌트 관리 등  
> 고급 관리 기능에 대한 플로우를 설명합니다.

---

## 8. 역할 관리 플로우

### 8.1 역할 관리 개요

```mermaid
flowchart TB
    subgraph RoleManagement["🎭 역할 관리 (Roles Module)"]
        direction TB
        R1["역할 목록 조회"]
        R2["역할 생성"]
        R3["역할 수정"]
        R4["역할 삭제"]
        R5["역할에 권한 할당"]
        R6["역할에 사용자 조회"]
    end
    
    Admin["👤 관리자<br/>(roles.* 권한)"] --> RoleManagement
    
    style RoleManagement fill:#e8f5e9
```

### 8.2 역할 CRUD 플로우

#### 8.2.1 역할 목록 조회

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 관리자
    participant API as 🌐 GET /roles
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ RolesService
    participant DB as 🗄️ Database
    
    Client->>API: 역할 목록 조회 요청
    Note over Client,API: Authorization: Bearer {token}
    
    API->>Guard: @RequireAuth('roles', 'read')
    Guard->>Guard: JWT에서 tenantId 추출
    Guard-->>API: ✅ 권한 확인
    
    API->>Service: findAll(tenantId)
    Service->>DB: SELECT * FROM roles<br/>WHERE tenant_id = {tenantId}
    Note over DB: 🔒 Tenant 격리<br/>해당 회사의 역할만 조회
    DB-->>Service: roles[]
    
    Service-->>API: RoleDto[]
    API-->>Client: 200 OK
```

#### Request

```http
GET /roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Response

```json
[
  {
    "roleId": 1,
    "roleName": "관리자",
    "description": "모든 권한을 가진 관리자",
    "isActive": true,
    "isDefault": true,
    "tenantId": 1
  },
  {
    "roleId": 2,
    "roleName": "상담원",
    "description": "상담 업무 담당자",
    "isActive": true,
    "isDefault": false,
    "tenantId": 1
  }
]
```

#### 8.2.2 역할 생성

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 관리자
    participant API as 🌐 POST /roles
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ RolesService
    participant DB as 🗄️ Database
    
    Client->>API: 역할 생성 요청
    Note over Client,API: {<br/>  roleName: "마케팅팀",<br/>  description: "마케팅 담당자 역할"<br/>}
    
    API->>Guard: @RequireAuth('roles', 'create')
    Guard-->>API: ✅ 권한 확인
    
    API->>Service: create(tenantId, dto)
    
    rect rgb(255, 245, 238)
        Note over Service,DB: 🔍 중복 검증
        Service->>DB: SELECT * FROM roles<br/>WHERE tenant_id = ? AND role_name = ?
        DB-->>Service: null (중복 없음) ✅
    end
    
    rect rgb(232, 245, 233)
        Note over Service,DB: ✨ 역할 생성
        Service->>DB: INSERT INTO roles
        DB-->>Service: savedRole
    end
    
    Service-->>API: RoleDto
    API-->>Client: 201 Created
```

#### Request

```http
POST /roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "roleName": "마케팅팀",
  "description": "마케팅 담당자 역할"
}
```

#### Response

```json
{
  "roleId": 3,
  "roleName": "마케팅팀",
  "description": "마케팅 담당자 역할",
  "isActive": true,
  "isDefault": false,
  "tenantId": 1
}
```

### 8.3 역할-권한 할당 플로우

#### 8.3.1 역할의 현재 권한 조회

```http
GET /roles/3/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Response

```json
{
  "roleId": 3,
  "roleName": "마케팅팀",
  "permissions": [
    {
      "permissionId": 5,
      "permissionName": "users.read",
      "description": "사용자 목록 조회"
    }
  ]
}
```

#### 8.3.2 역할에 권한 할당

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 관리자
    participant API as 🌐 POST /roles/:id/permissions
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ RolesService
    participant DB as 🗄️ Database
    
    Client->>API: 권한 할당 요청
    Note over Client,API: roleId: 3<br/>{<br/>  permissionIds: [5, 6, 7, 8]<br/>}
    
    API->>Guard: @RequireAuth('roles.permissions', 'update')
    Guard-->>API: ✅ 권한 확인
    
    API->>Service: assignPermissions(roleId, tenantId, permissionIds)
    
    rect rgb(255, 245, 238)
        Note over Service,DB: 🔍 역할 존재 확인
        Service->>DB: SELECT * FROM roles WHERE id = ?
        DB-->>Service: role ✅
    end
    
    rect rgb(232, 245, 233)
        Note over Service,DB: ✨ 권한 할당 (Transaction)
        Service->>DB: DELETE FROM role_permissions<br/>WHERE role_id = 3
        Service->>DB: INSERT INTO role_permissions<br/>(role_id, permission_id) VALUES (3, 5)...
        DB-->>Service: ✅ 완료
    end
    
    Service-->>API: { message, assignedCount }
    API-->>Client: 200 OK
```

#### Request

```http
POST /roles/3/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "permissionIds": [5, 6, 7, 8]
}
```

#### Response

```json
{
  "message": "권한이 역할에 성공적으로 할당되었습니다",
  "assignedCount": 4
}
```

### 8.4 역할-사용자 조회

```http
GET /roles/3/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Response

```json
{
  "roleId": 3,
  "roleName": "마케팅팀",
  "users": [
    {
      "userSeq": 5,
      "userId": "kim.marketing",
      "userName": "김마케팅"
    },
    {
      "userSeq": 8,
      "userId": "park.sns",
      "userName": "박SNS"
    }
  ]
}
```

### 8.5 역할 관리 API 요약

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/roles` | GET | 역할 목록 조회 | `roles.read` |
| `/roles/:id` | GET | 역할 상세 조회 | `roles.read` |
| `/roles` | POST | 역할 생성 | `roles.create` |
| `/roles/:id` | PATCH | 역할 수정 | `roles.update` |
| `/roles/:id/status` | PATCH | 역할 상태 변경 | `roles.update` |
| `/roles/:id` | DELETE | 역할 삭제 | `roles.delete` |
| `/roles/:id/permissions` | GET | 역할의 권한 조회 | `roles.read` |
| `/roles/:id/permissions` | POST | 역할에 권한 할당 | `roles.permissions.update` |
| `/roles/:id/users` | GET | 역할의 사용자 조회 | `roles.read` |

---

## 9. 권한 관리 플로우

### 9.1 RBAC 구조 개요

```mermaid
flowchart TB
    subgraph RBAC["🔐 RBAC 구조"]
        direction TB
        Page["📄 Page (페이지)<br/>예: users, roles, dashboard"]
        Action["⚡ Action (액션)<br/>예: read, create, update, delete"]
        Permission["🔑 Permission<br/>예: users.read, roles.create"]
        
        Page --> Permission
        Action --> Permission
    end
    
    subgraph Assignment["📋 권한 할당"]
        Role["🎭 Role (역할)"]
        User["👤 User (사용자)"]
        
        Permission --> Role
        Role --> User
    end
    
    Note1["Permission = Page + Action 조합"]
    
    style RBAC fill:#e3f2fd
    style Assignment fill:#fff3e0
```

### 9.2 권한 카탈로그 조회 (테넌트 관리자)

> 테넌트 관리자가 역할에 권한을 할당하기 위해 시스템에서 사용 가능한 권한 목록을 조회합니다.

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👤 테넌트 관리자
    participant API as 🌐 GET /permissions/catalog
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ PermissionsService
    participant DB as 🗄️ Database
    
    Client->>API: 권한 카탈로그 조회
    Note over Client,API: Authorization: Bearer {token}
    
    API->>Guard: @RequireAuth('permissions', 'read')
    Guard-->>API: ✅ 권한 확인
    
    API->>Service: getPermissionCatalog()
    
    rect rgb(232, 245, 233)
        Note over Service,DB: 📊 N+1 방지 최적화
        Service->>DB: SELECT pages (is_active = true)
        Service->>DB: SELECT actions (is_active = true)
        Service->>DB: SELECT permissions (is_active = true)
        DB-->>Service: pages, actions, permissions
    end
    
    Service->>Service: buildMatrix(pages, actions, permissions)
    
    Service-->>API: PermissionCatalogDto
    API-->>Client: 200 OK
```

#### Request

```http
GET /permissions/catalog
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Response

```json
{
  "pages": [
    { "pageId": 1, "pageName": "users", "description": "사용자 관리" },
    { "pageId": 2, "pageName": "roles", "description": "역할 관리" },
    { "pageId": 3, "pageName": "dashboard", "description": "대시보드" }
  ],
  "actions": [
    { "actionId": 1, "actionName": "read", "description": "조회" },
    { "actionId": 2, "actionName": "create", "description": "생성" },
    { "actionId": 3, "actionName": "update", "description": "수정" },
    { "actionId": 4, "actionName": "delete", "description": "삭제" }
  ],
  "permissions": [
    { "permissionId": 1, "permissionName": "users.read", "pageId": 1, "actionId": 1 },
    { "permissionId": 2, "permissionName": "users.create", "pageId": 1, "actionId": 2 },
    { "permissionId": 3, "permissionName": "roles.read", "pageId": 2, "actionId": 1 }
  ],
  "matrix": {
    "users": {
      "read": { "permissionId": 1, "exists": true },
      "create": { "permissionId": 2, "exists": true },
      "update": { "permissionId": null, "exists": false },
      "delete": { "permissionId": null, "exists": false }
    },
    "roles": {
      "read": { "permissionId": 3, "exists": true }
    }
  }
}
```

### 9.3 권한 관리자 API (슈퍼 관리자 전용)

> 슈퍼 관리자만 접근 가능한 시스템 권한 관리 API입니다.

#### 9.3.1 페이지 관리

```mermaid
flowchart LR
    subgraph PagesCRUD["📄 Pages 관리"]
        P1["GET /permissions/admin/pages<br/>페이지 목록 조회"]
        P2["GET /permissions/admin/pages/:id<br/>페이지 상세 조회"]
        P3["POST /permissions/admin/pages<br/>페이지 생성"]
        P4["PATCH /permissions/admin/pages/:id<br/>페이지 수정"]
        P5["PATCH /permissions/admin/pages/:id/status<br/>페이지 상태 변경"]
        P6["DELETE /permissions/admin/pages/:id<br/>페이지 삭제"]
    end
    
    SuperAdmin["👑 슈퍼 관리자<br/>(super.pages.* 권한)"] --> PagesCRUD
    
    style SuperAdmin fill:#ff9800
```

#### 페이지 생성 예시

```http
POST /permissions/admin/pages
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "pageName": "reports",
  "description": "보고서 관리",
  "displayName": "보고서",
  "sortOrder": 10
}
```

#### Response

```json
{
  "pageId": 10,
  "pageName": "reports",
  "description": "보고서 관리",
  "displayName": "보고서",
  "sortOrder": 10,
  "isActive": true
}
```

#### 9.3.2 액션 관리

```mermaid
flowchart LR
    subgraph ActionsCRUD["⚡ Actions 관리"]
        A1["GET /permissions/admin/actions<br/>액션 목록 조회"]
        A2["GET /permissions/admin/actions/:id<br/>액션 상세 조회"]
        A3["POST /permissions/admin/actions<br/>액션 생성"]
        A4["PATCH /permissions/admin/actions/:id<br/>액션 수정"]
        A5["PATCH /permissions/admin/actions/:id/status<br/>액션 상태 변경"]
        A6["DELETE /permissions/admin/actions/:id<br/>액션 삭제"]
    end
    
    SuperAdmin["👑 슈퍼 관리자<br/>(super.actions.* 권한)"] --> ActionsCRUD
    
    style SuperAdmin fill:#ff9800
```

#### 액션 생성 예시

```http
POST /permissions/admin/actions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "actionName": "export",
  "description": "내보내기",
  "sortOrder": 5
}
```

#### 9.3.3 권한 생성 (Page + Action 조합)

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👑 슈퍼 관리자
    participant API as 🌐 POST /permissions/admin/permissions
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ PermissionsAdminService
    participant DB as 🗄️ Database
    
    Client->>API: 권한 생성 요청
    Note over Client,API: {<br/>  pageId: 10,<br/>  actionId: 1,<br/>  description: "보고서 조회"<br/>}
    
    API->>Guard: @RequireAuth('super.permissions', 'create')
    Guard-->>API: ✅ 슈퍼 관리자 권한 확인
    
    API->>Service: createPermission(dto)
    
    rect rgb(255, 245, 238)
        Note over Service,DB: 🔍 검증
        Service->>DB: SELECT page WHERE id = 10
        DB-->>Service: page (reports) ✅
        Service->>DB: SELECT action WHERE id = 1
        DB-->>Service: action (read) ✅
    end
    
    rect rgb(232, 245, 233)
        Note over Service,DB: ✨ 권한 생성
        Service->>DB: INSERT INTO permissions
        Note over DB: permissionName = "reports.read"<br/>(자동 생성)
        DB-->>Service: permission
    end
    
    Service-->>API: PermissionDto
    API-->>Client: 201 Created
```

#### Request

```http
POST /permissions/admin/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "pageId": 10,
  "actionId": 1,
  "description": "보고서 조회"
}
```

#### Response

```json
{
  "permissionId": 25,
  "permissionName": "reports.read",
  "description": "보고서 조회",
  "pageId": 10,
  "actionId": 1,
  "isActive": true
}
```

### 9.4 권한 관리 API 요약

#### 일반 사용자 API

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/permissions/catalog` | GET | 권한 카탈로그 조회 | `permissions.read` |

#### 슈퍼 관리자 API (Pages)

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/permissions/admin/pages` | GET | 페이지 목록 조회 | `super.pages.read` |
| `/permissions/admin/pages/:id` | GET | 페이지 상세 조회 | `super.pages.read` |
| `/permissions/admin/pages` | POST | 페이지 생성 | `super.pages.create` |
| `/permissions/admin/pages/:id` | PATCH | 페이지 수정 | `super.pages.update` |
| `/permissions/admin/pages/:id/status` | PATCH | 페이지 상태 변경 | `super.pages.update` |
| `/permissions/admin/pages/:id` | DELETE | 페이지 삭제 | `super.pages.delete` |

#### 슈퍼 관리자 API (Actions)

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/permissions/admin/actions` | GET | 액션 목록 조회 | `super.actions.read` |
| `/permissions/admin/actions/:id` | GET | 액션 상세 조회 | `super.actions.read` |
| `/permissions/admin/actions` | POST | 액션 생성 | `super.actions.create` |
| `/permissions/admin/actions/:id` | PATCH | 액션 수정 | `super.actions.update` |
| `/permissions/admin/actions/:id/status` | PATCH | 액션 상태 변경 | `super.actions.update` |
| `/permissions/admin/actions/:id` | DELETE | 액션 삭제 | `super.actions.delete` |

#### 슈퍼 관리자 API (Permissions)

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/permissions/admin/permissions` | GET | 권한 목록 조회 | `super.permissions.read` |
| `/permissions/admin/permissions/:id` | GET | 권한 상세 조회 | `super.permissions.read` |
| `/permissions/admin/permissions` | POST | 권한 생성 | `super.permissions.create` |
| `/permissions/admin/permissions/:id` | PATCH | 권한 수정 | `super.permissions.update` |
| `/permissions/admin/permissions/:id/status` | PATCH | 권한 상태 변경 | `super.permissions.update` |
| `/permissions/admin/permissions/:id` | DELETE | 권한 삭제 | `super.permissions.delete` |

---

## 10. 테넌트 관리 플로우 (슈퍼 관리자 전용)

### 10.1 테넌트 관리 개요

> 슈퍼 관리자(tenantId=0)가 전체 시스템의 테넌트(회사)를 관리합니다.  
> 모든 Tenants API는 `super.tenants.*` 권한이 필요합니다.

```mermaid
flowchart TB
    subgraph TenantManagement["🏢 테넌트 관리"]
        T1["테넌트 목록 조회"]
        T2["테넌트 생성"]
        T3["테넌트 수정"]
        T4["테넌트 상태 변경<br/>(활성/비활성)"]
        T5["테넌트 삭제"]
    end
    
    SuperAdmin["👑 슈퍼 관리자<br/>(super.tenants.* 권한)"] --> TenantManagement
    
    style SuperAdmin fill:#ff9800
    style TenantManagement fill:#e8f5e9
```

### 10.2 테넌트 CRUD 플로우

#### 10.2.1 테넌트 목록 조회

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👑 슈퍼 관리자
    participant API as 🌐 GET /tenants
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ TenantsService
    participant DB as 🗄️ Database
    
    Client->>API: 테넌트 목록 조회
    Note over Client,API: Authorization: Bearer {token}
    
    API->>Guard: @RequireAuth('super.tenants', 'read')
    Guard-->>API: ✅ 슈퍼 관리자 권한 확인
    
    API->>Service: findAll()
    Service->>DB: SELECT * FROM tenants
    Note over DB: 모든 테넌트 조회<br/>(슈퍼 관리자만 가능)
    DB-->>Service: tenants[]
    
    Service-->>API: TenantDto[]
    API-->>Client: 200 OK
```

#### Request

```http
GET /tenants
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Response

```json
[
  {
    "tenantId": 1,
    "tenantName": "마케팅솔루션",
    "displayName": "마케팅솔루션",
    "isActive": true,
    "createdAt": "2026-01-20T10:00:00.000Z"
  },
  {
    "tenantId": 2,
    "tenantName": "테크스타트업",
    "displayName": "테크스타트업",
    "isActive": true,
    "createdAt": "2026-01-21T09:00:00.000Z"
  },
  {
    "tenantId": 3,
    "tenantName": "휴면회사",
    "displayName": "휴면회사",
    "isActive": false,
    "createdAt": "2025-06-15T08:00:00.000Z"
  }
]
```

#### 10.2.2 테넌트 생성

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👑 슈퍼 관리자
    participant API as 🌐 POST /tenants
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ TenantsService
    participant DB as 🗄️ Database
    
    Client->>API: 테넌트 생성 요청
    Note over Client,API: {<br/>  tenantName: "신규회사",<br/>  displayName: "신규회사 주식회사"<br/>}
    
    API->>Guard: @RequireAuth('super.tenants', 'create')
    Guard-->>API: ✅ 슈퍼 관리자 권한 확인
    
    API->>Service: create(dto)
    
    rect rgb(255, 245, 238)
        Note over Service,DB: 🔍 중복 검증
        Service->>DB: SELECT * FROM tenants<br/>WHERE tenant_name = '신규회사'
        DB-->>Service: null (중복 없음) ✅
    end
    
    rect rgb(232, 245, 233)
        Note over Service,DB: ✨ 테넌트 생성
        Service->>DB: INSERT INTO tenants
        DB-->>Service: savedTenant
    end
    
    Service-->>API: TenantDto
    API-->>Client: 201 Created
```

#### Request

```http
POST /tenants
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "tenantName": "신규회사",
  "displayName": "신규회사 주식회사"
}
```

#### Response

```json
{
  "tenantId": 4,
  "tenantName": "신규회사",
  "displayName": "신규회사 주식회사",
  "isActive": true,
  "createdAt": "2026-01-25T14:30:00.000Z"
}
```

#### 10.2.3 테넌트 상태 변경 (활성/비활성)

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👑 슈퍼 관리자
    participant API as 🌐 PATCH /tenants/:id/status
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ TenantsService
    participant DB as 🗄️ Database
    
    Client->>API: 테넌트 비활성화 요청
    Note over Client,API: tenantId: 3<br/>{ isActive: false }
    
    API->>Guard: @RequireAuth('super.tenants', 'update')
    Guard-->>API: ✅ 슈퍼 관리자 권한 확인
    
    API->>Service: updateStatus(id, isActive)
    
    rect rgb(232, 245, 233)
        Note over Service,DB: 🔄 상태 변경
        Service->>DB: UPDATE tenants<br/>SET is_active = false<br/>WHERE tenant_id = 3
        DB-->>Service: ✅ 완료
    end
    
    Note over Service: ⚠️ 비활성화된 테넌트의<br/>사용자는 로그인 불가
    
    Service-->>API: TenantDto
    API-->>Client: 200 OK
```

### 10.3 테넌트 비활성화 시 영향

```mermaid
flowchart TB
    subgraph Deactivated["🚫 비활성화된 테넌트"]
        T1["tenant_id: 3<br/>is_active: false"]
    end
    
    subgraph Impact["⚠️ 영향"]
        I1["❌ 해당 테넌트 사용자 로그인 불가"]
        I2["❌ 기존 액세스 토큰 무효화"]
        I3["✅ 데이터는 유지됨"]
        I4["✅ 재활성화 시 복구 가능"]
    end
    
    Deactivated --> Impact
    
    style Deactivated fill:#ffcdd2
```

### 10.4 테넌트 관리 API 요약

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/tenants` | GET | 테넌트 목록 조회 | `super.tenants.read` |
| `/tenants/:id` | GET | 테넌트 상세 조회 | `super.tenants.read` |
| `/tenants` | POST | 테넌트 생성 | `super.tenants.create` |
| `/tenants/:id` | PATCH | 테넌트 정보 수정 | `super.tenants.update` |
| `/tenants/:id/status` | PATCH | 테넌트 상태 변경 | `super.tenants.update` |
| `/tenants/:id` | DELETE | 테넌트 삭제 | `super.tenants.delete` |

---

## 11. 슈퍼 관리자 대시보드

### 11.1 대시보드 개요

> 슈퍼 관리자가 전체 시스템 현황을 한눈에 파악할 수 있는 대시보드입니다.

```mermaid
flowchart TB
    subgraph Dashboard["📊 슈퍼 관리자 대시보드"]
        D1["전체 테넌트 수"]
        D2["활성 테넌트 수"]
        D3["전체 사용자 수"]
        D4["전체 역할 수"]
        D5["전체 권한 수"]
        D6["최근 가입 테넌트"]
    end
    
    SuperAdmin["👑 슈퍼 관리자<br/>(super.dashboard.read 권한)"] --> Dashboard
    
    style SuperAdmin fill:#ff9800
    style Dashboard fill:#e8f5e9
```

### 11.2 대시보드 조회 플로우

```mermaid
sequenceDiagram
    autonumber
    participant Client as 👑 슈퍼 관리자
    participant API as 🌐 GET /super/dashboard
    participant Guard as 🛡️ PermissionGuard
    participant Service as ⚙️ SuperService
    participant DB as 🗄️ Database
    
    Client->>API: 대시보드 조회
    Note over Client,API: Authorization: Bearer {token}
    
    API->>Guard: @RequireAuth('super.dashboard', 'read')
    Guard-->>API: ✅ 슈퍼 관리자 권한 확인
    
    API->>Service: getDashboard()
    
    rect rgb(232, 245, 233)
        Note over Service,DB: 📊 통계 집계
        Service->>DB: SELECT COUNT(*) FROM tenants
        Service->>DB: SELECT COUNT(*) FROM tenants WHERE is_active = 1
        Service->>DB: SELECT COUNT(*) FROM users
        Service->>DB: SELECT COUNT(*) FROM roles
        Service->>DB: SELECT COUNT(*) FROM permissions
        Service->>DB: SELECT * FROM tenants ORDER BY created_at DESC LIMIT 5
        DB-->>Service: 통계 데이터
    end
    
    Service-->>API: DashboardDto
    API-->>Client: 200 OK
```

### 11.3 API 상세

#### Request

```http
GET /super/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Response

```json
{
  "summary": {
    "totalTenants": 15,
    "activeTenants": 12,
    "totalUsers": 150,
    "totalRoles": 45,
    "totalPermissions": 28
  },
  "recentTenants": [
    {
      "tenantId": 15,
      "tenantName": "최신회사",
      "isActive": true,
      "createdAt": "2026-01-25T10:00:00.000Z"
    },
    {
      "tenantId": 14,
      "tenantName": "신규기업",
      "isActive": true,
      "createdAt": "2026-01-24T15:30:00.000Z"
    }
  ],
  "generatedAt": "2026-01-25T14:00:00.000Z"
}
```

### 11.4 대시보드 활용 사례

```mermaid
flowchart TB
    subgraph UseCases["📋 활용 사례"]
        UC1["🏢 테넌트 증가 추이 모니터링"]
        UC2["👥 사용자 증가 추이 모니터링"]
        UC3["🚨 비활성 테넌트 관리"]
        UC4["📊 시스템 성장 지표 확인"]
    end
    
    Dashboard["📊 대시보드"] --> UseCases
```

### 11.5 슈퍼 관리자 API 요약

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/super/dashboard` | GET | 대시보드 통계 조회 | `super.dashboard.read` |

---

## 12. 관리 플로우 시나리오 종합

> Part 2의 모든 관리 기능을 **실제 업무 시나리오**별로 정리하여  
> 한눈에 이해할 수 있도록 구성했습니다.

### 12.1 3단계 권한 체계 이해

#### 12.1.1 사용자 유형별 역할

```mermaid
flowchart TB
    subgraph Level1["👑 Level 1: 슈퍼 관리자"]
        SA["개발자 / 운영팀<br/>시스템 전체 관리"]
    end
    
    subgraph Level2["👤 Level 2: 테넌트 관리자"]
        TA["신규 업체 대표 / 관리자<br/>자기 회사만 관리"]
    end
    
    subgraph Level3["👥 Level 3: 일반 사용자"]
        User["직원<br/>부여받은 역할에 따른 업무"]
    end
    
    Level1 --> Level2 --> Level3
    
    style Level1 fill:#ff9800,color:#fff
    style Level2 fill:#2196f3,color:#fff
    style Level3 fill:#4caf50,color:#fff
```

#### 12.1.2 각 레벨별 상세 비교

| 구분 | 👑 슈퍼 관리자 | 👤 테넌트 관리자 | 👥 일반 사용자 |
|------|:-------------:|:---------------:|:-------------:|
| **누구?** | 개발자, 운영팀 | 신규 업체 대표/관리자 | 업체의 직원 |
| **생성 방법** | DB 직접 생성 (Seed) | `POST /auth/signup` | `POST /users` |
| **Tenant** | 특수 테넌트 (tenantId=0) | 자신의 테넌트 | 관리자와 같은 테넌트 |
| **접근 범위** | 🌐 모든 테넌트 | 🏢 자기 테넌트만 | 🏢 자기 테넌트만 |
| **주요 권한** | `super.*` | `roles.*`, `users.*` | 역할에 따라 다름 |

#### 12.1.3 권한 생성 흐름

> **핵심 개념**: 슈퍼 관리자가 권한 체계(Permission)를 만들고,  
> 테넌트 관리자는 그 권한을 조합해서 역할(Role)을 만듭니다.

```mermaid
flowchart TB
    subgraph Super["👑 슈퍼 관리자가 하는 일 (1회성)"]
        S1["📄 Page 생성<br/>(users, customers, counsel...)"]
        S2["⚡ Action 생성<br/>(read, create, update, delete...)"]
        S3["🔑 Permission 생성<br/>(Page + Action 조합)"]
    end
    
    subgraph Tenant["👤 테넌트 관리자가 하는 일 (각 업체별)"]
        T1["📋 Permission 카탈로그 조회<br/>(이미 만들어진 권한 목록 확인)"]
        T2["🎭 Role 생성<br/>(마케팅팀, 영업팀, 상담팀...)"]
        T3["🔗 Role에 Permission 할당<br/>(필요한 권한만 조합)"]
        T4["👤 사용자에게 Role 부여"]
    end
    
    subgraph Employee["👥 직원이 하는 일"]
        E1["✅ 부여받은 Role의<br/>Permission 범위 내 업무 수행"]
    end
    
    S1 --> S3
    S2 --> S3
    S3 -.->|"권한 체계 제공"| T1
    T1 --> T2
    T2 --> T3
    T3 --> T4
    T4 --> E1
    
    style Super fill:#fff3e0
    style Tenant fill:#e3f2fd
    style Employee fill:#e8f5e9
```

#### 12.1.4 할 수 있는 것 vs 없는 것

| 작업 | 👑 슈퍼 관리자 | 👤 테넌트 관리자 | 👥 직원 |
|------|:-------------:|:---------------:|:------:|
| **Page 생성** (users, reports...) | ✅ | ❌ | ❌ |
| **Action 생성** (read, export...) | ✅ | ❌ | ❌ |
| **Permission 생성** (users.read...) | ✅ | ❌ | ❌ |
| **Permission 목록 조회** | ✅ | ✅ | ❌ |
| **Role 생성** (마케팅팀...) | ✅ | ✅ | ❌ |
| **Role에 Permission 할당** | ✅ | ✅ | ❌ |
| **사용자에게 Role 부여** | ✅ | ✅ | ❌ |
| **테넌트 관리** | ✅ | ❌ | ❌ |
| **일반 업무** (상담, 고객관리) | ✅ | ✅ | ✅ |

#### 12.1.5 실제 조직 구조 예시

```
📍 FlowDesk 시스템
│
├── 👑 슈퍼 관리자 (tenantId: 0)
│   └── root@flowdesk.com (개발자)
│       └── 권한: super.* (시스템 전체 관리)
│
├── 🏢 마케팅솔루션 (tenantId: 1)
│   ├── 👤 김철수 대표 (테넌트 관리자)
│   │   └── 역할: 관리자 → users.*, roles.*, customers.*, counsel.*
│   │
│   └── 👥 직원들
│       ├── 박영희 → 역할: 마케팅팀 → users.read, dashboard.read
│       ├── 이민수 → 역할: 영업팀 → customers.*, counsel.*
│       └── 최지훈 → 역할: 상담팀 → counsel.*
│
└── 🏢 테크스타트업 (tenantId: 2)
    ├── 👤 정민호 대표 (테넌트 관리자)
    │   └── 역할: 관리자 → 모든 권한
    │
    └── 👥 직원들
        └── ...
```

#### 12.1.6 비유로 이해하기

```mermaid
flowchart TB
    subgraph Analogy["🍕 프랜차이즈 비유"]
        subgraph HQ["🏛️ 본사 = 슈퍼 관리자"]
            H1["메뉴판 정의<br/>(치킨, 피자, 파스타...)"]
            H2["모든 가맹점 관리"]
        end
        
        subgraph Store["🏪 가맹점 = 테넌트 관리자"]
            S1["본사 메뉴 중 선택"]
            S2["직원 역할 지정<br/>(주방, 홀, 배달...)"]
            S3["❌ 새 메뉴 만들기 불가"]
        end
        
        subgraph Staff["👷 직원 = 일반 사용자"]
            E1["점장이 정한 역할 수행"]
            E2["주방담당 → 요리만"]
            E3["홀담당 → 서빙만"]
        end
    end
    
    HQ --> Store --> Staff
    
    style HQ fill:#fff3e0
    style Store fill:#e3f2fd
    style Staff fill:#e8f5e9
```

---

### 12.2 전체 시나리오 맵

```mermaid
flowchart TB
    subgraph SuperAdmin["👑 슈퍼 관리자 영역"]
        SA1["시스템 대시보드 조회"]
        SA2["테넌트 관리"]
        SA3["권한 체계 설정"]
    end
    
    subgraph TenantAdmin["👤 테넌트 관리자 영역"]
        TA1["역할 관리"]
        TA2["권한 카탈로그 조회"]
        TA3["사용자-역할 할당"]
    end
    
    SA1 --> |"시스템 현황 파악"| SA2
    SA2 --> |"테넌트 생성 후"| SA3
    SA3 --> |"권한 체계 구축 후"| TA1
    TA1 --> |"역할 생성 후"| TA2
    TA2 --> |"권한 확인 후"| TA3
    
    style SuperAdmin fill:#fff3e0
    style TenantAdmin fill:#e3f2fd
```

### 12.3 시나리오 1: 새로운 SaaS 고객사 온보딩

> **상황**: 슈퍼 관리자가 새로운 고객사 "ABC테크"를 시스템에 등록합니다.

```mermaid
sequenceDiagram
    autonumber
    participant Super as 👑 슈퍼 관리자
    participant System as 🌐 시스템
    participant NewTenant as 🏢 ABC테크
    
    rect rgb(255, 248, 225)
        Note over Super,System: 📋 Step 1: 테넌트 생성
        Super->>System: POST /tenants
        Note over Super,System: { tenantName: "ABC테크",<br/>  displayName: "ABC테크 주식회사" }
        System-->>Super: ✅ 테넌트 생성 완료 (tenantId: 10)
    end
    
    rect rgb(232, 245, 233)
        Note over Super,System: 📋 Step 2: 대시보드에서 확인
        Super->>System: GET /super/dashboard
        System-->>Super: ✅ totalTenants: 16, activeTenants: 13
    end
    
    rect rgb(225, 245, 254)
        Note over System,NewTenant: 📋 Step 3: 고객사 관리자 안내
        System-->>NewTenant: 🔑 관리자 계정 생성 안내<br/>회원가입 진행 요청
    end
```

#### 필요 권한
| 단계 | API | 권한 |
|------|-----|------|
| Step 1 | `POST /tenants` | `super.tenants.create` |
| Step 2 | `GET /super/dashboard` | `super.dashboard.read` |

---

### 12.4 시나리오 2: 역할 기반 접근 제어 설정

> **상황**: "마케팅솔루션" 관리자가 팀별 역할을 생성하고 권한을 설정합니다.

```mermaid
flowchart TB
    subgraph Scenario["📋 역할 기반 접근 제어 설정"]
        direction TB
        
        S1["1️⃣ 권한 카탈로그 확인<br/>GET /permissions/catalog"]
        S2["2️⃣ 역할 생성<br/>POST /roles"]
        S3["3️⃣ 역할에 권한 할당<br/>POST /roles/:id/permissions"]
        S4["4️⃣ 사용자에게 역할 부여<br/>(Users 모듈에서 처리)"]
        S5["5️⃣ 역할별 사용자 확인<br/>GET /roles/:id/users"]
        
        S1 --> S2 --> S3 --> S4 --> S5
    end
    
    style S1 fill:#e3f2fd
    style S2 fill:#e8f5e9
    style S3 fill:#fff3e0
    style S4 fill:#fce4ec
    style S5 fill:#f3e5f5
```

#### 상세 플로우

```mermaid
sequenceDiagram
    autonumber
    participant Admin as 👤 마케팅솔루션 관리자
    participant System as 🌐 시스템
    
    rect rgb(227, 242, 253)
        Note over Admin,System: 1️⃣ 사용 가능한 권한 확인
        Admin->>System: GET /permissions/catalog
        System-->>Admin: pages[], actions[], permissions[], matrix{}
        Note over Admin: 💡 users.read, users.create 등<br/>사용 가능한 권한 파악
    end
    
    rect rgb(232, 245, 233)
        Note over Admin,System: 2️⃣ 팀별 역할 생성
        Admin->>System: POST /roles
        Note over Admin,System: { roleName: "마케팅팀" }
        System-->>Admin: ✅ roleId: 3
        
        Admin->>System: POST /roles
        Note over Admin,System: { roleName: "영업팀" }
        System-->>Admin: ✅ roleId: 4
        
        Admin->>System: POST /roles
        Note over Admin,System: { roleName: "고객지원팀" }
        System-->>Admin: ✅ roleId: 5
    end
    
    rect rgb(255, 243, 224)
        Note over Admin,System: 3️⃣ 역할별 권한 할당
        Admin->>System: POST /roles/3/permissions
        Note over Admin,System: 마케팅팀: [users.read, dashboard.read]
        System-->>Admin: ✅ assignedCount: 2
        
        Admin->>System: POST /roles/4/permissions
        Note over Admin,System: 영업팀: [users.read, customers.*, counsel.*]
        System-->>Admin: ✅ assignedCount: 8
        
        Admin->>System: POST /roles/5/permissions
        Note over Admin,System: 고객지원팀: [counsel.*, boards.*]
        System-->>Admin: ✅ assignedCount: 6
    end
```

#### 권한 설정 예시 테이블

| 역할 | 권한 | 설명 |
|------|------|------|
| **마케팅팀** | `users.read`, `dashboard.read` | 사용자 조회, 대시보드 조회 |
| **영업팀** | `users.read`, `customers.*`, `counsel.*` | 고객 관리, 상담 전체 권한 |
| **고객지원팀** | `counsel.*`, `boards.*` | 상담, 게시판 전체 권한 |

---

### 12.5 시나리오 3: 슈퍼 관리자의 권한 체계 확장

> **상황**: 슈퍼 관리자가 새로운 기능 "보고서"에 대한 권한 체계를 추가합니다.

```mermaid
sequenceDiagram
    autonumber
    participant Super as 👑 슈퍼 관리자
    participant System as 🌐 시스템
    
    rect rgb(255, 248, 225)
        Note over Super,System: 1️⃣ 새 페이지 생성
        Super->>System: POST /permissions/admin/pages
        Note over Super,System: { pageName: "reports",<br/>  description: "보고서 관리",<br/>  displayName: "보고서" }
        System-->>Super: ✅ pageId: 10
    end
    
    rect rgb(232, 245, 233)
        Note over Super,System: 2️⃣ 권한 조합 생성
        Super->>System: POST /permissions/admin/permissions
        Note over Super,System: { pageId: 10, actionId: 1 }<br/>→ reports.read
        System-->>Super: ✅ permissionId: 25
        
        Super->>System: POST /permissions/admin/permissions
        Note over Super,System: { pageId: 10, actionId: 2 }<br/>→ reports.create
        System-->>Super: ✅ permissionId: 26
        
        Super->>System: POST /permissions/admin/permissions
        Note over Super,System: { pageId: 10, actionId: 5 }<br/>→ reports.export
        System-->>Super: ✅ permissionId: 27
    end
    
    rect rgb(225, 245, 254)
        Note over Super,System: 3️⃣ 변경 확인
        Super->>System: GET /permissions/admin/permissions
        System-->>Super: ✅ 전체 권한 목록 (reports.* 포함)
    end
```

#### 생성된 권한 체계

```mermaid
flowchart LR
    subgraph NewPermissions["🆕 새로 추가된 권한"]
        P1["reports.read<br/>보고서 조회"]
        P2["reports.create<br/>보고서 생성"]
        P3["reports.export<br/>보고서 내보내기"]
    end
    
    Page["📄 reports<br/>(Page)"] --> P1
    Page --> P2
    Page --> P3
    
    style NewPermissions fill:#e8f5e9
```

---

### 12.6 시나리오 4: 문제 테넌트 관리

> **상황**: 슈퍼 관리자가 결제 미납 고객사를 비활성화하고, 이후 재활성화합니다.

```mermaid
sequenceDiagram
    autonumber
    participant Super as 👑 슈퍼 관리자
    participant System as 🌐 시스템
    participant Tenant as 🏢 휴면회사
    
    rect rgb(255, 235, 238)
        Note over Super,System: ⚠️ 테넌트 비활성화
        Super->>System: PATCH /tenants/3/status
        Note over Super,System: { isActive: false }
        System-->>Super: ✅ 비활성화 완료
        
        Note over Tenant: ❌ 모든 사용자 로그인 불가<br/>❌ 기존 토큰 무효화<br/>✅ 데이터는 보존됨
    end
    
    rect rgb(255, 248, 225)
        Note over Super,Tenant: 📧 고객사에 안내
        Super-->>Tenant: 서비스 중단 안내<br/>결제 요청
    end
    
    rect rgb(232, 245, 233)
        Note over Super,System: ✅ 결제 완료 후 재활성화
        Super->>System: PATCH /tenants/3/status
        Note over Super,System: { isActive: true }
        System-->>Super: ✅ 재활성화 완료
        
        Note over Tenant: ✅ 정상 로그인 가능<br/>✅ 기존 데이터 접근 가능
    end
```

#### 테넌트 상태별 영향

| 상태 | 로그인 | 기존 토큰 | 데이터 | API 접근 |
|------|--------|-----------|--------|----------|
| **활성 (isActive: true)** | ✅ 가능 | ✅ 유효 | ✅ 접근 가능 | ✅ 정상 |
| **비활성 (isActive: false)** | ❌ 불가 | ❌ 무효화 | ✅ 보존됨 | ❌ 차단 |

---

### 12.7 시나리오 5: 일일 시스템 모니터링

> **상황**: 슈퍼 관리자가 매일 아침 시스템 현황을 점검합니다.

```mermaid
flowchart TB
    subgraph Morning["🌅 일일 모니터링 루틴"]
        M1["1️⃣ 대시보드 조회<br/>GET /super/dashboard"]
        M2["2️⃣ 신규 테넌트 확인<br/>recentTenants 검토"]
        M3["3️⃣ 비활성 테넌트 점검<br/>activeTenants vs totalTenants"]
        M4["4️⃣ 필요 시 조치<br/>테넌트 관리/권한 설정"]
    end
    
    M1 --> M2 --> M3 --> M4
    
    style M1 fill:#e3f2fd
    style M2 fill:#e8f5e9
    style M3 fill:#fff3e0
    style M4 fill:#fce4ec
```

#### 대시보드 체크리스트

| 항목 | 확인 포인트 | 이상 징후 |
|------|-------------|-----------|
| **totalTenants** | 전체 테넌트 수 | 급격한 증감 |
| **activeTenants** | 활성 테넌트 수 | totalTenants와 차이 큰 경우 |
| **totalUsers** | 전체 사용자 수 | 이상 급증 (보안 이슈 가능성) |
| **recentTenants** | 최근 가입 테넌트 | 정상 가입 여부 확인 |

---

### 12.8 시나리오별 API 빠른 참조

#### 🏢 테넌트 관리 시나리오

| 시나리오 | API | 메서드 | 권한 |
|----------|-----|--------|------|
| 고객사 목록 조회 | `/tenants` | GET | `super.tenants.read` |
| 신규 고객사 등록 | `/tenants` | POST | `super.tenants.create` |
| 고객사 정보 수정 | `/tenants/:id` | PATCH | `super.tenants.update` |
| 고객사 비활성화 | `/tenants/:id/status` | PATCH | `super.tenants.update` |
| 고객사 삭제 | `/tenants/:id` | DELETE | `super.tenants.delete` |

#### 🎭 역할 관리 시나리오

| 시나리오 | API | 메서드 | 권한 |
|----------|-----|--------|------|
| 역할 목록 조회 | `/roles` | GET | `roles.read` |
| 새 역할 생성 | `/roles` | POST | `roles.create` |
| 역할 정보 수정 | `/roles/:id` | PATCH | `roles.update` |
| 역할에 권한 할당 | `/roles/:id/permissions` | POST | `roles.permissions.update` |
| 역할별 사용자 확인 | `/roles/:id/users` | GET | `roles.read` |

#### 🔐 권한 관리 시나리오

| 시나리오 | API | 메서드 | 권한 |
|----------|-----|--------|------|
| 권한 카탈로그 조회 | `/permissions/catalog` | GET | `permissions.read` |
| 페이지 추가 | `/permissions/admin/pages` | POST | `super.pages.create` |
| 액션 추가 | `/permissions/admin/actions` | POST | `super.actions.create` |
| 권한 생성 | `/permissions/admin/permissions` | POST | `super.permissions.create` |

#### 📊 모니터링 시나리오

| 시나리오 | API | 메서드 | 권한 |
|----------|-----|--------|------|
| 시스템 현황 조회 | `/super/dashboard` | GET | `super.dashboard.read` |

---

### 12.9 권한 계층 구조 종합

```mermaid
flowchart TB
    subgraph Hierarchy["🔐 권한 계층 구조"]
        direction TB
        
        subgraph SuperLevel["👑 슈퍼 관리자 레벨"]
            SP1["super.dashboard.*"]
            SP2["super.tenants.*"]
            SP3["super.pages.*"]
            SP4["super.actions.*"]
            SP5["super.permissions.*"]
        end
        
        subgraph TenantLevel["👤 테넌트 관리자 레벨"]
            TP1["roles.*"]
            TP2["roles.permissions.*"]
            TP3["permissions.read"]
            TP4["users.*"]
        end
        
        subgraph UserLevel["👥 일반 사용자 레벨"]
            UP1["dashboard.read"]
            UP2["customers.read"]
            UP3["counsel.read"]
        end
    end
    
    SuperLevel --> TenantLevel --> UserLevel
    
    style SuperLevel fill:#fff3e0
    style TenantLevel fill:#e3f2fd
    style UserLevel fill:#e8f5e9
```

---

## 📌 부록 A. 기본 사용 시나리오 (curl)

```bash
# 1. 회원가입
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "마케팅솔루션",
    "adminName": "김철수",
    "email": "ceo@marketing.com",
    "phone": "010-1234-5678",
    "password": "MyPass123!"
  }'

# 2. 로그인
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "마케팅솔루션",
    "userId": "ceo@marketing.com",
    "password": "MyPass123!"
  }'
# → accessToken 획득

# 3. 팀원 추가
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "userId": "park.younghee",
    "password": "Welcome123!",
    "corpName": "마케팅솔루션",
    "userName": "박영희",
    "userEmail": "park@marketing.com"
  }'

# 4. 팀원 로그인
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "마케팅솔루션",
    "userId": "park.younghee",
    "password": "Welcome123!"
  }'
```

---

## 📌 부록 B. 관리 기능 시나리오 (curl)

```bash
# 1. 역할 생성
curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "roleName": "마케팅팀",
    "description": "마케팅 담당자 역할"
  }'

# 2. 역할에 권한 할당
curl -X POST http://localhost:3000/roles/3/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "permissionIds": [5, 6, 7, 8]
  }'

# 3. 권한 카탈로그 조회
curl -X GET http://localhost:3000/permissions/catalog \
  -H "Authorization: Bearer {accessToken}"

# 4. 슈퍼 관리자 대시보드 조회
curl -X GET http://localhost:3000/super/dashboard \
  -H "Authorization: Bearer {superAdminToken}"

# 5. 테넌트 목록 조회
curl -X GET http://localhost:3000/tenants \
  -H "Authorization: Bearer {superAdminToken}"

# 6. 페이지 생성 (슈퍼 관리자)
curl -X POST http://localhost:3000/permissions/admin/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {superAdminToken}" \
  -d '{
    "pageName": "reports",
    "description": "보고서 관리",
    "displayName": "보고서"
  }'
```

---

> **문서 버전**: 2.2  
> **최종 수정일**: 2026-01-26  
> **작성자**: FlowDesk Admin Team (Lee seong min)  
> **변경 이력**:
> - v2.2: 12.1 추가 (3단계 권한 체계 이해 - 사용자 유형별 역할/권한 생성 흐름)
> - v2.1: 12장 추가 (관리 플로우 시나리오 종합 - 5개 실무 시나리오)
> - v2.0: Part 2 추가 (역할 관리, 권한 관리, 테넌트 관리, 슈퍼 관리자 대시보드)
> - v1.0: 초기 버전 (회원가입~팀원관리)