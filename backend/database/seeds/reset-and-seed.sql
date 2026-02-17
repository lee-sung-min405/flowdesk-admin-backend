-- ============================================================
-- flowdesk-admin 데이터 초기화 및 재설정
-- 
-- 실행 방법:
--   mysql -u [username] -p [database_name] < reset-and-seed.sql
--
-- 경고: 이 스크립트는 모든 기존 데이터를 삭제하고 초기 시드 데이터를 다시 생성합니다!
-- ============================================================

-- 외래 키 체크 비활성화
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 기존 데이터 완전 삭제
-- ============================================================
SELECT '🔄 기존 데이터 삭제 중...' AS 'Status';

TRUNCATE TABLE user_roles;
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
TRUNCATE TABLE permissions;
TRUNCATE TABLE pages;
TRUNCATE TABLE actions;
TRUNCATE TABLE tenant_status;
TRUNCATE TABLE tenants;
TRUNCATE TABLE refresh_tokens;

SELECT '✅ 기존 데이터 삭제 완료!' AS 'Status';

-- ============================================================
-- 2. 초기 시드 데이터 재생성
-- ============================================================
SELECT '🌱 초기 시드 데이터 생성 중...' AS 'Status';

-- 트랜잭션 시작
START TRANSACTION;

-- Actions
INSERT INTO actions (action_id, action_name, display_name, is_active) VALUES
(1, 'read', '조회', 1),
(2, 'create', '생성', 1),
(3, 'update', '수정', 1),
(4, 'delete', '삭제', 1);

-- Pages
INSERT INTO pages (page_id, parent_id, page_name, path, display_name, description, is_active, sort_order) VALUES
-- 슈퍼 관리자 전용 페이지
(1, NULL, 'super', '/super', '슈퍼 관리자', '슈퍼 관리자 전용 기능', 1, 1),
(2, 1, 'super.dashboard', '/super/dashboard', '대시보드', '시스템 전체 통계 조회', 1, 1),
(3, 1, 'super.tenants', '/tenants', '테넌트 관리', '테넌트(회사) 생성/수정/삭제', 1, 2),
(4, 1, 'super.pages', '/permissions/admin/pages', '페이지 관리', 'RBAC 페이지 CRUD', 1, 3),
(5, 1, 'super.actions', '/permissions/admin/actions', '액션 관리', 'RBAC 액션 CRUD', 1, 4),
(6, 1, 'super.permissions', '/permissions/admin/permissions', '권한 관리', 'RBAC 권한 CRUD', 1, 5),
-- 사용자 & 권한 관리 그룹
(12, NULL, 'user_management', '/user-management', '사용자 & 권한', '사용자, 역할, 권한 관리 메뉴 그룹', 1, 10),
(7, 12, 'roles', '/roles', '역할', '역할 생성/수정/삭제 및 권한 할당', 1, 1),
(8, 12, 'users', '/users', '사용자', '사용자 생성/수정/삭제 및 역할 할당', 1, 2),
(9, 12, 'permissions', '/permissions/catalog', '권한 카탈로그', '권한 목록 조회 (역할 할당용)', 1, 3),
-- 생성 및 시스템 관리 그룹
(13, NULL, 'system_management', '/system-management', '생성 및 시스템 관리', '테넌트 상태, 보안, 웹사이트 관리 메뉴 그룹', 1, 20),
(10, 13, 'tenants.status', '/tenants/status', '테넌트 상태', '테넌트별 커스텀 상태 관리 (상담, 주문 등)', 1, 1),
(14, 13, 'security', '/security', '보안', 'IP, 전화번호, 단어 차단 등 보안 관리', 1, 2),
(11, 13, 'websites', '/websites', '웹사이트', '웹사이트 등록/수정/삭제 및 활성화 관리', 1, 3);

