-- ============================================================
-- flowdesk-admin 초기 데이터베이스 시드
-- 
-- 실행 방법:
--   mysql -u [username] -p [database_name] < init-seed.sql
--
-- 포함 내용:
--   1. 기본 Actions (CRUD 액션)
--   2. 기본 Pages (API 기준)
--   3. Permissions (Page + Action 조합)
--   4. 시스템 테넌트 (tenant_id = 1, tenant_name = 'system')
--   5. 슈퍼 관리자 역할
--   6. 슈퍼 관리자 계정 (admin / Admin123)
--   7. 역할-권한 매핑
--   8. 사용자-역할 매핑
--
-- 생성일: 2026-01-27
-- ============================================================

-- 외래 키 체크 임시 비활성화 (순서 독립적 삽입을 위해)
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 트랜잭션 시작
START TRANSACTION;

-- ============================================================
-- 1. Actions (액션 타입 정의)
-- ============================================================
INSERT INTO actions (action_id, action_name, display_name, is_active) VALUES
(1, 'read', '조회', 1),
(2, 'create', '생성', 1),
(3, 'update', '수정', 1),
(4, 'delete', '삭제', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ============================================================
-- 2. Pages (페이지/리소스 정의)
-- ============================================================
-- API 컨트롤러 기준으로 생성
-- parent_id를 사용하여 계층 구조 표현
INSERT INTO pages (page_id, parent_id, page_name, path, display_name, description, is_active, sort_order) VALUES
-- 슈퍼 관리자 전용 페이지 (super.*) - 부모 카테고리
(1, NULL, 'super', '/super', '슈퍼 관리자', '슈퍼 관리자 전용 기능', 1, 1),

-- 슈퍼 관리자 하위 페이지 (parent_id = 1)
(2, 1, 'super.dashboard', '/super/dashboard', '대시보드', '시스템 전체 통계 조회', 1, 1),
(3, 1, 'super.tenants', '/tenants', '테넌트 관리', '테넌트(회사) 생성/수정/삭제', 1, 2),
(4, 1, 'super.pages', '/permissions/admin/pages', '페이지 관리', 'RBAC 페이지 CRUD', 1, 3),
(5, 1, 'super.actions', '/permissions/admin/actions', '액션 관리', 'RBAC 액션 CRUD', 1, 4),
(6, 1, 'super.permissions', '/permissions/admin/permissions', '권한 관리', 'RBAC 권한 CRUD', 1, 5),

-- 테넌트 관리자용 페이지 (최상위)
(7, NULL, 'roles', '/roles', '역할 관리', '역할 생성/수정/삭제 및 권한 할당', 1, 10),
(8, NULL, 'users', '/users', '사용자 관리', '사용자 생성/수정/삭제 및 역할 할당', 1, 11),
(9, NULL, 'permissions', '/permissions/catalog', '권한 카탈로그', '권한 목록 조회 (역할 할당용)', 1, 12)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 3. Permissions (Page + Action 조합)
-- ============================================================
-- 참고: 부모 페이지(super)는 권한을 부여하지 않고, 하위 페이지만 권한 부여
INSERT INTO permissions (permission_id, page_id, action_id, display_name, description, is_active) VALUES
-- super.dashboard (대시보드는 read만) - page_id = 2
(1, 2, 1, '슈퍼 대시보드 조회', '시스템 전체 통계 조회', 1),

-- super.tenants (CRUD) - page_id = 3
(2, 3, 1, '테넌트 조회', '테넌트 목록 및 상세 조회', 1),
(3, 3, 2, '테넌트 생성', '새 테넌트 생성', 1),
(4, 3, 3, '테넌트 수정', '테넌트 정보 및 상태 수정', 1),
(5, 3, 4, '테넌트 삭제', '테넌트 삭제', 1),

-- super.pages (CRUD) - page_id = 4
(6, 4, 1, '페이지 조회', 'RBAC 페이지 목록 조회', 1),
(7, 4, 2, '페이지 생성', 'RBAC 페이지 생성', 1),
(8, 4, 3, '페이지 수정', 'RBAC 페이지 수정', 1),
(9, 4, 4, '페이지 삭제', 'RBAC 페이지 삭제', 1),

-- super.actions (CRUD) - page_id = 5
(10, 5, 1, '액션 조회', 'RBAC 액션 목록 조회', 1),
(11, 5, 2, '액션 생성', 'RBAC 액션 생성', 1),
(12, 5, 3, '액션 수정', 'RBAC 액션 수정', 1),
(13, 5, 4, '액션 삭제', 'RBAC 액션 삭제', 1),

-- super.permissions (CRUD) - page_id = 6
(14, 6, 1, '권한 조회', 'RBAC 권한 목록 조회', 1),
(15, 6, 2, '권한 생성', 'RBAC 권한 생성', 1),
(16, 6, 3, '권한 수정', 'RBAC 권한 수정', 1),
(17, 6, 4, '권한 삭제', 'RBAC 권한 삭제', 1),

-- roles (CRUD) - page_id = 7
(18, 7, 1, '역할 조회', '역할 목록 및 상세 조회', 1),
(19, 7, 2, '역할 생성', '새 역할 생성', 1),
(20, 7, 3, '역할 수정', '역할 정보, 상태, 권한 할당 수정', 1),
(21, 7, 4, '역할 삭제', '역할 삭제', 1),

-- users (CRUD) - page_id = 8
(22, 8, 1, '사용자 조회', '사용자 목록 및 상세 조회', 1),
(23, 8, 2, '사용자 생성', '새 사용자 생성', 1),
(24, 8, 3, '사용자 수정', '사용자 정보, 상태, 비밀번호, 토큰 관리', 1),
(25, 8, 4, '사용자 삭제', '사용자 삭제', 1),

-- permissions catalog (read만) - page_id = 9
(26, 9, 1, '권한 카탈로그 조회', '역할에 할당할 권한 목록 조회', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 4. Tenants (테넌트 정의)
-- ============================================================
-- 시스템 테넌트 (슈퍼 관리자용, tenant_id = 1, tenant_name = 'system')
INSERT INTO tenants (tenant_id, tenant_name, display_name, domain, is_active) VALUES
(1, 'system', '시스템 관리', 'system.flowdesk.com', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ============================================================
-- 5. Roles (역할 정의)
-- ============================================================
-- 슈퍼 관리자 역할 (시스템 테넌트 소속)
INSERT INTO roles (role_id, role_name, display_name, description, tenant_id, is_active) VALUES
(1, 'super_admin', '슈퍼 관리자', '시스템 전체 관리 권한을 가진 최고 관리자', 1, 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 6. Role-Permissions (역할-권한 매핑)
-- ============================================================
-- 슈퍼 관리자에게 모든 권한 부여
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- super.dashboard
(1, 1),
-- super.tenants (CRUD)
(1, 2), (1, 3), (1, 4), (1, 5),
-- super.pages (CRUD)
(1, 6), (1, 7), (1, 8), (1, 9),
-- super.actions (CRUD)
(1, 10), (1, 11), (1, 12), (1, 13),
-- super.permissions (CRUD)
(1, 14), (1, 15), (1, 16), (1, 17),
-- roles (CRUD)
(1, 18), (1, 19), (1, 20), (1, 21),
-- users (CRUD)
(1, 22), (1, 23), (1, 24), (1, 25),
-- permissions catalog
(1, 26)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- ============================================================
-- 7. Users (슈퍼 관리자 계정)
-- ============================================================
-- 비밀번호: Admin123 (bcrypt 해시)
INSERT INTO users (user_seq, user_id, user_pwd, corp_name, user_name, user_email, is_active, token_version, tenant_id) VALUES
(1, 'admin', '$2b$10$9rA9MxvnnimvtGGbHkx5w.IDOw3oh0V1kGq4hEdKtuzcoVgrlHIP2', 'FlowDesk', '슈퍼 관리자', 'admin@flowdesk.com', 1, 0, 1)
ON DUPLICATE KEY UPDATE user_name = VALUES(user_name);

-- ============================================================
-- 8. User-Roles (사용자-역할 매핑)
-- ============================================================
INSERT INTO user_roles (user_seq, tenant_id, role_id) VALUES
(1, 1, 1)  -- admin 사용자에게 super_admin 역할 부여
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 트랜잭션 커밋
COMMIT;

-- ============================================================
-- 외래 키 체크 복원
-- ============================================================
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- ============================================================
-- 확인 쿼리
-- ============================================================
-- 생성된 데이터 확인
SELECT '=== Actions ===' AS '';
SELECT * FROM actions;

SELECT '=== Pages ===' AS '';
SELECT page_id, page_name, display_name, is_active FROM pages ORDER BY sort_order;

SELECT '=== Permissions ===' AS '';
SELECT p.permission_id, pg.page_name, a.action_name, p.display_name 
FROM permissions p
JOIN pages pg ON p.page_id = pg.page_id
JOIN actions a ON p.action_id = a.action_id
ORDER BY p.permission_id;

SELECT '=== Tenants ===' AS '';
SELECT * FROM tenants;

SELECT '=== Roles ===' AS '';
SELECT * FROM roles;

SELECT '=== Role-Permissions Count ===' AS '';
SELECT r.role_name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_id, r.role_name;

SELECT '=== Users ===' AS '';
SELECT user_seq, user_id, user_name, tenant_id, is_active FROM users;

SELECT '=== User-Roles ===' AS '';
SELECT u.user_id, r.role_name, t.tenant_name
FROM user_roles ur
JOIN users u ON ur.user_seq = u.user_seq
JOIN roles r ON ur.role_id = r.role_id
JOIN tenants t ON ur.tenant_id = t.tenant_id;

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 초기 시드 데이터 생성 완료!' AS 'Status';
SELECT 'admin / Admin123 로 로그인하세요.' AS 'Login Info';

-- ============================================================
-- 데이터 초기화 쿼리
-- ============================================================
-- 데이터 초기화 (역순으로 삭제 - FK 제약)
-- TRUNCATE TABLE user_roles;
-- TRUNCATE TABLE role_permissions;
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE user_roles;
-- TRUNCATE TABLE role_permissions;
-- TRUNCATE TABLE users;
-- TRUNCATE TABLE roles;
-- TRUNCATE TABLE permissions;
-- TRUNCATE TABLE pages;
-- TRUNCATE TABLE actions;
-- TRUNCATE TABLE tenants;
-- SET FOREIGN_KEY_CHECKS = 1;
-- TRUNCATE TABLE refresh_tokens;

