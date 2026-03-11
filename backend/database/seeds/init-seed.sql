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
--   9. Tenant Status (테넌트 커스텀 상태)
--  10. Boards 모듈 (게시판 타입 관리 & 게시글 관리)
--  11. Websites (웹사이트/상담 채널)
--  12. Code Groups & Codes (공통 코드)
--  13. Security - Block IP (IP 차단)
--  14. Security - Block HP (휴대폰 번호 차단)
--  15. Security - Block Word (금칙어 차단)
--  16. Counsel Field Definitions (상담 동적 필드 정의)
--  17. Counsels (상담 데이터)
--  18. Counsel Field Values (상담 필드값)
--  19. Counsel Logs (상담 상태 변경 이력)
--  20. Counsel Memo Logs (상담 메모 이력)
--
-- 생성일: 2026-01-27
-- 최종 수정: 2026-03-11 (웹사이트/보안/상담/공통코드 목데이터 추가)
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
-- 사용자 & 권한 관리 그룹 (부모 페이지)
(12, NULL, 'user_management', '/user-management', '사용자 & 권한', '사용자, 역할, 권한 관리 메뉴 그룹', 1, 10),

-- 사용자 & 권한 하위 페이지 (parent_id = 12)
(7, 12, 'roles', '/roles', '역할 관리', '역할 생성/수정/삭제 및 권한 할당', 1, 1),
(8, 12, 'users', '/users', '사용자 관리', '사용자 생성/수정/삭제 및 역할 할당', 1, 2),
(9, 12, 'permissions', '/permissions/catalog', '권한 카탈로그', '권한 목록 조회 (역할 할당용)', 1, 3),

-- 생성 및 시스템 관리 그룹 (부모 페이지)
(13, NULL, 'system_management', '/system-management', '시스템 관리', '테넌트 상태, 보안, 웹사이트 관리 메뉴 그룹', 1, 20),

-- 생성 및 시스템 관리 하위 페이지 (parent_id = 13)
(10, 13, 'tenants.status', '/tenants/status', '테넌트 상태 관리', '테넌트별 커스텀 상태 관리 (상담, 주문 등)', 1, 1),
(14, 13, 'security', '/security', '차단 관리', 'IP, 전화번호, 단어 차단 등 보안 관리', 1, 2),
(11, 13, 'websites', '/websites', '웹사이트 관리', '웹사이트 등록/수정/삭제 및 활성화 관리', 1, 3),
(15, 13, 'board_types', '/boards', '게시판 타입 관리', '게시판 종류 생성/수정/삭제 (공지사항, FAQ 등)', 1, 4),

-- 콘텐츠 관리 그룹 (부모 페이지)
(16, NULL, 'content_management', '/content-management', '콘텐츠 관리', '게시판, 게시글 등 콘텐츠 작성 및 관리', 1, 30),

-- 콘텐츠 관리 하위 페이지 (parent_id = 16)
(17, 16, 'boards.posts', '/boards/:boardId/posts', '게시글', '게시글 작성/조회/수정/삭제', 1, 1),

-- 상담 관리 그룹 (부모 페이지)
(18, NULL, 'counsel_management', '/counsel-management', '상담 관리', '상담 접수/상태 관리/필드 정의/메모 관리', 1, 40),

-- 상담 관리 하위 페이지 (parent_id = 18)
(19, 18, 'counsels', '/counsels', '상담 목록', '상담 접수 내역 조회/상태 변경/메모 관리', 1, 1),
(20, 18, 'counsel_fields', '/counsels/fields', '상담 필드 정의', '상담 동적 필드 관리 (EAV 패턴)', 1, 2)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 3. Permissions (Page + Action 조합)
-- ============================================================
INSERT INTO permissions (permission_id, page_id, action_id, display_name, description, is_active) VALUES
-- super (부모 페이지 - read만) - page_id = 1
(1, 1, 1, '슈퍼 관리자 메뉴 접근', '슈퍼 관리자 카테고리 접근', 1),

-- super.dashboard (대시보드는 read만) - page_id = 2
(2, 2, 1, '슈퍼 대시보드 조회', '시스템 전체 통계 조회', 1),

-- super.tenants (CRUD) - page_id = 3
(3, 3, 1, '테넌트 조회', '테넌트 목록 및 상세 조회', 1),
(4, 3, 2, '테넌트 생성', '새 테넌트 생성', 1),
(5, 3, 3, '테넌트 수정', '테넌트 정보 및 상태 수정', 1),
(6, 3, 4, '테넌트 삭제', '테넌트 삭제', 1),

-- super.pages (CRUD) - page_id = 4
(7, 4, 1, '페이지 조회', 'RBAC 페이지 목록 조회', 1),
(8, 4, 2, '페이지 생성', 'RBAC 페이지 생성', 1),
(9, 4, 3, '페이지 수정', 'RBAC 페이지 수정', 1),
(10, 4, 4, '페이지 삭제', 'RBAC 페이지 삭제', 1),

-- super.actions (CRUD) - page_id = 5
(11, 5, 1, '액션 조회', 'RBAC 액션 목록 조회', 1),
(12, 5, 2, '액션 생성', 'RBAC 액션 생성', 1),
(13, 5, 3, '액션 수정', 'RBAC 액션 수정', 1),
(14, 5, 4, '액션 삭제', 'RBAC 액션 삭제', 1),

-- super.permissions (CRUD) - page_id = 6
(15, 6, 1, '권한 조회', 'RBAC 권한 목록 조회', 1),
(16, 6, 2, '권한 생성', 'RBAC 권한 생성', 1),
(17, 6, 3, '권한 수정', 'RBAC 권한 수정', 1),
(18, 6, 4, '권한 삭제', 'RBAC 권한 삭제', 1),

-- user_management (부모 페이지 접근) - page_id = 12
(36, 12, 1, '사용자 & 권한 메뉴 접근', '사용자 & 권한 관리 카테고리 접근', 1),

-- roles (CRUD) - page_id = 7
(19, 7, 1, '역할 조회', '역할 목록 및 상세 조회', 1),
(20, 7, 2, '역할 생성', '새 역할 생성', 1),
(21, 7, 3, '역할 수정', '역할 정보, 상태, 권한 할당 수정', 1),
(22, 7, 4, '역할 삭제', '역할 삭제', 1),

-- users (CRUD) - page_id = 8
(23, 8, 1, '사용자 조회', '사용자 목록 및 상세 조회', 1),
(24, 8, 2, '사용자 생성', '새 사용자 생성', 1),
(25, 8, 3, '사용자 수정', '사용자 정보, 상태, 비밀번호, 토큰 관리', 1),
(26, 8, 4, '사용자 삭제', '사용자 삭제', 1),

-- permissions catalog (read만) - page_id = 9
(27, 9, 1, '권한 카탈로그 조회', '역할에 할당할 권한 목록 조회', 1),

-- system_management (부모 페이지 접근) - page_id = 13
(37, 13, 1, '생성 및 시스템 관리 메뉴 접근', '생성 및 시스템 관리 카테고리 접근', 1),

-- tenants.status (CRUD) - page_id = 10
(28, 10, 1, '테넌트 상태 조회', '테넌트 커스텀 상태 목록 및 상세 조회', 1),
(29, 10, 2, '테넌트 상태 생성', '새 테넌트 상태 생성', 1),
(30, 10, 3, '테넌트 상태 수정', '테넌트 상태 정보 및 활성화 여부 수정', 1),
(31, 10, 4, '테넌트 상태 삭제', '테넌트 상태 삭제', 1),

-- security (CRUD) - page_id = 14
(38, 14, 1, '보안 조회', 'IP, 전화번호, 단어 차단 목록 조회', 1),
(39, 14, 2, '보안 생성', 'IP, 전화번호, 단어 차단 등록', 1),
(40, 14, 3, '보안 수정', 'IP, 전화번호, 단어 차단 정보 수정', 1),
(41, 14, 4, '보안 삭제', 'IP, 전화번호, 단어 차단 삭제', 1),

-- websites (CRUD) - page_id = 11
(32, 11, 1, '웹사이트 조회', '웹사이트 목록 및 상세 조회', 1),
(33, 11, 2, '웹사이트 생성', '새 웹사이트 등록', 1),
(34, 11, 3, '웹사이트 수정', '웹사이트 정보 및 활성화 여부 수정', 1),
(35, 11, 4, '웹사이트 삭제', '웹사이트 삭제', 1),

-- content_management (부모 페이지 접근) - page_id = 16
(42, 16, 1, '콘텐츠 관리 메뉴 접근', '콘텐츠 관리 카테고리 접근', 1),

-- board_types (게시판 타입 CRUD) - page_id = 15
(43, 15, 1, '게시판 타입 조회', '게시판 종류 목록 및 상세 조회', 1),
(44, 15, 2, '게시판 타입 생성', '새 게시판 종류 생성 (공지사항, FAQ 등)', 1),
(45, 15, 3, '게시판 타입 수정', '게시판 종류 정보, 정렬 순서, 활성화 상태 수정', 1),
(46, 15, 4, '게시판 타입 삭제', '게시판 종류 비활성화 (논리 삭제)', 1),

-- boards.posts (게시글 CRUD) - page_id = 17
(47, 17, 1, '게시글 조회', '게시글 목록 및 상세 조회', 1),
(48, 17, 2, '게시글 생성', '새 게시글 작성', 1),
(49, 17, 3, '게시글 수정', '게시글 내용 및 상태 수정', 1),
(50, 17, 4, '게시글 삭제', '게시글 소프트 삭제', 1),

-- counsel_management (부모 페이지 접근) - page_id = 18
(51, 18, 1, '상담 관리 메뉴 접근', '상담 관리 카테고리 접근', 1),

-- counsels (CRUD) - page_id = 19
(52, 19, 1, '상담 조회', '상담 목록 및 상세 조회', 1),
(53, 19, 2, '상담 생성', '상담 수동 접수 (관리자)', 1),
(54, 19, 3, '상담 수정', '상담 상태 변경, 메모 작성, 필드값 수정', 1),
(55, 19, 4, '상담 삭제', '상담 소프트 삭제', 1),