-- Permissions
INSERT INTO permissions (permission_id, page_id, action_id, display_name, description, is_active) VALUES
-- super
(1, 1, 1, '슈퍼 관리자 메뉴 접근', '슈퍼 관리자 카테고리 접근', 1),
(2, 2, 1, '슈퍼 대시보드 조회', '시스템 전체 통계 조회', 1),
(3, 3, 1, '테넌트 조회', '테넌트 목록 및 상세 조회', 1),
(4, 3, 2, '테넌트 생성', '새 테넌트 생성', 1),
(5, 3, 3, '테넌트 수정', '테넌트 정보 및 상태 수정', 1),
(6, 3, 4, '테넌트 삭제', '테넌트 삭제', 1),
(7, 4, 1, '페이지 조회', 'RBAC 페이지 목록 조회', 1),
(8, 4, 2, '페이지 생성', 'RBAC 페이지 생성', 1),
(9, 4, 3, '페이지 수정', 'RBAC 페이지 수정', 1),
(10, 4, 4, '페이지 삭제', 'RBAC 페이지 삭제', 1),
(11, 5, 1, '액션 조회', 'RBAC 액션 목록 조회', 1),
(12, 5, 2, '액션 생성', 'RBAC 액션 생성', 1),
(13, 5, 3, '액션 수정', 'RBAC 액션 수정', 1),
(14, 5, 4, '액션 삭제', 'RBAC 액션 삭제', 1),
(15, 6, 1, '권한 조회', 'RBAC 권한 목록 조회', 1),
(16, 6, 2, '권한 생성', 'RBAC 권한 생성', 1),
(17, 6, 3, '권한 수정', 'RBAC 권한 수정', 1),
(18, 6, 4, '권한 삭제', 'RBAC 권한 삭제', 1),
-- user_management
(36, 12, 1, '사용자 & 권한 메뉴 접근', '사용자 & 권한 관리 카테고리 접근', 1),
(19, 7, 1, '역할 조회', '역할 목록 및 상세 조회', 1),
(20, 7, 2, '역할 생성', '새 역할 생성', 1),
(21, 7, 3, '역할 수정', '역할 정보, 상태, 권한 할당 수정', 1),
(22, 7, 4, '역할 삭제', '역할 삭제', 1),
(23, 8, 1, '사용자 조회', '사용자 목록 및 상세 조회', 1),
(24, 8, 2, '사용자 생성', '새 사용자 생성', 1),
(25, 8, 3, '사용자 수정', '사용자 정보, 상태, 비밀번호, 토큰 관리', 1),
(26, 8, 4, '사용자 삭제', '사용자 삭제', 1),
(27, 9, 1, '권한 카탈로그 조회', '역할에 할당할 권한 목록 조회', 1),
-- system_management
(37, 13, 1, '생성 및 시스템 관리 메뉴 접근', '생성 및 시스템 관리 카테고리 접근', 1),
-- tenants.status
(28, 10, 1, '테넌트 상태 조회', '테넌트 커스텀 상태 목록 및 상세 조회', 1),
(29, 10, 2, '테넌트 상태 생성', '새 테넌트 상태 생성', 1),
(30, 10, 3, '테넌트 상태 수정', '테넌트 상태 정보 및 활성화 여부 수정', 1),
(31, 10, 4, '테넌트 상태 삭제', '테넌트 상태 삭제', 1),
(38, 14, 1, '보안 조회', 'IP, 전화번호, 단어 차단 목록 조회', 1),
(39, 14, 2, '보안 생성', 'IP, 전화번호, 단어 차단 등록', 1),
(40, 14, 3, '보안 수정', 'IP, 전화번호, 단어 차단 정보 수정', 1),
(41, 14, 4, '보안 삭제', 'IP, 전화번호, 단어 차단 삭제', 1),
(32, 11, 1, '웹사이트 조회', '웹사이트 목록 및 상세 조회', 1),
(33, 11, 2, '웹사이트 생성', '새 웹사이트 등록', 1),
(34, 11, 3, '웹사이트 수정', '웹사이트 정보 및 활성화 여부 수정', 1),
(35, 11, 4, '웹사이트 삭제', '웹사이트 삭제', 1);

-- Tenants
INSERT INTO tenants (tenant_id, tenant_name, display_name, domain, is_active) VALUES
(1, 'system', '시스템 관리', 'system.flowdesk.com', 1),
(2, 'demo_company', '데모 업체', 'demo.flowdesk.com', 1);

-- Roles
INSERT INTO roles (role_id, role_name, display_name, description, tenant_id, is_active) VALUES
(1, 'super_admin', '슈퍼 관리자', '시스템 전체 관리 권한을 가진 최고 관리자', 1, 1),
(2, 'tenant_admin', '업체 관리자', '업체 내 전체 관리 권한을 가진 관리자 (슈퍼 기능 제외)', 2, 1);

-- Role-Permissions (슈퍼 관리자)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(1, 7), (1, 8), (1, 9), (1, 10),
(1, 11), (1, 12), (1, 13), (1, 14),
(1, 15), (1, 16), (1, 17), (1, 18),
(1, 36), (1, 19), (1, 20), (1, 21), (1, 22),
(1, 23), (1, 24), (1, 25), (1, 26), (1, 27),
(1, 37), (1, 28), (1, 29), (1, 30), (1, 31),
(1, 38), (1, 39), (1, 40), (1, 41),
(1, 32), (1, 33), (1, 34), (1, 35);

