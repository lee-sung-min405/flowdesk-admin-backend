# Database Seeds

## 📁 파일 구조

```
database/seeds/
└── init-seed.sql    # 초기 데이터베이스 시드 (슈퍼 관리자 + 모든 권한)
```

## 🚀 사용 방법

### 1. MySQL CLI 사용

```bash
# 데이터베이스 접속 후 실행
mysql -u [username] -p [database_name] < database/seeds/init-seed.sql

# 예시
mysql -u root -p flowdesk_admin < database/seeds/init-seed.sql
```

### 2. MySQL Workbench / DBeaver 등 GUI 도구
1. `init-seed.sql` 파일 열기
2. 대상 데이터베이스 선택
3. 전체 쿼리 실행

### 3. Docker 환경

```bash
# MySQL 컨테이너에 시드 실행
docker exec -i [container_name] mysql -u root -p[password] [database_name] < database/seeds/init-seed.sql
```

---

## 📊 생성되는 데이터

### Actions (4개)
| action_id | action_name | display_name |
|-----------|-------------|--------------|
| 1 | read | 조회 |
| 2 | create | 생성 |
| 3 | update | 수정 |
| 4 | delete | 삭제 |

### Pages (9개, 계층 구조)
| page_id | parent_id | page_name | display_name | 대상 |
|---------|-----------|-----------|--------------|------|
| 1 | NULL | super | 슈퍼 관리자 | 슈퍼 관리자 (부모) |
| 2 | 1 | super.dashboard | 대시보드 | 슈퍼 관리자 |
| 3 | 1 | super.tenants | 테넌트 관리 | 슈퍼 관리자 |
| 4 | 1 | super.pages | 페이지 관리 | 슈퍼 관리자 |
| 5 | 1 | super.actions | 액션 관리 | 슈퍼 관리자 |
| 6 | 1 | super.permissions | 권한 관리 | 슈퍼 관리자 |
| 7 | NULL | roles | 역할 관리 | 테넌트 관리자 |
| 8 | NULL | users | 사용자 관리 | 테넌트 관리자 |
| 9 | NULL | permissions | 권한 카탈로그 | 테넌트 관리자 |

#### Pages 계층 구조
```
📁 super (슈퍼 관리자)
├── 📄 super.dashboard (대시보드)
├── 📄 super.tenants (테넌트 관리)
├── 📄 super.pages (페이지 관리)
├── 📄 super.actions (액션 관리)
└── 📄 super.permissions (권한 관리)

📁 roles (역할 관리)
📁 users (사용자 관리)
📁 permissions (권한 카탈로그)
```

### Permissions (26개)
Page + Action 조합으로 26개 권한 생성
### Tenants (1개)
| tenant_id | tenant_name | display_name |
|-----------|-------------|--------------|
| 1 | system | 시스템 관리 |

### Roles (1개)
| role_id | role_name | display_name | tenant_id |
|---------|-----------|--------------|-----------|
| 1 | super_admin | 슈퍼 관리자 | 1 |

### Users (1개)
| user_id | user_name | tenant_id | 비밀번호 |
|---------|-----------|-----------|----------|
| admin | 슈퍼 관리자 | 1 | **Admin123** |

---

## 🔐 로그인 정보

```
ID: admin
PW: Admin123
```

> ⚠️ **주의**: 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!

---

## 🔄 재실행 시 주의사항

- `ON DUPLICATE KEY UPDATE` 구문 사용으로 중복 실행 시 기존 데이터 업데이트
- 기존 데이터 삭제 없이 안전하게 재실행 가능
- 단, user_seq, role_id 등 PK가 충돌하면 업데이트됨

### 완전 초기화 후 재실행

데이터를 완전히 초기화하고 다시 시작하려면 `init-seed.sql` 파일 하단의 주석 처리된 TRUNCATE 쿼리를 활성화하세요:

```sql
-- 외래 키 제약 무시하고 모든 데이터 삭제
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
TRUNCATE TABLE permissions;
TRUNCATE TABLE pages;
TRUNCATE TABLE actions;
TRUNCATE TABLE tenants;
TRUNCATE TABLE refresh_tokens;  -- JWT 리프레시 토큰도 초기화
SET FOREIGN_KEY_CHECKS = 1;
```

> ⚠️ **경고**: TRUNCATE는 **모든 데이터를 삭제**하며 복구할 수 없습니다!

---

## 📝 커스텀 시드 추가 방법

### 새로운 테넌트 추가
```sql
INSERT INTO tenants (tenant_name, display_name, is_active) VALUES
('acme', 'ACME 주식회사', 1);
```

### 테넌트 관리자 역할 추가
```sql
-- ACME 테넌트의 관리자 역할
INSERT INTO roles (role_name, display_name, tenant_id, is_active) VALUES
('tenant_admin', '테넌트 관리자', 1, 1);

-- 역할에 권한 할당 (roles, users, permissions 권한)
INSERT INTO role_permissions (role_id, permission_id)
SELECT LAST_INSERT_ID(), permission_id 
FROM permissions 
WHERE page_id IN (6, 7, 8);  -- roles, users, permissions
```

### 일반 직원 역할 추가
```sql
-- 조회만 가능한 직원 역할
INSERT INTO roles (role_name, display_name, tenant_id, is_active) VALUES
('employee', '직원', 1, 1);

-- 조회 권한만 부여
INSERT INTO role_permissions (role_id, permission_id) VALUES
(LAST_INSERT_ID(), 22);  -- users.read만
```

---

## 🗺️ 권한 체계 맵

```
슈퍼 관리자 (tenant_id=1, tenant_name='system')
├── super.dashboard.read     → 대시보드 통계 조회
├── super.tenants.*          → 테넌트 CRUD
├── super.pages.*            → 페이지 CRUD  
├── super.actions.*          → 액션 CRUD
├── super.permissions.*      → 권한 CRUD
├── roles.*                  → 역할 CRUD (모든 테넌트)
├── users.*                  → 사용자 CRUD (모든 테넌트)
└── permissions.read         → 권한 카탈로그 조회

테넌트 관리자 (tenant_id≥2)
├── roles.*                  → 자기 테넌트 역할 CRUD
├── users.*                  → 자기 테넌트 사용자 CRUD
└── permissions.read         → 권한 카탈로그 조회

일반 사용자 (tenant_id≥2)
└── (할당된 역할의 권한만)
```
