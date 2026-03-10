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
--   9. Boards 모듈 (게시판 타입 관리 & 게시글 관리)
--
-- 생성일: 2026-01-27
-- 최종 수정: 2026-03-10 (Boards 모듈 추가)
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
(7, 12, 'roles', '/roles', '역할', '역할 생성/수정/삭제 및 권한 할당', 1, 1),
(8, 12, 'users', '/users', '사용자', '사용자 생성/수정/삭제 및 역할 할당', 1, 2),
(9, 12, 'permissions', '/permissions/catalog', '권한 카탈로그', '권한 목록 조회 (역할 할당용)', 1, 3),

-- 생성 및 시스템 관리 그룹 (부모 페이지)
(13, NULL, 'system_management', '/system-management', '생성 및 시스템 관리', '테넌트 상태, 보안, 웹사이트 관리 메뉴 그룹', 1, 20),

-- 생성 및 시스템 관리 하위 페이지 (parent_id = 13)
(10, 13, 'tenants.status', '/tenants/status', '테넌트 상태', '테넌트별 커스텀 상태 관리 (상담, 주문 등)', 1, 1),
(14, 13, 'security', '/security', '보안', 'IP, 전화번호, 단어 차단 등 보안 관리', 1, 2),
(11, 13, 'websites', '/websites', '웹사이트', '웹사이트 등록/수정/삭제 및 활성화 관리', 1, 3),
(15, 13, 'board_types', '/boards', '게시판 타입 관리', '게시판 종류 생성/수정/삭제 (공지사항, FAQ 등)', 1, 4),

-- 콘텐츠 관리 그룹 (부모 페이지)
(16, NULL, 'content_management', '/content-management', '콘텐츠 관리', '게시판, 게시글 등 콘텐츠 작성 및 관리', 1, 30),

-- 콘텐츠 관리 하위 페이지 (parent_id = 16)
(17, 16, 'boards.posts', '/boards/:boardId/posts', '게시글', '게시글 작성/조회/수정/삭제', 1, 1)
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
(50, 17, 4, '게시글 삭제', '게시글 소프트 삭제', 1)
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
(2, 47), (2, 48), (2, 49), (2, 50)
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
(1, 'counsel', 'SPAM',        '스팸/무의미','스팸/봇/장난 등 처리 대상',                '#111827', 99, 1)
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

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 초기 시드 데이터 생성 완료!' AS 'Status';
SELECT '' AS '';
SELECT '=== 로그인 정보 ===' AS '';
SELECT 'admin / Admin123 (슈퍼 관리자)' AS 'Login Info 1';
SELECT 'tenant_admin / Admin123 (업체 관리자)' AS 'Login Info 2';
SELECT '' AS '';
SELECT '=== Boards 모듈 ===' AS '';
SELECT 'board_types: 게시판 타입 관리 (system_management 아래)' AS 'Boards Info 1';
SELECT 'boards.posts: 게시글 관리 (content_management 아래)' AS 'Boards Info 2';
SELECT 'Permission 42-50: Boards 관련 권한 포함' AS 'Boards Info 3';
SELECT '' AS '';
SELECT '=== 샘플 데이터 ===' AS '';
SELECT 'Board: 총 10개 (tenant 1: 5개, tenant 2: 5개)' AS 'Sample Data 1';
SELECT 'Post: 총 24개 (tenant 1: 12개, tenant 2: 12개)' AS 'Sample Data 2';
SELECT '각 테넌트별로 공지사항, FAQ, 뉴스, 이벤트, Q&A 게시판' AS 'Sample Data 3';

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