-- Role-Permissions (업체 관리자)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 36), (2, 19), (2, 20), (2, 21), (2, 22),
(2, 23), (2, 24), (2, 25), (2, 26), (2, 27),
(2, 37), (2, 28), (2, 29), (2, 30), (2, 31),
(2, 38), (2, 39), (2, 40), (2, 41),
(2, 32), (2, 33), (2, 34), (2, 35);

-- Users (비밀번호: Admin123)
INSERT INTO users (user_seq, user_id, user_pwd, corp_name, user_name, user_email, is_active, token_version, tenant_id) VALUES
(1, 'admin', '$2b$10$9rA9MxvnnimvtGGbHkx5w.IDOw3oh0V1kGq4hEdKtuzcoVgrlHIP2', 'FlowDesk', '슈퍼 관리자', 'admin@flowdesk.com', 1, 0, 1),
(2, 'tenant_admin', '$2b$10$9rA9MxvnnimvtGGbHkx5w.IDOw3oh0V1kGq4hEdKtuzcoVgrlHIP2', '데모 업체', '업체 관리자', 'tenant@demo.com', 1, 0, 2);

-- User-Roles
INSERT INTO user_roles (user_seq, tenant_id, role_id) VALUES
(1, 1, 1),
(2, 2, 2);

-- Tenant Status (샘플)
INSERT INTO tenant_status (tenant_id, status_group, status_key, status_name, description, color, sort_order, is_active) VALUES
(1, 'counsel', 'NEW',         '신규접수',   '상담이 새로 접수된 상태',                 '#64748B', 10, 1),
(1, 'counsel', 'TRY_CONTACT', '연락시도',   '연락을 시도했으나 아직 연결되지 않음',     '#F59E0B', 20, 1),
(1, 'counsel', 'CONTACTED',   '연락완료',   '고객과 연결되어 기본 상담이 진행됨',       '#3B82F6', 30, 1),
(1, 'counsel', 'SCHEDULED',   '상담예약',   '상담 일정이 확정됨',                       '#8B5CF6', 40, 1),
(1, 'counsel', 'IN_PROGRESS', '상담진행중', '제안/견적/상세 상담 단계',                 '#0EA5E9', 50, 1),
(1, 'counsel', 'HOLD',        '보류',       '일시 대기(추후 재접촉/재개 예정)',          '#A3A3A3', 60, 1),
(1, 'counsel', 'WON',         '계약/전환',  '상담 결과 전환/계약/결제로 완료',           '#22C55E', 70, 1),
(1, 'counsel', 'LOST',        '미전환',     '상담 종료(전환 실패)',                      '#EF4444', 80, 1),
(1, 'counsel', 'NO_SHOW',     '노쇼',       '예약 후 미참석/연락두절',                   '#F97316', 90, 1),
(1, 'counsel', 'DUPLICATE',   '중복',       '동일 고객의 중복 신청으로 분리 처리',       '#FB7185', 95, 1),
(1, 'counsel', 'SPAM',        '스팸/무의미','스팸/봇/장난 등 처리 대상',                '#111827', 99, 1);

-- 트랜잭션 커밋
COMMIT;

-- 외래 키 체크 복원
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- ============================================================
-- 최종 결과 확인
-- ============================================================
SELECT '✅ 데이터 초기화 및 재생성 완료!' AS 'Status';
SELECT '' AS '';
SELECT '📊 생성된 데이터 요약' AS '';
SELECT COUNT(*) as 'Actions' FROM actions;
SELECT COUNT(*) as 'Pages' FROM pages;
SELECT COUNT(*) as 'Permissions' FROM permissions;
SELECT COUNT(*) as 'Tenants' FROM tenants;
SELECT COUNT(*) as 'Roles' FROM roles;
SELECT COUNT(*) as 'Users' FROM users;
SELECT COUNT(*) as 'Role-Permissions' FROM role_permissions;
SELECT COUNT(*) as 'User-Roles' FROM user_roles;
SELECT COUNT(*) as 'Tenant Status' FROM tenant_status;

SELECT '' AS '';
SELECT '🔑 로그인 정보' AS '';
SELECT 'admin / Admin123 (슈퍼 관리자)' AS 'Account 1';
SELECT 'tenant_admin / Admin123 (업체 관리자)' AS 'Account 2';
