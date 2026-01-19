# 사용자 플로우: 회원가입부터 팀원 관리까지

> **FlowDesk Admin** 시스템의 사용자 여정을 설명하는 문서입니다.  
> 회원가입, 로그인, 팀원 관리 등 핵심 플로우를 다룹니다.

---

## 📋 목차

1. [전체 흐름 요약](#1-전체-흐름-요약)
2. [회원가입 플로우](#2-회원가입-플로우)
3. [로그인 플로우](#3-로그인-플로우)
4. [팀원 추가 플로우](#4-팀원-추가-플로우)
5. [팀원 로그인 플로우](#5-팀원-로그인-플로우)
6. [데이터 격리 및 보안](#6-데이터-격리-및-보안)
7. [API 요약](#7-api-요약)

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

## 📌 부록: 실제 사용 예시

### A. 전체 시나리오 (curl)

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

> **문서 버전**: 1.0  
> **최종 수정일**: 2026-01-20  
> **작성자**: FlowDesk Admin Team (Lee seong min)