-- counsel_fields (CRUD) - page_id = 20
(56, 20, 1, '상담 필드 조회', '상담 동적 필드 목록 조회', 1),
(57, 20, 2, '상담 필드 생성', '새 상담 필드 정의 생성', 1),
(58, 20, 3, '상담 필드 수정', '상담 필드 정의 수정', 1),
(59, 20, 4, '상담 필드 삭제', '상담 필드 정의 삭제', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 4. Tenants (테넌트 정의)
-- ============================================================
-- 시스템 테넌트 (슈퍼 관리자용, tenant_id = 1, tenant_name = 'system')
-- 샘플 업체 테넌트 (tenant_id = 2)
INSERT INTO tenants (tenant_id, tenant_name, display_name, domain, is_active) VALUES
(1, 'system', '시스템 관리', 'system.flowdesk.com', 1),
(2, 'demo_company', '데모 업체', 'demo.flowdesk.com', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ============================================================
-- 5. Roles (역할 정의)
-- ============================================================
-- 슈퍼 관리자 역할 (시스템 테넌트 소속)
-- 업체 관리자 역할 (업체 테넌트 소속)
INSERT INTO roles (role_id, role_name, display_name, description, tenant_id, is_active) VALUES
(1, 'super_admin', '슈퍼 관리자', '시스템 전체 관리 권한을 가진 최고 관리자', 1, 1),
(2, 'tenant_admin', '업체 관리자', '업체 내 전체 관리 권한을 가진 관리자 (슈퍼 기능 제외)', 2, 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 6. Role-Permissions (역할-권한 매핑)
-- ============================================================
-- 슈퍼 관리자에게 모든 권한 부여
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- super (부모 페이지 접근)
(1, 1),
-- super.dashboard
(1, 2),
-- super.tenants (CRUD)
(1, 3), (1, 4), (1, 5), (1, 6),
-- super.pages (CRUD)
(1, 7), (1, 8), (1, 9), (1, 10),
-- super.actions (CRUD)
(1, 11), (1, 12), (1, 13), (1, 14),
-- super.permissions (CRUD)
(1, 15), (1, 16), (1, 17), (1, 18),
-- user_management (부모 페이지 접근)
(1, 36),
-- roles (CRUD)
(1, 19), (1, 20), (1, 21), (1, 22),
-- users (CRUD)
(1, 23), (1, 24), (1, 25), (1, 26),
-- permissions catalog
(1, 27),
-- system_management (부모 페이지 접근)
(1, 37),
-- tenants.status (CRUD)
(1, 28), (1, 29), (1, 30), (1, 31),
-- security (CRUD)
(1, 38), (1, 39), (1, 40), (1, 41),
-- websites (CRUD)
(1, 32), (1, 33), (1, 34), (1, 35),
-- content_management (부모 페이지 접근)
(1, 42),
-- board_types (CRUD)
(1, 43), (1, 44), (1, 45), (1, 46),
-- boards.posts (CRUD)
(1, 47), (1, 48), (1, 49), (1, 50),
-- counsel_management (부모 페이지 접근)
(1, 51),
-- counsels (CRUD)
(1, 52), (1, 53), (1, 54), (1, 55),
-- counsel_fields (CRUD)
(1, 56), (1, 57), (1, 58), (1, 59),

-- 업체 관리자 권한 (super.* 제외)
-- user_management (부모 페이지 접근)
(2, 36),
-- roles (CRUD)
(2, 19), (2, 20), (2, 21), (2, 22),
-- users (CRUD)
(2, 23), (2, 24), (2, 25), (2, 26),
-- permissions catalog
(2, 27),
-- system_management (부모 페이지 접근)
(2, 37),
-- tenants.status (CRUD)
(2, 28), (2, 29), (2, 30), (2, 31),
-- security (CRUD)
(2, 38), (2, 39), (2, 40), (2, 41),
-- websites (CRUD)
(2, 32), (2, 33), (2, 34), (2, 35),
-- content_management (부모 페이지 접근)
(2, 42),
-- board_types (CRUD)
(2, 43), (2, 44), (2, 45), (2, 46),
-- boards.posts (CRUD)
(2, 47), (2, 48), (2, 49), (2, 50),
-- counsel_management (부모 페이지 접근)
(2, 51),
-- counsels (CRUD)
(2, 52), (2, 53), (2, 54), (2, 55),
-- counsel_fields (CRUD)
(2, 56), (2, 57), (2, 58), (2, 59)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- ============================================================
-- 7. Users (관리자 계정)
-- ============================================================
-- 비밀번호: Admin123 (bcrypt 해시)
INSERT INTO users (user_seq, user_id, user_pwd, corp_name, user_name, user_email, is_active, token_version, tenant_id) VALUES
(1, 'admin', '$2b$10$9rA9MxvnnimvtGGbHkx5w.IDOw3oh0V1kGq4hEdKtuzcoVgrlHIP2', 'FlowDesk', '슈퍼 관리자', 'admin@flowdesk.com', 1, 0, 1),
(2, 'tenant_admin', '$2b$10$9rA9MxvnnimvtGGbHkx5w.IDOw3oh0V1kGq4hEdKtuzcoVgrlHIP2', '데모 업체', '업체 관리자', 'tenant@demo.com', 1, 0, 2)
ON DUPLICATE KEY UPDATE user_name = VALUES(user_name);

-- ============================================================
-- 8. User-Roles (사용자-역할 매핑)
-- ============================================================
INSERT INTO user_roles (user_seq, tenant_id, role_id) VALUES
(1, 1, 1),  -- admin 사용자에게 super_admin 역할 부여
(2, 2, 2)   -- tenant_admin 사용자에게 tenant_admin 역할 부여
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- ============================================================
-- 9. Tenant Status (테넌트 커스텀 상태 - 상담용 샘플)
-- ============================================================
INSERT INTO tenant_status
(tenant_id, status_group, status_key, status_name, description, color, sort_order, is_active)
VALUES
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
(1, 'counsel', 'SPAM',        '스팸/무의미','스팸/봇/장난 등 처리 대상',                '#111827', 99, 1),
-- demo_company (tenant_id = 2)
(2, 'counsel', 'NEW',         '신규접수',   '상담이 새로 접수된 상태',                 '#64748B', 10, 1),
(2, 'counsel', 'TRY_CONTACT', '연락시도',   '연락을 시도했으나 아직 연결되지 않음',     '#F59E0B', 20, 1),
(2, 'counsel', 'CONTACTED',   '연락완료',   '고객과 연결되어 기본 상담이 진행됨',       '#3B82F6', 30, 1),
(2, 'counsel', 'SCHEDULED',   '상담예약',   '상담 일정이 확정됨',                       '#8B5CF6', 40, 1),
(2, 'counsel', 'IN_PROGRESS', '상담진행중', '제안/견적/상세 상담 단계',                 '#0EA5E9', 50, 1),
(2, 'counsel', 'HOLD',        '보류',       '일시 대기(추후 재접촉/재개 예정)',          '#A3A3A3', 60, 1),
(2, 'counsel', 'WON',         '계약/전환',  '상담 결과 전환/계약/결제로 완료',           '#22C55E', 70, 1),
(2, 'counsel', 'LOST',        '미전환',     '상담 종료(전환 실패)',                      '#EF4444', 80, 1),
(2, 'counsel', 'NO_SHOW',     '노쇼',       '예약 후 미참석/연락두절',                   '#F97316', 90, 1),
(2, 'counsel', 'DUPLICATE',   '중복',       '동일 고객의 중복 신청으로 분리 처리',       '#FB7185', 95, 1),
(2, 'counsel', 'SPAM',        '스팸/무의미','스팸/봇/장난 등 처리 대상',                '#111827', 99, 1)
ON DUPLICATE KEY UPDATE status_name = VALUES(status_name), description = VALUES(description);

-- ============================================================
-- 10. Boards & Posts (게시판 및 게시글 샘플 데이터)
-- ============================================================

-- Board (게시판 타입 샘플 데이터)
-- tenant_id = 1 (system - 슈퍼 관리자용)
INSERT INTO board (board_id, tenant_id, board_key, name, description, sort_order, is_active) VALUES
(1, 1, 'notice', '공지사항', '시스템 전체 공지사항 게시판', 10, 1),
(2, 1, 'faq', 'FAQ', '시스템 관련 자주 묻는 질문', 20, 1),
(3, 1, 'news', '뉴스', '시스템 업데이트 및 소식', 30, 1),
(4, 1, 'event', '이벤트', '시스템 이벤트 및 행사 안내', 40, 1),
(5, 1, 'qna', 'Q&A', '시스템 관리 질의응답', 50, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- tenant_id = 2 (demo_company - 데모 업체용)
INSERT INTO board (board_id, tenant_id, board_key, name, description, sort_order, is_active) VALUES
(6, 2, 'notice', '공지사항', '회사 전체 공지사항 게시판', 10, 1),
(7, 2, 'faq', 'FAQ', '자주 묻는 질문과 답변', 20, 1),
(8, 2, 'news', '뉴스', '업계 뉴스 및 회사 소식', 30, 1),
(9, 2, 'event', '이벤트', '사내외 이벤트 및 행사 안내', 40, 1),
(10, 2, 'qna', 'Q&A', '일반 질의응답 게시판', 50, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Post (게시글 샘플 데이터)
-- tenant_id = 1 (system), user_seq = 1 (admin)
INSERT INTO post (post_id, board_id, tenant_id, user_seq, title, content, is_notice, is_active, start_dtm, end_dtm, delete_state) VALUES
-- 공지사항 게시판 (board_id = 1)
(1, 1, 1, 1, '시스템 운영 정책 안내', '<h2>시스템 운영 정책</h2><p>모든 테넌트께 알려드립니다.</p><ul><li>서버 점검: 매월 첫째주 월요일</li><li>백업: 매일 03:00</li></ul>', 1, 1, NULL, NULL, 'N'),
(2, 1, 1, 1, '3월 정기 점검 안내', '<p>시스템 정기 점검이 진행됩니다.</p><p><strong>일시:</strong> 2026년 3월 15일 02:00 ~ 06:00</p>', 1, 1, '2026-03-01 00:00:00', '2026-03-15 23:59:59', 'N'),
(3, 1, 1, 1, '신규 기능 업데이트', '<p>새로운 기능이 추가되었습니다.</p><p>자세한 내용은 릴리즈 노트를 참고하세요.</p>', 0, 1, NULL, NULL, 'N'),

-- FAQ 게시판 (board_id = 2)
(4, 2, 1, 1, '멀티 테넌트 구조란?', '<h3>Q: 멀티 테넌트 구조가 무엇인가요?</h3><p><strong>A:</strong> 하나의 시스템에서 여러 조직을 독립적으로 관리하는 구조입니다.</p>', 0, 1, NULL, NULL, 'N'),
(5, 2, 1, 1, 'RBAC 권한 관리', '<h3>Q: RBAC는 어떻게 작동하나요?</h3><p><strong>A:</strong> 역할 기반 접근 제어로, 페이지와 액션을 조합하여 권한을 부여합니다.</p>', 0, 1, NULL, NULL, 'N'),
(6, 2, 1, 1, '테넌트 추가 방법', '<h3>Q: 새 테넌트를 추가하려면?</h3><p><strong>A:</strong> 슈퍼 관리자 > 테넌트 관리에서 추가할 수 있습니다.</p>', 0, 1, NULL, NULL, 'N'),

-- 뉴스 게시판 (board_id = 3)
(7, 3, 1, 1, 'v2.0 릴리즈 노트', '<p>시스템 버전 2.0이 출시되었습니다. 주요 기능을 확인하세요.</p>', 0, 1, NULL, NULL, 'N'),
(8, 3, 1, 1, '보안 패치 적용 완료', '<p>최신 보안 패치가 적용되었습니다. 안전하게 이용하실 수 있습니다.</p>', 0, 1, NULL, NULL, 'N'),

-- 이벤트 게시판 (board_id = 4)
(9, 4, 1, 1, '시스템 관리자 교육', '<h2>관리자 교육 프로그램</h2><p><strong>일시:</strong> 3월 25일 14:00<br><strong>장소:</strong> 온라인</p>', 1, 1, '2026-03-01 00:00:00', '2026-03-25 23:59:59', 'N'),
(10, 4, 1, 1, '베타 테스터 모집', '<p>신규 기능 베타 테스터를 모집합니다.</p><p>관심 있으신 분은 신청해주세요.</p>', 0, 1, NULL, NULL, 'N'),

-- Q&A 게시판 (board_id = 5)
(11, 5, 1, 1, 'API 문서는 어디서 볼 수 있나요?', '<p>API 문서 위치가 궁금합니다.</p>', 0, 1, NULL, NULL, 'N'),
(12, 5, 1, 1, '데이터베이스 백업 주기', '<p>데이터베이스 백업은 어떤 주기로 이루어지나요?</p>', 0, 1, NULL, NULL, 'N'),

-- tenant_id = 2 (demo_company), user_seq = 2 (tenant_admin)
-- 공지사항 게시판 (board_id = 6)
(13, 6, 2, 2, '2026년 3월 전사 공지사항', '<h2>3월 전사 공지사항</h2><p>전 직원께 알려드립니다.</p><ul><li>3월 15일: 정기 점검</li><li>3월 20일: 워크샵</li></ul>', 1, 1, NULL, NULL, 'N'),
(14, 6, 2, 2, '시스템 점검 안내', '<p>시스템 정기 점검이 진행됩니다.</p><p><strong>일시:</strong> 2026년 3월 15일 02:00 ~ 06:00</p>', 1, 1, '2026-03-01 00:00:00', '2026-03-15 23:59:59', 'N'),
(15, 6, 2, 2, '신규 서비스 출시 안내', '<p>새로운 기능이 추가되었습니다.</p><p>많은 이용 부탁드립니다.</p>', 0, 1, NULL, NULL, 'N'),

-- FAQ 게시판 (board_id = 7)
(16, 7, 2, 2, '로그인이 안돼요', '<h3>Q: 로그인이 안됩니다.</h3><p><strong>A:</strong> 비밀번호를 3회 이상 틀린 경우 계정이 잠길 수 있습니다. 관리자에게 문의해주세요.</p>', 0, 1, NULL, NULL, 'N'),
(17, 7, 2, 2, '비밀번호 변경 방법', '<h3>Q: 비밀번호를 변경하고 싶어요.</h3><p><strong>A:</strong> 마이페이지 > 계정설정 > 비밀번호 변경에서 가능합니다.</p>', 0, 1, NULL, NULL, 'N'),
(18, 7, 2, 2, '권한 요청 방법', '<h3>Q: 추가 권한이 필요합니다.</h3><p><strong>A:</strong> 관리자에게 권한 요청을 해주시면 검토 후 부여됩니다.</p>', 0, 1, NULL, NULL, 'N'),

-- 뉴스 게시판 (board_id = 8)
(19, 8, 2, 2, '업계 동향: AI 기술 발전', '<p>최근 AI 기술의 급격한 발전으로 업계에 많은 변화가 예상됩니다.</p>', 0, 1, NULL, NULL, 'N'),
(20, 8, 2, 2, '회사 수상 소식', '<p>우리 회사가 올해의 혁신 기업상을 수상했습니다!</p>', 0, 1, NULL, NULL, 'N'),

-- 이벤트 게시판 (board_id = 9)
(21, 9, 2, 2, '3월 워크샵 안내', '<h2>2026 상반기 워크샵</h2><p><strong>일시:</strong> 3월 20일 10:00<br><strong>장소:</strong> 본사 대강당</p>', 1, 1, '2026-03-01 00:00:00', '2026-03-20 23:59:59', 'N'),
(22, 9, 2, 2, '신입사원 환영회', '<p>신입사원 여러분을 환영합니다.</p><p>환영회는 3월 10일 저녁 6시에 진행됩니다.</p>', 0, 1, NULL, NULL, 'N'),

-- Q&A 게시판 (board_id = 10)
(23, 10, 2, 2, '회의실 예약은 어떻게 하나요?', '<p>회의실 예약 시스템 사용법이 궁금합니다.</p>', 0, 1, NULL, NULL, 'N'),
(24, 10, 2, 2, '휴가 신청 절차 문의', '<p>휴가 신청은 어떤 절차로 진행되나요?</p>', 0, 1, NULL, NULL, 'N')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================================
-- 11. Websites (웹사이트/상담 채널)
-- ============================================================
INSERT INTO websites (web_code, tenant_id, user_seq, web_url, web_title, web_img, web_desc, web_memo, is_active, duplicate_allow_after_days) VALUES
-- tenant_id = 1 (system)
('SYS001', 1, 1, 'https://flowdesk.com', 'FlowDesk 공식사이트', NULL, 'FlowDesk 메인 홈페이지', '시스템 기본 웹사이트', 1, 30),
('SYS002', 1, 1, 'https://blog.flowdesk.com', 'FlowDesk 블로그', NULL, '기술 블로그 및 상담 안내', NULL, 1, 14),
-- tenant_id = 2 (demo_company)
('DEMO01', 2, 2, 'https://demo-company.com', '데모 업체 홈페이지', NULL, '데모 업체 메인 사이트', '데모용 웹사이트', 1, 30),
('DEMO02', 2, 2, 'https://shop.demo-company.com', '데모 쇼핑몰', NULL, '데모 업체 온라인 쇼핑몰', NULL, 1, 7),
('DEMO03', 2, 2, 'https://landing.demo-company.com', '데모 랜딩페이지', NULL, '마케팅 캠페인 랜딩페이지', '이벤트용', 1, 60)
ON DUPLICATE KEY UPDATE web_title = VALUES(web_title);

-- ============================================================
-- 12. Code Groups & Codes (공통 코드)
-- ============================================================
INSERT INTO code_groups (code_group_id, code_group_key, code_group_name, description, is_active) VALUES
(1, 'COUNSEL_SOURCE', '상담 유입 경로', '상담 접수 시 유입 출처 분류', 1),
(2, 'COUNSEL_MEDIUM', '상담 유입 매체', '상담 접수 시 유입 매체 분류', 1),
(3, 'FIELD_TYPE', '필드 데이터 타입', '상담 동적 필드에서 사용 가능한 데이터 타입', 1)
ON DUPLICATE KEY UPDATE code_group_name = VALUES(code_group_name);

INSERT INTO codes (code_id, code_group_id, code_key, code_name, description, sort_order, is_active) VALUES
-- COUNSEL_SOURCE (code_group_id = 1)
(1,  1, 'google',   '구글',       '구글 검색 유입', 10, 1),
(2,  1, 'naver',    '네이버',     '네이버 검색 유입', 20, 1),
(3,  1, 'direct',   '직접 방문',  'URL 직접 입력', 30, 1),
(4,  1, 'referral', '추천/소개',  '지인 추천 또는 타사이트 링크', 40, 1),
(5,  1, 'social',   'SNS',        '소셜 미디어 유입', 50, 1),
(6,  1, 'ad',       '광고',       '유료 광고 유입', 60, 1),
-- COUNSEL_MEDIUM (code_group_id = 2)
(7,  2, 'cpc',      'CPC',        '클릭당 과금 광고', 10, 1),
(8,  2, 'organic',  '오가닉',     '자연 검색 유입', 20, 1),
(9,  2, 'email',    '이메일',     '이메일 마케팅', 30, 1),
(10, 2, 'social',   '소셜',       '소셜 미디어', 40, 1),
(11, 2, 'display',  '디스플레이', '배너 광고', 50, 1),
-- FIELD_TYPE (code_group_id = 3)
(12, 3, 'text',     '텍스트',     '문자열 입력 필드', 10, 1),
(13, 3, 'number',   '숫자',       '숫자 입력 필드', 20, 1),
(14, 3, 'date',     '날짜',       '날짜 선택 필드', 30, 1),
(15, 3, 'datetime', '날짜시간',   '날짜+시간 선택 필드', 40, 1),
(16, 3, 'select',   '선택',       '드롭다운 선택 필드', 50, 1)
ON DUPLICATE KEY UPDATE code_name = VALUES(code_name);

-- ============================================================
-- 13. Security - Block IP (IP 차단)
-- ============================================================
INSERT INTO block_ip (dbi_idx, tenant_id, block_ip, reason, is_active, created_by) VALUES
-- tenant_id = 1
(1, 1, '192.168.100.100', '스팸 반복 접수 IP', 1, 1),
(2, 1, '10.0.0.50', '무단 접근 시도 탐지', 1, 1),
-- tenant_id = 2
(3, 2, '203.0.113.10', '스팸 봇 활동 감지', 1, 2),
(4, 2, '198.51.100.25', '무차별 대입 공격 시도', 1, 2),
(5, 2, '172.16.0.99', 'DDoS 의심 트래픽 (비활성)', 0, 2)
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

-- ============================================================
-- 14. Security - Block HP (휴대폰 번호 차단)
-- ============================================================
INSERT INTO block_hp (dbh_idx, tenant_id, block_hp, reason, is_active, created_by) VALUES
-- tenant_id = 1
(1, 1, '010-0000-0000', '테스트 번호 차단', 1, 1),
(2, 1, '010-1234-5678', '스팸 전화번호 신고', 1, 1),
-- tenant_id = 2
(3, 2, '010-9999-9999', '악성 사용자 신고', 1, 2),
(4, 2, '010-1111-2222', '상담 도배 신고', 1, 2),
(5, 2, '010-0000-1111', '장난 접수 반복 (비활성)', 0, 2)
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

-- ============================================================
-- 15. Security - Block Word (금칙어 차단)
-- ============================================================
INSERT INTO block_word (dbw_idx, tenant_id, block_word, match_type, reason, is_active, created_by) VALUES
-- tenant_id = 1
(1, 1, '도박', 'CONTAINS', '도박 관련 키워드 차단', 1, 1),
(2, 1, '성인', 'CONTAINS', '성인 콘텐츠 관련 차단', 1, 1),
(3, 1, '^test[0-9]+$', 'REGEX', '테스트 패턴 자동 차단', 1, 1),
-- tenant_id = 2
(4, 2, '광고', 'CONTAINS', '광고성 스팸 차단', 1, 2),
(5, 2, '무료상담', 'EXACT', '경쟁사 키워드 정확 매칭 차단', 1, 2),
(6, 2, '대출', 'CONTAINS', '대출 스팸 키워드 차단', 1, 2),
(7, 2, '카지노', 'CONTAINS', '불법 도박 차단 (비활성)', 0, 2)
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

-- ============================================================
-- 16. Counsel Field Definitions (상담 동적 필드 정의)
-- ============================================================
INSERT INTO counsel_field_def (field_id, tenant_id, field_key, label, field_type, is_required, is_active, sort_order, placeholder, help_text, default_value, options_json) VALUES
-- tenant_id = 1 (system)
(1, 1, 'consultType',   '상담 유형',       'select',   1, 1, 10, '상담 유형을 선택하세요',      '문의 분류를 선택합니다',              NULL, '["일반문의","기술지원","요금문의","기타"]'),
(2, 1, 'preferredTime', '희망 연락 시간',  'text',     0, 1, 20, '예: 오전 10시~12시',          '고객이 선호하는 연락 시간대',          NULL, NULL),
(3, 1, 'budget',        '예산',            'number',   0, 1, 30, '예산을 입력하세요 (만원)',     '프로젝트 예상 예산',                  NULL, NULL),
(4, 1, 'visitDate',     '방문 희망일',     'date',     0, 1, 40, NULL,                          '방문 상담 희망일을 선택합니다',        NULL, NULL),
-- tenant_id = 2 (demo_company)
(5, 2, 'productInterest', '관심 상품',     'select',   1, 1, 10, '관심 상품을 선택하세요',       '고객이 관심 있는 상품',               NULL, '["상품A","상품B","상품C","상품D","기타"]'),
(6, 2, 'companyName',     '회사명',        'text',     0, 1, 20, '회사명을 입력하세요',          'B2B 고객의 회사명',                   NULL, NULL),
(7, 2, 'employeeCount',   '직원 수',       'number',   0, 1, 30, '직원 수를 입력하세요',         '회사 규모 파악용',                    NULL, NULL),
(8, 2, 'meetingDatetime',  '미팅 희망일시', 'datetime', 0, 1, 40, NULL,                          '미팅 희망 일시를 선택합니다',          NULL, NULL),
(9, 2, 'referralSource',  '유입 경로',     'select',   0, 1, 50, NULL,                          '어떻게 알게 되셨나요?',               NULL, '["검색엔진","SNS","지인추천","광고","기타"]')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- ============================================================
-- 17. Counsels (상담 데이터)
-- ============================================================
-- counsel_stat 은 tenant_status_id (auto-increment) 참조
-- tenant 1: NEW=1, TRY_CONTACT=2, CONTACTED=3, SCHEDULED=4, IN_PROGRESS=5,
--           HOLD=6, WON=7, LOST=8, NO_SHOW=9, DUPLICATE=10, SPAM=11
-- tenant 2: NEW=12, TRY_CONTACT=13, CONTACTED=14, SCHEDULED=15, IN_PROGRESS=16,
--           HOLD=17, WON=18, LOST=19, NO_SHOW=20, DUPLICATE=21, SPAM=22
INSERT INTO counsel (counsel_seq, tenant_id, web_code, name, counsel_hp, counsel_ip, counsel_stat, emp_seq, counsel_source, counsel_medium, counsel_campaign, counsel_resv_dtm, counsel_memo, duplicate_state, delete_state, reg_dtm) VALUES
-- ============================
-- tenant_id = 1 (system) — 20건
-- ============================
-- #1~5: 기존 데이터
(1,  1, 'SYS001', '김철수', '010-2345-6789', '211.34.56.78',  1,  1,    'google',   'cpc',     'spring_2026', NULL,                    '첫 상담 고객, 기술지원 문의',           'N', 'N', '2026-03-01 09:00:00'),
(2,  1, 'SYS001', '이영희', '010-3456-7890', '125.67.89.10',  3,  1,    'naver',    'organic', NULL,          NULL,                    '네이버 유입 - 요금 관련 문의',          'N', 'N', '2026-03-02 10:30:00'),
(3,  1, 'SYS002', '박지민', '010-4567-8901', '58.120.45.67',  4,  1,    'direct',   NULL,      NULL,          '2026-03-20 14:00:00',   '방문 상담 예약 확정',                   'N', 'N', '2026-03-03 11:00:00'),
(4,  1, 'SYS001', '최동현', '010-5678-9012', '175.200.10.20', 5,  1,    'referral', NULL,      NULL,          NULL,                    '기존 고객 소개, 견적서 준비 중',        'N', 'N', '2026-03-04 14:00:00'),
(5,  1, 'SYS001', '김철수', '010-2345-6789', '211.34.56.78',  10, NULL, 'google',   'cpc',     'spring_2026', NULL,                    NULL,                                    'Y', 'N', '2026-03-05 09:30:00'),
-- #13~27: 추가 데이터 (tenant 1)
(13, 1, 'SYS001', '오세훈', '010-1111-3333', '112.10.20.30',  1,  1,    'naver',    'cpc',     'march_ad',    NULL,                    '네이버 광고 유입, 첫 문의',             'N', 'N', '2026-03-05 10:00:00'),
(14, 1, 'SYS002', '장미라', '010-2222-4444', '203.55.12.99',  2,  1,    'google',   'organic', NULL,          NULL,                    '구글 자연유입 - 1회 연락 시도',         'N', 'N', '2026-03-05 11:30:00'),
(15, 1, 'SYS001', '한승우', '010-3333-5555', '150.80.40.21',  3,  1,    'social',   'social',  'insta_q1',    NULL,                    '인스타 광고 클릭 → 통화 완료',          'N', 'N', '2026-03-05 14:00:00'),
(16, 1, 'SYS001', '신지영', '010-4444-6666', '121.160.70.88', 4,  1,    'direct',   NULL,      NULL,          '2026-03-22 10:00:00',   '전화 상담 후 방문 예약 잡음',           'N', 'N', '2026-03-06 09:00:00'),
(17, 1, 'SYS002', '권도윤', '010-5555-7777', '58.123.45.67',  5,  1,    'referral', NULL,      NULL,          NULL,                    '지인 소개, 대형 외주 건 상담 중',       'N', 'N', '2026-03-06 10:30:00'),
(18, 1, 'SYS001', '조은별', '010-6666-8888', '180.230.12.34', 6,  1,    'naver',    'cpc',     'march_ad',    NULL,                    '예산 확보 대기, 4월 재연락 예정',       'N', 'N', '2026-03-06 13:00:00'),
(19, 1, 'SYS001', '류현진', '010-7777-9999', '211.50.60.70',  7,  1,    'google',   'cpc',     'spring_2026', NULL,                    '3년 유지보수 계약 체결 완료!',          'N', 'N', '2026-03-06 15:00:00'),
(20, 1, 'SYS002', '강해린', '010-8888-1010', '125.180.90.11', 8,  1,    'ad',       'display', 'banner_mar',  NULL,                    '배너 유입 - 3회 연락 끝에 미전환',      'N', 'N', '2026-03-07 09:00:00'),
(21, 1, 'SYS001', '임재현', '010-9999-2020', '175.200.30.40', 9,  NULL, 'direct',   NULL,      NULL,          '2026-03-18 14:00:00',   '예약 후 불참, 연락 두절',               'N', 'N', '2026-03-07 10:00:00'),
(22, 1, 'SYS001', '오세훈', '010-1111-3333', '112.10.20.30',  10, NULL, 'naver',    'cpc',     'march_ad',    NULL,                    NULL,                                    'Y', 'N', '2026-03-07 14:00:00'),
(23, 1, 'SYS001', '문서윤', '010-1010-3030', '58.70.80.90',   11, NULL, 'social',   'social',  NULL,          NULL,                    '스팸 의심 - 무의미한 내용 반복 접수',   'N', 'N', '2026-03-07 16:00:00'),
(24, 1, 'SYS002', '배준호', '010-2020-4040', '203.10.20.30',  1,  NULL, 'naver',    'organic', NULL,          NULL,                    '신규 접수 - 아직 미배정',               'N', 'N', '2026-03-08 08:30:00'),
(25, 1, 'SYS001', '서하은', '010-3030-5050', '121.130.40.50', 2,  1,    'google',   'cpc',     'spring_2026', NULL,                    '1차 연락, 부재중 - 재시도 필요',        'N', 'N', '2026-03-08 09:00:00'),
(26, 1, 'SYS001', '양지호', '010-4040-6060', '150.60.70.80',  3,  1,    'referral', NULL,      NULL,          NULL,                    '기술 데모 요청, 일정 조율 중',          'N', 'N', '2026-03-08 11:00:00'),
(27, 1, 'SYS002', '노은서', '010-5050-7070', '175.100.20.30', 7,  1,    'naver',    'cpc',     'march_ad',    NULL,                    '즉시 계약! 소규모 패키지 선택',         'N', 'N', '2026-03-08 14:00:00'),
-- ============================
-- tenant_id = 2 (demo_company) — 30건
-- ============================
-- #6~12: 기존 데이터
(6,  2, 'DEMO01', '정수진', '010-6789-0123', '61.74.123.45',  12, 2,    'naver',    'cpc',     'demo_spring', NULL,                    '신규 접수 - 상품A 관심',               'N', 'N', '2026-03-01 08:00:00'),
(7,  2, 'DEMO01', '한미영', '010-7890-1234', '220.95.67.89',  13, 2,    'google',   'organic', NULL,          NULL,                    '1차 연락 시도 - 부재중',               'N', 'N', '2026-03-02 09:00:00'),
(8,  2, 'DEMO02', '강태훈', '010-8901-2345', '123.45.78.90',  14, 2,    'social',   'social',  NULL,          NULL,                    'SNS 유입 - 통화 완료',                 'N', 'N', '2026-03-03 10:00:00'),
(9,  2, 'DEMO01', '윤서연', '010-9012-3456', '180.70.12.34',  15, 2,    'direct',   NULL,      NULL,          '2026-03-25 10:00:00',   '미팅 일정 확정, 회의실 예약 완료',      'N', 'N', '2026-03-04 11:00:00'),
(10, 2, 'DEMO02', '송민준', '010-0123-4567', '210.89.56.78',  18, 2,    'referral', NULL,      'partner_ref', NULL,                    '계약 완료! 상품D 30건 발주',           'N', 'N', '2026-03-05 14:00:00'),
(11, 2, 'DEMO03', '임하늘', '010-1234-0000', '59.12.34.56',   19, 2,    'ad',       'display', 'banner_q1',   NULL,                    '예산 부족으로 보류 후 미전환',          'N', 'N', '2026-03-06 09:00:00'),
(12, 2, 'DEMO01', '정수진', '010-6789-0123', '61.74.123.45',  21, NULL, 'naver',    'cpc',     'demo_spring', NULL,                    NULL,                                    'Y', 'N', '2026-03-07 08:30:00'),
-- #28~50: 추가 데이터 (tenant 2)
(28, 2, 'DEMO01', '김도현', '010-6060-8080', '61.80.90.10',   12, 2,    'naver',    'cpc',     'demo_spring', NULL,                    '네이버 광고 유입, 상품A 문의',          'N', 'N', '2026-03-07 09:00:00'),
(29, 2, 'DEMO02', '이서준', '010-7070-9090', '220.10.20.30',  12, NULL, 'google',   'organic', NULL,          NULL,                    '구글 검색 유입 - 미배정 대기',          'N', 'N', '2026-03-07 10:00:00'),
(30, 2, 'DEMO01', '박하윤', '010-8080-1010', '123.80.90.10',  13, 2,    'direct',   NULL,      NULL,          NULL,                    '직접 방문 문의, 1차 콜 부재중',         'N', 'N', '2026-03-07 11:00:00'),
(31, 2, 'DEMO03', '최준혁', '010-9090-2020', '180.30.40.50',  14, 2,    'social',   'social',  'fb_spring',   NULL,                    '페이스북 광고 유입 → 통화 완료',        'N', 'N', '2026-03-07 13:00:00'),
(32, 2, 'DEMO01', '정민서', '010-1212-3434', '210.40.50.60',  15, 2,    'naver',    'cpc',     'demo_spring', '2026-03-28 14:00:00',   '미팅 예약 확정 - 상품B 집중 상담',      'N', 'N', '2026-03-07 14:30:00'),
(33, 2, 'DEMO02', '오유진', '010-2323-4545', '59.50.60.70',   16, 2,    'google',   'cpc',     'gdn_march',   NULL,                    'GDN 유입 - 견적서 검토 중',             'N', 'N', '2026-03-07 15:00:00'),
(34, 2, 'DEMO01', '장세훈', '010-3434-5656', '61.70.80.90',   17, 2,    'referral', NULL,      NULL,          NULL,                    '거래처 소개, 예산 확보 후 재연락',      'N', 'N', '2026-03-08 09:00:00'),
(35, 2, 'DEMO03', '문지우', '010-4545-6767', '220.60.70.80',  18, 2,    'ad',       'display', 'banner_q1',   NULL,                    '배너 유입 → 즉시 계약! 상품C 20건',    'N', 'N', '2026-03-08 10:00:00'),
(36, 2, 'DEMO01', '김하린', '010-5656-7878', '123.20.30.40',  19, 2,    'naver',    'organic', NULL,          NULL,                    '3차 연락까지 응답 없음 → 미전환',       'N', 'N', '2026-03-08 11:00:00'),
(37, 2, 'DEMO02', '이도윤', '010-6767-8989', '180.50.60.70',  20, 2,    'direct',   NULL,      NULL,          '2026-03-15 10:00:00',   '예약 후 노쇼, 연락 두절',               'N', 'N', '2026-03-08 13:00:00'),
(38, 2, 'DEMO01', '박하윤', '010-8080-1010', '123.80.90.10',  21, NULL, 'direct',   NULL,      NULL,          NULL,                    NULL,                                    'Y', 'N', '2026-03-08 14:00:00'),
(39, 2, 'DEMO01', '신예준', '010-7878-9090', '210.70.80.90',  22, NULL, 'social',   'social',  NULL,          NULL,                    '스팸성 내용 반복 접수',                 'N', 'N', '2026-03-08 15:00:00'),
(40, 2, 'DEMO02', '권서연', '010-8989-0101', '59.80.90.10',   12, 2,    'google',   'cpc',     'gdn_march',   NULL,                    '신규 접수 - 상품D 대량 구매 문의',      'N', 'N', '2026-03-09 08:00:00'),
(41, 2, 'DEMO03', '조현우', '010-9898-1212', '61.90.10.20',   13, 2,    'naver',    'cpc',     'demo_spring', NULL,                    '1차 연락, 미팅 일정 조율 중',           'N', 'N', '2026-03-09 09:00:00'),
(42, 2, 'DEMO01', '류지안', '010-0101-2323', '220.80.90.10',  14, 2,    'referral', NULL,      'partner_ref', NULL,                    '파트너사 소개 - 통화 완료, 관심 높음',  'N', 'N', '2026-03-09 10:00:00'),
(43, 2, 'DEMO02', '양서윤', '010-1313-2424', '123.30.40.50',  16, 2,    'ad',       'display', 'banner_q1',   NULL,                    '디스플레이 유입, 견적 요청 중',         'N', 'N', '2026-03-09 11:00:00'),
(44, 2, 'DEMO01', '노재민', '010-2424-3535', '180.60.70.80',  18, 2,    'google',   'organic', NULL,          NULL,                    '빠른 의사결정 → 상품A 50건 계약!',     'N', 'N', '2026-03-09 13:00:00'),
(45, 2, 'DEMO03', '배수빈', '010-3535-4646', '210.10.20.30',  12, NULL, 'social',   'social',  'insta_demo',  NULL,                    '인스타 유입, 아직 미배정',              'N', 'N', '2026-03-09 14:00:00'),
(46, 2, 'DEMO01', '서지호', '010-4646-5757', '59.20.30.40',   15, 2,    'naver',    'cpc',     'demo_spring', '2026-03-30 15:00:00',   '상품B 미팅 예약, PT 자료 준비',         'N', 'N', '2026-03-09 15:00:00'),
(47, 2, 'DEMO02', '임수아', '010-5757-6868', '61.30.40.50',   19, 2,    'direct',   NULL,      NULL,          NULL,                    '직접 유입 - 경쟁사 선택으로 미전환',    'N', 'N', '2026-03-09 16:00:00'),
(48, 2, 'DEMO01', '한지우', '010-6868-7979', '220.40.50.60',  18, 2,    'naver',    'organic', NULL,          NULL,                    '즉시 구매! 상품B+C 번들 계약',          'N', 'N', '2026-03-10 09:00:00'),
(49, 2, 'DEMO03', '강민재', '010-7979-8080', '123.50.60.70',  12, NULL, 'ad',       'cpc',     'gdn_march',   NULL,                    'GDN 유입, 신규 접수 대기',              'N', 'N', '2026-03-10 10:00:00'),
(50, 2, 'DEMO02', '윤채원', '010-8181-9292', '180.80.90.10',  17, 2,    'google',   'cpc',     'gdn_march',   NULL,                    '예산 부족, 다음 분기까지 보류',         'N', 'N', '2026-03-10 11:00:00')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- 18. Counsel Field Values (상담 필드값)
-- ============================================================
-- field_type 에 따라 해당 value_* 컬럼에 저장
-- text/select → value_text, number → value_number, date → value_date, datetime → value_datetime
INSERT INTO counsel_field_value (counsel_seq, tenant_id, field_id, value_text, value_number, value_date, value_datetime) VALUES
-- ============================
-- tenant_id = 1 (field_id: 1=consultType, 2=preferredTime, 3=budget, 4=visitDate)
-- ============================
-- counsel 1 (김철수)
(1, 1, 1, '기술지원',        NULL,        NULL,         NULL),
(1, 1, 2, '오전 10시~12시',  NULL,        NULL,         NULL),
-- counsel 2 (이영희)
(2, 1, 1, '요금문의',        NULL,        NULL,         NULL),
(2, 1, 3, NULL,              500.000000,  NULL,         NULL),
-- counsel 3 (박지민)
(3, 1, 1, '일반문의',        NULL,        NULL,         NULL),
(3, 1, 2, '오후 2시~4시',    NULL,        NULL,         NULL),
(3, 1, 4, NULL,              NULL,        '2026-03-20', NULL),
-- counsel 4 (최동현)
(4, 1, 1, '기술지원',        NULL,        NULL,         NULL),
(4, 1, 3, NULL,              1000.000000, NULL,         NULL),
-- counsel 13 (오세훈)
(13, 1, 1, '요금문의',       NULL,        NULL,         NULL),
(13, 1, 2, '오전 9시~10시',  NULL,        NULL,         NULL),
-- counsel 14 (장미라)
(14, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(14, 1, 3, NULL,             800.000000,  NULL,         NULL),
-- counsel 15 (한승우)
(15, 1, 1, '일반문의',       NULL,        NULL,         NULL),
(15, 1, 2, '오후 3시~5시',   NULL,        NULL,         NULL),
(15, 1, 3, NULL,             350.000000,  NULL,         NULL),
-- counsel 16 (신지영)
(16, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(16, 1, 4, NULL,             NULL,        '2026-03-22', NULL),
-- counsel 17 (권도윤)
(17, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(17, 1, 3, NULL,             5000.000000, NULL,         NULL),
-- counsel 18 (조은별)
(18, 1, 1, '요금문의',       NULL,        NULL,         NULL),
(18, 1, 2, '오후 1시~3시',   NULL,        NULL,         NULL),
(18, 1, 3, NULL,             1200.000000, NULL,         NULL),
-- counsel 19 (류현진)
(19, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(19, 1, 3, NULL,             3000.000000, NULL,         NULL),
-- counsel 20 (강해린)
(20, 1, 1, '일반문의',       NULL,        NULL,         NULL),
(20, 1, 2, '오전 11시~12시', NULL,        NULL,         NULL),
-- counsel 24 (배준호)
(24, 1, 1, '요금문의',       NULL,        NULL,         NULL),
-- counsel 25 (서하은)
(25, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(25, 1, 3, NULL,             700.000000,  NULL,         NULL),
-- counsel 26 (양지호)
(26, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(26, 1, 2, '오후 2시~4시',   NULL,        NULL,         NULL),
-- counsel 27 (노은서)
(27, 1, 1, '기술지원',       NULL,        NULL,         NULL),
(27, 1, 3, NULL,             600.000000,  NULL,         NULL),
-- ============================
-- tenant_id = 2 (field_id: 5=productInterest, 6=companyName, 7=employeeCount, 8=meetingDatetime, 9=referralSource)
-- ============================
-- counsel 6 (정수진)
(6,  2, 5, '상품A',          NULL,        NULL,         NULL),
(6,  2, 6, 'ABC Corp',       NULL,        NULL,         NULL),
-- counsel 7 (한미영)
(7,  2, 5, '상품B',          NULL,        NULL,         NULL),
(7,  2, 9, '검색엔진',       NULL,        NULL,         NULL),
-- counsel 8 (강태훈)
(8,  2, 5, '상품C',          NULL,        NULL,         NULL),
(8,  2, 6, 'XYZ Ltd',        NULL,        NULL,         NULL),
(8,  2, 7, NULL,             50.000000,   NULL,         NULL),
-- counsel 9 (윤서연)
(9,  2, 5, '상품A',          NULL,        NULL,         NULL),
(9,  2, 8, NULL,             NULL,        NULL,         '2026-03-25 14:00:00'),
-- counsel 10 (송민준)
(10, 2, 5, '상품D',          NULL,        NULL,         NULL),
(10, 2, 6, 'DEF Inc',        NULL,        NULL,         NULL),
(10, 2, 9, '지인추천',       NULL,        NULL,         NULL),
-- counsel 28 (김도현)
(28, 2, 5, '상품A',          NULL,        NULL,         NULL),
(28, 2, 6, '도현컴퍼니',     NULL,        NULL,         NULL),
(28, 2, 7, NULL,             15.000000,   NULL,         NULL),
-- counsel 29 (이서준)
(29, 2, 5, '상품B',          NULL,        NULL,         NULL),
(29, 2, 9, '검색엔진',       NULL,        NULL,         NULL),
-- counsel 30 (박하윤)
(30, 2, 5, '상품A',          NULL,        NULL,         NULL),
(30, 2, 6, '하윤트레이딩',   NULL,        NULL,         NULL),
-- counsel 31 (최준혁)
(31, 2, 5, '상품C',          NULL,        NULL,         NULL),
(31, 2, 6, '준혁테크',       NULL,        NULL,         NULL),
(31, 2, 7, NULL,             120.000000,  NULL,         NULL),
(31, 2, 9, 'SNS광고',        NULL,        NULL,         NULL),
-- counsel 32 (정민서)
(32, 2, 5, '상품B',          NULL,        NULL,         NULL),
(32, 2, 6, '민서인더스트리',  NULL,        NULL,         NULL),
(32, 2, 8, NULL,             NULL,        NULL,         '2026-03-28 14:00:00'),
-- counsel 33 (오유진)
(33, 2, 5, '상품D',          NULL,        NULL,         NULL),
(33, 2, 6, '유진솔루션',     NULL,        NULL,         NULL),
(33, 2, 7, NULL,             200.000000,  NULL,         NULL),
-- counsel 34 (장세훈)
(34, 2, 5, '상품A',          NULL,        NULL,         NULL),
(34, 2, 6, '세훈엔터프라이즈', NULL,      NULL,         NULL),
(34, 2, 9, '지인추천',       NULL,        NULL,         NULL),
-- counsel 35 (문지우)
(35, 2, 5, '상품C',          NULL,        NULL,         NULL),
(35, 2, 6, '지우커머스',     NULL,        NULL,         NULL),
(35, 2, 7, NULL,             80.000000,   NULL,         NULL),
-- counsel 36 (김하린)
(36, 2, 5, '상품B',          NULL,        NULL,         NULL),
(36, 2, 6, '하린디자인',     NULL,        NULL,         NULL),
-- counsel 37 (이도윤)
(37, 2, 5, '상품A',          NULL,        NULL,         NULL),
(37, 2, 8, NULL,             NULL,        NULL,         '2026-03-15 10:00:00'),
-- counsel 40 (권서연)
(40, 2, 5, '상품D',          NULL,        NULL,         NULL),
(40, 2, 6, '서연물산',       NULL,        NULL,         NULL),
(40, 2, 7, NULL,             500.000000,  NULL,         NULL),
(40, 2, 9, '검색엔진',       NULL,        NULL,         NULL),
-- counsel 41 (조현우)
(41, 2, 5, '상품A',          NULL,        NULL,         NULL),
(41, 2, 6, '현우로지스틱스', NULL,        NULL,         NULL),
-- counsel 42 (류지안)
(42, 2, 5, '상품B',          NULL,        NULL,         NULL),
(42, 2, 6, '지안파트너스',   NULL,        NULL,         NULL),
(42, 2, 7, NULL,             30.000000,   NULL,         NULL),
(42, 2, 9, '지인추천',       NULL,        NULL,         NULL),
-- counsel 43 (양서윤)
(43, 2, 5, '상품C',          NULL,        NULL,         NULL),
(43, 2, 6, '서윤글로벌',     NULL,        NULL,         NULL),
(43, 2, 7, NULL,             300.000000,  NULL,         NULL),
-- counsel 44 (노재민)
(44, 2, 5, '상품A',          NULL,        NULL,         NULL),
(44, 2, 6, '재민유통',       NULL,        NULL,         NULL),
(44, 2, 7, NULL,             45.000000,   NULL,         NULL),
-- counsel 45 (배수빈)
(45, 2, 5, '상품B',          NULL,        NULL,         NULL),
(45, 2, 9, 'SNS광고',        NULL,        NULL,         NULL),
-- counsel 46 (서지호)
(46, 2, 5, '상품B',          NULL,        NULL,         NULL),
(46, 2, 6, '지호시스템즈',   NULL,        NULL,         NULL),
(46, 2, 8, NULL,             NULL,        NULL,         '2026-03-30 15:00:00'),
-- counsel 47 (임수아)
(47, 2, 5, '상품A',          NULL,        NULL,         NULL),
(47, 2, 6, '수아컨설팅',     NULL,        NULL,         NULL),
-- counsel 48 (한지우)
(48, 2, 5, '상품B',          NULL,        NULL,         NULL),
(48, 2, 6, '지우미디어',     NULL,        NULL,         NULL),
(48, 2, 7, NULL,             25.000000,   NULL,         NULL),
(48, 2, 9, '검색엔진',       NULL,        NULL,         NULL),
-- counsel 49 (강민재)
(49, 2, 5, '상품D',          NULL,        NULL,         NULL),
-- counsel 50 (윤채원)
(50, 2, 5, '상품A',          NULL,        NULL,         NULL),
(50, 2, 6, '채원홀딩스',     NULL,        NULL,         NULL),
(50, 2, 7, NULL,             150.000000,  NULL,         NULL)
ON DUPLICATE KEY UPDATE value_text = VALUES(value_text);

-- ============================================================
-- 19. Counsel Logs (상담 상태 변경 이력)
-- ============================================================
-- log_no: 상담별 순차 증가 번호 (1부터 시작)
INSERT INTO counsel_log (counsel_seq, tenant_id, log_no, counsel_stat, reg_dtm) VALUES
-- ============================
-- tenant_id = 1 (status: 1=NEW,2=TRY,3=CONTACTED,4=SCHEDULED,5=IN_PROGRESS,6=HOLD,7=WON,8=LOST,9=NO_SHOW,10=DUPLICATE,11=SPAM)
-- ============================
-- counsel 1 (김철수): NEW
(1, 1, 1, 1, '2026-03-01 09:00:00'),
-- counsel 2 (이영희): NEW → CONTACTED
(2, 1, 1, 1, '2026-03-02 10:30:00'),
(2, 1, 2, 3, '2026-03-02 15:00:00'),
-- counsel 3 (박지민): NEW → TRY_CONTACT → SCHEDULED
(3, 1, 1, 1, '2026-03-03 11:00:00'),
(3, 1, 2, 2, '2026-03-03 14:00:00'),
(3, 1, 3, 4, '2026-03-04 09:00:00'),
-- counsel 4 (최동현): NEW → CONTACTED → IN_PROGRESS
(4, 1, 1, 1, '2026-03-04 14:00:00'),
(4, 1, 2, 3, '2026-03-05 10:00:00'),
(4, 1, 3, 5, '2026-03-06 09:00:00'),
-- counsel 5 (김철수 중복): NEW → DUPLICATE
(5, 1, 1, 1, '2026-03-05 09:30:00'),
(5, 1, 2, 10, '2026-03-05 09:30:01'),
-- counsel 13 (오세훈): NEW
(13, 1, 1, 1, '2026-03-05 10:00:00'),
-- counsel 14 (장미라): NEW → TRY_CONTACT
(14, 1, 1, 1, '2026-03-05 11:30:00'),
(14, 1, 2, 2, '2026-03-05 14:00:00'),
-- counsel 15 (한승우): NEW → TRY_CONTACT → CONTACTED
(15, 1, 1, 1, '2026-03-05 14:00:00'),
(15, 1, 2, 2, '2026-03-05 15:00:00'),
(15, 1, 3, 3, '2026-03-05 16:00:00'),
-- counsel 16 (신지영): NEW → TRY_CONTACT → CONTACTED → SCHEDULED
(16, 1, 1, 1, '2026-03-06 09:00:00'),
(16, 1, 2, 2, '2026-03-06 10:00:00'),
(16, 1, 3, 3, '2026-03-06 11:00:00'),
(16, 1, 4, 4, '2026-03-06 14:00:00'),
-- counsel 17 (권도윤): NEW → CONTACTED → IN_PROGRESS
(17, 1, 1, 1, '2026-03-06 10:30:00'),
(17, 1, 2, 3, '2026-03-06 14:00:00'),
(17, 1, 3, 5, '2026-03-07 09:00:00'),
-- counsel 18 (조은별): NEW → TRY_CONTACT → CONTACTED → HOLD
(18, 1, 1, 1, '2026-03-06 13:00:00'),
(18, 1, 2, 2, '2026-03-06 15:00:00'),
(18, 1, 3, 3, '2026-03-06 17:00:00'),
(18, 1, 4, 6, '2026-03-07 10:00:00'),
-- counsel 19 (류현진): NEW → CONTACTED → SCHEDULED → IN_PROGRESS → WON
(19, 1, 1, 1, '2026-03-06 15:00:00'),
(19, 1, 2, 3, '2026-03-06 16:00:00'),
(19, 1, 3, 4, '2026-03-07 09:00:00'),
(19, 1, 4, 5, '2026-03-07 14:00:00'),
(19, 1, 5, 7, '2026-03-08 10:00:00'),
-- counsel 20 (강해린): NEW → TRY_CONTACT → CONTACTED → LOST
(20, 1, 1, 1, '2026-03-07 09:00:00'),
(20, 1, 2, 2, '2026-03-07 10:00:00'),
(20, 1, 3, 3, '2026-03-07 14:00:00'),
(20, 1, 4, 8, '2026-03-08 16:00:00'),
-- counsel 21 (임재현): NEW → SCHEDULED → NO_SHOW
(21, 1, 1, 1, '2026-03-07 10:00:00'),
(21, 1, 2, 4, '2026-03-07 11:00:00'),
(21, 1, 3, 9, '2026-03-18 15:00:00'),
-- counsel 22 (오세훈 중복): NEW → DUPLICATE
(22, 1, 1, 1, '2026-03-07 14:00:00'),
(22, 1, 2, 10, '2026-03-07 14:00:01'),
-- counsel 23 (문서윤): NEW → SPAM
(23, 1, 1, 1, '2026-03-07 16:00:00'),
(23, 1, 2, 11, '2026-03-07 16:05:00'),
-- counsel 24 (배준호): NEW
(24, 1, 1, 1, '2026-03-08 08:30:00'),
-- counsel 25 (서하은): NEW → TRY_CONTACT
(25, 1, 1, 1, '2026-03-08 09:00:00'),
(25, 1, 2, 2, '2026-03-08 10:00:00'),
-- counsel 26 (양지호): NEW → TRY_CONTACT → CONTACTED
(26, 1, 1, 1, '2026-03-08 11:00:00'),
(26, 1, 2, 2, '2026-03-08 13:00:00'),
(26, 1, 3, 3, '2026-03-08 15:00:00'),
-- counsel 27 (노은서): NEW → CONTACTED → WON
(27, 1, 1, 1, '2026-03-08 14:00:00'),
(27, 1, 2, 3, '2026-03-08 15:00:00'),
(27, 1, 3, 7, '2026-03-08 17:00:00'),
-- ============================
-- tenant_id = 2 (status: 12=NEW,13=TRY,14=CONTACTED,15=SCHEDULED,16=IN_PROGRESS,17=HOLD,18=WON,19=LOST,20=NO_SHOW,21=DUPLICATE,22=SPAM)
-- ============================
-- counsel 6 (정수진): NEW
(6, 2, 1, 12, '2026-03-01 08:00:00'),
-- counsel 7 (한미영): NEW → TRY_CONTACT
(7, 2, 1, 12, '2026-03-02 09:00:00'),
(7, 2, 2, 13, '2026-03-02 11:00:00'),
-- counsel 8 (강태훈): NEW → TRY_CONTACT → CONTACTED
(8, 2, 1, 12, '2026-03-03 10:00:00'),
(8, 2, 2, 13, '2026-03-03 13:00:00'),
(8, 2, 3, 14, '2026-03-04 10:00:00'),
-- counsel 9 (윤서연): NEW → CONTACTED → SCHEDULED
(9, 2, 1, 12, '2026-03-04 11:00:00'),
(9, 2, 2, 14, '2026-03-04 15:00:00'),
(9, 2, 3, 15, '2026-03-05 09:00:00'),
-- counsel 10 (송민준): NEW → CONTACTED → IN_PROGRESS → WON
(10, 2, 1, 12, '2026-03-05 14:00:00'),
(10, 2, 2, 14, '2026-03-06 10:00:00'),
(10, 2, 3, 16, '2026-03-07 10:00:00'),
(10, 2, 4, 18, '2026-03-08 14:00:00'),
-- counsel 11 (임하늘): NEW → TRY_CONTACT → LOST
(11, 2, 1, 12, '2026-03-06 09:00:00'),
(11, 2, 2, 13, '2026-03-06 14:00:00'),
(11, 2, 3, 19, '2026-03-08 17:00:00'),
-- counsel 12 (정수진 중복): NEW → DUPLICATE
(12, 2, 1, 12, '2026-03-07 08:30:00'),
(12, 2, 2, 21, '2026-03-07 08:30:01'),
-- counsel 28 (김도현): NEW
(28, 2, 1, 12, '2026-03-07 09:00:00'),
-- counsel 29 (이서준): NEW
(29, 2, 1, 12, '2026-03-07 10:00:00'),
-- counsel 30 (박하윤): NEW → TRY_CONTACT
(30, 2, 1, 12, '2026-03-07 11:00:00'),
(30, 2, 2, 13, '2026-03-07 13:00:00'),
-- counsel 31 (최준혁): NEW → TRY_CONTACT → CONTACTED
(31, 2, 1, 12, '2026-03-07 13:00:00'),
(31, 2, 2, 13, '2026-03-07 14:00:00'),
(31, 2, 3, 14, '2026-03-07 15:00:00'),
-- counsel 32 (정민서): NEW → CONTACTED → SCHEDULED
(32, 2, 1, 12, '2026-03-07 14:30:00'),
(32, 2, 2, 14, '2026-03-07 16:00:00'),
(32, 2, 3, 15, '2026-03-08 09:00:00'),
-- counsel 33 (오유진): NEW → CONTACTED → IN_PROGRESS
(33, 2, 1, 12, '2026-03-07 15:00:00'),
(33, 2, 2, 14, '2026-03-08 10:00:00'),
(33, 2, 3, 16, '2026-03-08 14:00:00'),
-- counsel 34 (장세훈): NEW → TRY_CONTACT → CONTACTED → HOLD
(34, 2, 1, 12, '2026-03-08 09:00:00'),
(34, 2, 2, 13, '2026-03-08 10:00:00'),
(34, 2, 3, 14, '2026-03-08 14:00:00'),
(34, 2, 4, 17, '2026-03-09 09:00:00'),
-- counsel 35 (문지우): NEW → CONTACTED → SCHEDULED → IN_PROGRESS → WON
(35, 2, 1, 12, '2026-03-08 10:00:00'),
(35, 2, 2, 14, '2026-03-08 11:00:00'),
(35, 2, 3, 15, '2026-03-08 14:00:00'),
(35, 2, 4, 16, '2026-03-09 10:00:00'),
(35, 2, 5, 18, '2026-03-09 14:00:00'),
-- counsel 36 (김하린): NEW → TRY_CONTACT → CONTACTED → LOST
(36, 2, 1, 12, '2026-03-08 11:00:00'),
(36, 2, 2, 13, '2026-03-08 14:00:00'),
(36, 2, 3, 14, '2026-03-09 09:00:00'),
(36, 2, 4, 19, '2026-03-09 16:00:00'),
-- counsel 37 (이도윤): NEW → SCHEDULED → NO_SHOW
(37, 2, 1, 12, '2026-03-08 13:00:00'),
(37, 2, 2, 15, '2026-03-08 15:00:00'),
(37, 2, 3, 20, '2026-03-15 11:00:00'),
-- counsel 38 (박하윤 중복): NEW → DUPLICATE
(38, 2, 1, 12, '2026-03-08 14:00:00'),
(38, 2, 2, 21, '2026-03-08 14:00:01'),
-- counsel 39 (신예준): NEW → SPAM
(39, 2, 1, 12, '2026-03-08 15:00:00'),
(39, 2, 2, 22, '2026-03-08 15:05:00'),
-- counsel 40 (권서연): NEW
(40, 2, 1, 12, '2026-03-09 08:00:00'),
-- counsel 41 (조현우): NEW → TRY_CONTACT
(41, 2, 1, 12, '2026-03-09 09:00:00'),
(41, 2, 2, 13, '2026-03-09 10:00:00'),
-- counsel 42 (류지안): NEW → TRY_CONTACT → CONTACTED
(42, 2, 1, 12, '2026-03-09 10:00:00'),
(42, 2, 2, 13, '2026-03-09 11:00:00'),
(42, 2, 3, 14, '2026-03-09 14:00:00'),
-- counsel 43 (양서윤): NEW → CONTACTED → IN_PROGRESS
(43, 2, 1, 12, '2026-03-09 11:00:00'),
(43, 2, 2, 14, '2026-03-09 13:00:00'),
(43, 2, 3, 16, '2026-03-09 15:00:00'),
-- counsel 44 (노재민): NEW → CONTACTED → WON
(44, 2, 1, 12, '2026-03-09 13:00:00'),
(44, 2, 2, 14, '2026-03-09 14:00:00'),
(44, 2, 3, 18, '2026-03-09 16:00:00'),
-- counsel 45 (배수빈): NEW
(45, 2, 1, 12, '2026-03-09 14:00:00'),
-- counsel 46 (서지호): NEW → CONTACTED → SCHEDULED
(46, 2, 1, 12, '2026-03-09 15:00:00'),
(46, 2, 2, 14, '2026-03-09 16:00:00'),
(46, 2, 3, 15, '2026-03-10 09:00:00'),
-- counsel 47 (임수아): NEW → TRY_CONTACT → CONTACTED → LOST
(47, 2, 1, 12, '2026-03-09 16:00:00'),
(47, 2, 2, 13, '2026-03-10 09:00:00'),
(47, 2, 3, 14, '2026-03-10 10:00:00'),
(47, 2, 4, 19, '2026-03-10 14:00:00'),
-- counsel 48 (한지우): NEW → CONTACTED → WON
(48, 2, 1, 12, '2026-03-10 09:00:00'),
(48, 2, 2, 14, '2026-03-10 09:30:00'),
(48, 2, 3, 18, '2026-03-10 10:00:00'),
-- counsel 49 (강민재): NEW
(49, 2, 1, 12, '2026-03-10 10:00:00'),
-- counsel 50 (윤채원): NEW → TRY_CONTACT → CONTACTED → HOLD
(50, 2, 1, 12, '2026-03-10 11:00:00'),
(50, 2, 2, 13, '2026-03-10 13:00:00'),
(50, 2, 3, 14, '2026-03-10 15:00:00'),
(50, 2, 4, 17, '2026-03-10 17:00:00')
ON DUPLICATE KEY UPDATE counsel_stat = VALUES(counsel_stat);

-- ============================================================
-- 20. Counsel Memo Logs (상담 메모 이력)
-- ============================================================
INSERT INTO counsel_memo_log (memo_log_id, counsel_seq, tenant_id, status_id, memo_text, created_by, is_deleted) VALUES
-- ============================
-- tenant_id = 1
-- ============================
(1,  2,  1, 3,  '네이버 유입 고객 - 요금 관련 상세 문의, 견적서 발송 예정',                       1, 0),
(2,  3,  1, 4,  '방문 상담 일정 확정: 3/20 오후 2시, 회의실 B 예약 완료',                          1, 0),
(3,  4,  1, 3,  '기존 고객(김OO) 소개로 유입, 대규모 프로젝트 문의',                               1, 0),
(4,  4,  1, 5,  '견적서 전달 완료. 고객 검토 중, 3/10까지 회신 예정',                              1, 0),
(11, 15, 1, 3,  '인스타 유입 고객 - 통화 완료, 제품 데모 요청',                                    1, 0),
(12, 16, 1, 3,  '전화 상담 후 추가 기술 자료 요청. 이메일 발송 완료',                              1, 0),
(13, 16, 1, 4,  '3/22 오전 10시 방문 예약 확정, 엔지니어 동행 예정',                               1, 0),
(14, 17, 1, 3,  '지인 소개 대형 외주 건 - 초기 요구사항 공유 받음',                                1, 0),
(15, 17, 1, 5,  '고객사 방문 완료. 견적 3건 준비 중 (A/B/C 안)',                                   1, 0),
(16, 18, 1, 3,  '예산 범위 확인 완료 (1,200만원). 4월 예산 확보 후 진행 예정',                     1, 0),
(17, 18, 1, 6,  '4월까지 보류. 4/1 리마인더 설정 완료',                                            1, 0),
(18, 19, 1, 4,  '일정 확정 - 현장 방문 데모 진행 예정',                                            1, 0),
(19, 19, 1, 5,  '데모 진행 완료 - 고객 만족, 계약서 초안 발송',                                    1, 0),
(20, 19, 1, 7,  '3년 유지보수 포함 계약 체결! 3,000만원 규모',                                     1, 0),
(21, 20, 1, 3,  '배너 유입 - 통화 완료, 관심도 낮음',                                              1, 0),
(22, 20, 1, 8,  '3회 연락 시도, 고객 의사 없음 확인. 미전환 처리',                                 1, 0),
(23, 21, 1, 4,  '3/18 방문 예약 완료',                                                             1, 0),
(24, 21, 1, 9,  '예약 일시 불참. 연락 시도 3회 후 노쇼 처리',                                      1, 0),
(25, 26, 1, 3,  '양지호 CTO - 기술 데모 강력 희망, 3월 중 일정 조율',                              1, 0),
(26, 27, 1, 7,  '즉시 계약! 소규모 패키지 600만원 결제 완료',                                      1, 0),
-- ============================
-- tenant_id = 2
-- ============================
(5,  8,  2, 14, 'XYZ 대표 강태훈 님과 통화 완료. 상품C 50건 관심 표명',                            2, 0),
(6,  9,  2, 15, '윤서연 매니저 미팅 3/25 10시 확정. 프레젠테이션 자료 준비 필요',                   2, 0),
(7,  10, 2, 16, '송민준 대표 - 상품D 30건 견적 검토 중',                                           2, 0),
(8,  10, 2, 18, '계약 체결 완료! 발주서 접수됨. 납품 일정 조율 예정',                              2, 0),
(9,  11, 2, 13, '1차 전화 연결 - 예산 문제로 다음 분기 재검토 예정',                               2, 0),
(10, 11, 2, 19, '3회 연락 시도했으나 고객 응답 없음. 미전환 처리',                                 2, 0),
(27, 31, 2, 14, '준혁테크 담당자 통화 완료 - 상품C 120건 견적 요청',                               2, 0),
(28, 32, 2, 15, '민서인더스트리 미팅 3/28 14시 확정. 상품B 집중 프레젠테이션 준비',                2, 0),
(29, 33, 2, 14, '유진솔루션 CTO 통화 - 기술 스펙 상세 문의. 기술팀 연결',                          2, 0),
(30, 33, 2, 16, '유진솔루션 견적서 발송 완료. 내부 결재 진행 중',                                  2, 0),
(31, 34, 2, 14, '세훈엔터프라이즈 통화 - 예산 확보 4월 예정이라 보류 요청',                        2, 0),
(32, 34, 2, 17, '4월 중순 재연락 예정. 리마인더 설정',                                             2, 0),
(33, 35, 2, 15, '지우커머스 데모 미팅 진행 - 상품C 80건 관심',                                     2, 0),
(34, 35, 2, 18, '계약 체결! 상품C 80건 = 2,400만원, 분기 납품 조건',                               2, 0),
(35, 36, 2, 14, '하린디자인 통화 완료 - 예산 한도 낮아 난색 표명',                                 2, 0),
(36, 36, 2, 19, '경쟁사 저가 제품 선택. 미전환 처리',                                              2, 0),
(37, 37, 2, 15, '이도윤 대표 3/15 미팅 예약 확정',                                                 2, 0),
(38, 37, 2, 20, '미팅 당일 불참, 이후 연락 두절. 노쇼 처리',                                       2, 0),
(39, 42, 2, 14, '파트너사 소개 류지안 - 관심 매우 높음. 빠른 진행 희망',                           2, 0),
(40, 43, 2, 16, '서윤글로벌 견적 검토 중. 300명 규모 대기업, 대량 구매 가능성',                    2, 0),
(41, 44, 2, 18, '재민유통 즉시 계약! 상품A 50건 = 1,500만원',                                      2, 0),
(42, 46, 2, 15, '지호시스템즈 3/30 미팅 예약. PT 자료 및 샘플 준비',                               2, 0),
(43, 47, 2, 14, '수아컨설팅 통화 - 경쟁사 비교 중',                                                2, 0),
(44, 47, 2, 19, '경쟁사 최종 선택 통보. 미전환',                                                   2, 0),
(45, 48, 2, 18, '한지우 즉시 구매! 상품B+C 번들 1,800만원 계약',                                   2, 0),
(46, 50, 2, 14, '채원홀딩스 통화 - 예산 부족, 다음 분기 재논의',                                   2, 0),
(47, 50, 2, 17, '다음 분기까지 보류. 7월 재연락 스케줄링',                                         2, 0)
ON DUPLICATE KEY UPDATE memo_text = VALUES(memo_text);

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

SELECT '=== Board ===' AS '';
SELECT b.board_id, b.board_key, b.name, t.tenant_name, b.is_active
FROM board b
JOIN tenants t ON b.tenant_id = t.tenant_id
ORDER BY b.tenant_id, b.sort_order;

SELECT '=== Post Count by Board ===' AS '';
SELECT b.board_id, b.name, t.tenant_name, COUNT(p.post_id) as post_count
FROM board b
JOIN tenants t ON b.tenant_id = t.tenant_id
LEFT JOIN post p ON b.board_id = p.board_id
GROUP BY b.board_id, b.name, t.tenant_name
ORDER BY b.tenant_id, b.sort_order;

SELECT '=== Websites ===' AS '';
SELECT w.web_code, w.web_title, t.tenant_name, w.is_active, w.duplicate_allow_after_days
FROM websites w
JOIN tenants t ON w.tenant_id = t.tenant_id
ORDER BY w.tenant_id, w.web_code;

SELECT '=== Code Groups ===' AS '';
SELECT * FROM code_groups;

SELECT '=== Codes ===' AS '';
SELECT c.code_id, cg.code_group_key, c.code_key, c.code_name
FROM codes c
JOIN code_groups cg ON c.code_group_id = cg.code_group_id
ORDER BY c.code_group_id, c.sort_order;

SELECT '=== Block IP ===' AS '';
SELECT bi.dbi_idx, t.tenant_name, bi.block_ip, bi.reason, bi.is_active
FROM block_ip bi
JOIN tenants t ON bi.tenant_id = t.tenant_id
ORDER BY bi.tenant_id, bi.dbi_idx;

SELECT '=== Block HP ===' AS '';
SELECT bh.dbh_idx, t.tenant_name, bh.block_hp, bh.reason, bh.is_active
FROM block_hp bh
JOIN tenants t ON bh.tenant_id = t.tenant_id
ORDER BY bh.tenant_id, bh.dbh_idx;

SELECT '=== Block Word ===' AS '';
SELECT bw.dbw_idx, t.tenant_name, bw.block_word, bw.match_type, bw.is_active
FROM block_word bw
JOIN tenants t ON bw.tenant_id = t.tenant_id
ORDER BY bw.tenant_id, bw.dbw_idx;

SELECT '=== Counsel Field Definitions ===' AS '';
SELECT cfd.field_id, t.tenant_name, cfd.field_key, cfd.label, cfd.field_type, cfd.is_required
FROM counsel_field_def cfd
JOIN tenants t ON cfd.tenant_id = t.tenant_id
ORDER BY cfd.tenant_id, cfd.sort_order;

SELECT '=== Counsels ===' AS '';
SELECT c.counsel_seq, t.tenant_name, c.name, c.counsel_hp, ts.status_name, c.duplicate_state
FROM counsel c
JOIN tenants t ON c.tenant_id = t.tenant_id
JOIN tenant_status ts ON c.counsel_stat = ts.tenant_status_id
ORDER BY c.tenant_id, c.counsel_seq;

SELECT '=== Counsel Logs Count ===' AS '';
SELECT c.counsel_seq, c.name, COUNT(cl.log_no) as log_count
FROM counsel c
LEFT JOIN counsel_log cl ON c.counsel_seq = cl.counsel_seq AND c.tenant_id = cl.tenant_id
GROUP BY c.counsel_seq, c.name
ORDER BY c.counsel_seq;

SELECT '=== Counsel Memo Logs Count ===' AS '';
SELECT c.counsel_seq, c.name, COUNT(cml.memo_log_id) as memo_count
FROM counsel c
LEFT JOIN counsel_memo_log cml ON c.counsel_seq = cml.counsel_seq AND c.tenant_id = cml.tenant_id
GROUP BY c.counsel_seq, c.name
ORDER BY c.counsel_seq;

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 초기 시드 데이터 생성 완료!' AS 'Status';
SELECT '' AS '';
SELECT '=== 로그인 정보 ===' AS '';
SELECT 'admin / Admin123 (슈퍼 관리자)' AS 'Login Info 1';
SELECT 'tenant_admin / Admin123 (업체 관리자)' AS 'Login Info 2';
SELECT '' AS '';
SELECT '=== RBAC ===' AS '';
SELECT 'Pages: 총 20개 (super 6 + 사용자/권한 4 + 시스템 5 + 콘텐츠 2 + 상담 3)' AS 'RBAC Info 1';
SELECT 'Permissions: 총 59개 (Permission 51-59: 상담 관련 권한 포함)' AS 'RBAC Info 2';
SELECT '' AS '';
SELECT '=== Boards 모듈 ===' AS '';
SELECT 'Board: 총 10개 (tenant 1: 5개, tenant 2: 5개)' AS 'Boards Info 1';
SELECT 'Post: 총 24개 (tenant 1: 12개, tenant 2: 12개)' AS 'Boards Info 2';
SELECT '' AS '';
SELECT '=== 상담 모듈 ===' AS '';
SELECT 'Website: 총 5개 (tenant 1: 2개, tenant 2: 3개)' AS 'Counsel Info 1';
SELECT 'Counsel: 총 50개 (tenant 1: 20개, tenant 2: 30개)' AS 'Counsel Info 2';
SELECT 'Counsel Field Def: 총 9개 (tenant 1: 4개, tenant 2: 5개)' AS 'Counsel Info 3';
SELECT 'Counsel Field Value: 총 113개' AS 'Counsel Info 4';
SELECT 'Counsel Log: 총 143개 (상태 변경 이력)' AS 'Counsel Info 5';
SELECT 'Counsel Memo Log: 총 47개 (메모 이력)' AS 'Counsel Info 6';
SELECT '' AS '';
SELECT '=== 보안 모듈 ===' AS '';
SELECT 'Block IP: 총 5개 (tenant 1: 2개, tenant 2: 3개)' AS 'Security Info 1';
SELECT 'Block HP: 총 5개 (tenant 1: 2개, tenant 2: 3개)' AS 'Security Info 2';
SELECT 'Block Word: 총 7개 (tenant 1: 3개, tenant 2: 4개)' AS 'Security Info 3';
SELECT '' AS '';
SELECT '=== 공통 코드 ===' AS '';
SELECT 'Code Group: 총 3개 (COUNSEL_SOURCE, COUNSEL_MEDIUM, FIELD_TYPE)' AS 'Code Info 1';
SELECT 'Code: 총 16개' AS 'Code Info 2';
SELECT '' AS '';
SELECT '=== Tenant Status ===' AS '';
SELECT 'tenant 1: 11개 상태, tenant 2: 11개 상태 (총 22개)' AS 'Status Info 1';

-- ============================================================
-- 데이터 초기화 쿼리 (주석 해제하여 사용)
-- ============================================================
-- 경고: 아래 쿼리를 실행하면 모든 데이터가 삭제됩니다!
-- 
-- 실행 방법:
-- 1. 아래 주석을 해제
-- 2. mysql -u [username] -p [database_name] < reset-seed.sql
--
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE counsel_memo_log;
-- TRUNCATE TABLE counsel_log;
-- TRUNCATE TABLE counsel_field_value;
-- TRUNCATE TABLE counsel;
-- TRUNCATE TABLE counsel_field_def;
-- TRUNCATE TABLE block_word;
-- TRUNCATE TABLE block_hp;
-- TRUNCATE TABLE block_ip;
-- TRUNCATE TABLE websites;
-- TRUNCATE TABLE codes;
-- TRUNCATE TABLE code_groups;
-- TRUNCATE TABLE user_roles;
-- TRUNCATE TABLE role_permissions;
-- TRUNCATE TABLE users;
-- TRUNCATE TABLE roles;
-- TRUNCATE TABLE permissions;
-- TRUNCATE TABLE pages;
-- TRUNCATE TABLE actions;
-- TRUNCATE TABLE tenant_status;
-- TRUNCATE TABLE tenants;
-- TRUNCATE TABLE refresh_tokens;
-- TRUNCATE TABLE post;
-- TRUNCATE TABLE board;
-- SET FOREIGN_KEY_CHECKS = 1;

