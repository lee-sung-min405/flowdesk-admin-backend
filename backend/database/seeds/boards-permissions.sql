-- ============================================================
-- Boards 모듈 RBAC 권한 설정 (Option A: 관리/사용 분리)
-- 
-- 실행 방법:
--   mysql -u [username] -p [database_name] < boards-permissions.sql
--
-- 포함 내용:
--   1. board_types (게시판 타입 관리) - system_management 아래
--   2. content_management (콘텐츠 관리 카테고리) - 새 그룹
--   3. boards.posts (게시글 관리) - content_management 아래
--   4. 슈퍼 관리자 및 업체 관리자 권한 부여
--   5. 샘플 데이터
--      - tenant_id = 1 (system): 게시판 5개 + 게시글 12개
--      - tenant_id = 2 (demo_company): 게시판 5개 + 게시글 12개
--
-- 구조:
--   - board_types: 관리자가 게시판 종류 설정 (system_management 아래)
--   - boards.posts: 사용자가 게시글 작성/조회 (content_management 아래)
--
-- 생성일: 2026-03-10
-- ============================================================

-- 외래 키 체크 임시 비활성화
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 트랜잭션 시작
START TRANSACTION;

-- ============================================================
-- 1. Pages (페이지/리소스 정의)
-- ============================================================

-- board_types: 게시판 타입 관리 (system_management 아래)
-- 관리자가 사용할 게시판 종류를 설정하는 페이지
INSERT INTO pages (page_id, parent_id, page_name, path, display_name, description, is_active, sort_order) VALUES
(15, 13, 'board_types', '/boards', '게시판 타입 관리', '게시판 종류 생성/수정/삭제 (공지사항, FAQ 등)', 1, 4)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- content_management: 콘텐츠 관리 카테고리 (최상위 그룹)
INSERT INTO pages (page_id, parent_id, page_name, path, display_name, description, is_active, sort_order) VALUES
(16, NULL, 'content_management', '/content-management', '콘텐츠 관리', '게시판, 게시글 등 콘텐츠 작성 및 관리', 1, 30)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- boards.posts: 게시글 관리 (content_management 아래)
-- 실제 게시글을 작성하고 관리하는 페이지
INSERT INTO pages (page_id, parent_id, page_name, path, display_name, description, is_active, sort_order) VALUES
(17, 16, 'boards.posts', '/boards/:boardId/posts', '게시글', '게시글 작성/조회/수정/삭제', 1, 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 2. Permissions (Page + Action 조합)
-- ============================================================

-- content_management (부모 페이지 접근) - page_id = 16
INSERT INTO permissions (permission_id, page_id, action_id, display_name, description, is_active) VALUES
(42, 16, 1, '콘텐츠 관리 메뉴 접근', '콘텐츠 관리 카테고리 접근', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- board_types (게시판 타입 CRUD) - page_id = 15
INSERT INTO permissions (permission_id, page_id, action_id, display_name, description, is_active) VALUES
(43, 15, 1, '게시판 타입 조회', '게시판 종류 목록 및 상세 조회', 1),
(44, 15, 2, '게시판 타입 생성', '새 게시판 종류 생성 (공지사항, FAQ 등)', 1),
(45, 15, 3, '게시판 타입 수정', '게시판 종류 정보, 정렬 순서, 활성화 상태 수정', 1),
(46, 15, 4, '게시판 타입 삭제', '게시판 종류 비활성화 (논리 삭제)', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- boards.posts (게시글 CRUD) - page_id = 17
INSERT INTO permissions (permission_id, page_id, action_id, display_name, description, is_active) VALUES
(47, 17, 1, '게시글 조회', '게시글 목록 및 상세 조회', 1),
(48, 17, 2, '게시글 생성', '새 게시글 작성', 1),
(49, 17, 3, '게시글 수정', '게시글 내용 및 상태 수정', 1),
(50, 17, 4, '게시글 삭제', '게시글 소프트 삭제', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description);

-- ============================================================
-- 3. Role-Permissions (역할-권한 매핑)
-- ============================================================

-- 슈퍼 관리자 (role_id = 1)에게 모든 게시판 관련 권한 부여
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- content_management (부모 페이지 접근)
(1, 42),
-- board_types (CRUD)
(1, 43), (1, 44), (1, 45), (1, 46),
-- boards.posts (CRUD)
(1, 47), (1, 48), (1, 49), (1, 50)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 업체 관리자 (role_id = 2)에게 모든 게시판 관련 권한 부여
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- content_management (부모 페이지 접근)
(2, 42),
-- board_types (CRUD) - 업체 관리자도 게시판 타입 관리 가능
(2, 43), (2, 44), (2, 45), (2, 46),
-- boards.posts (CRUD)
(2, 47), (2, 48), (2, 49), (2, 50)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- ============================================================
-- 4. 샘플 데이터 (boards & posts)
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
-- 5. 완료 및 검증
-- ============================================================

-- 트랜잭션 커밋
COMMIT;

-- 외래 키 체크 복원
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- 결과 확인
SELECT '==================================================' AS '';
SELECT 'Boards 권한 설정 완료! (Option A: 관리/사용 분리)' AS status;
SELECT '==================================================' AS '';

-- 생성된 페이지 확인
SELECT 
    p.page_id,
    p.page_name,
    p.display_name,
    p.path,
    COALESCE(parent.display_name, '(최상위)') AS parent_category,
    p.sort_order
FROM pages p
LEFT JOIN pages parent ON p.parent_id = parent.page_id
WHERE p.page_id IN (15, 16, 17)
ORDER BY p.page_id;

SELECT '==================================================' AS '';
SELECT '생성된 권한 목록' AS '';
SELECT '==================================================' AS '';

-- 생성된 권한 확인
SELECT 
    perm.permission_id,
    p.page_name,
    a.action_name,
    perm.display_name,
    perm.description
FROM permissions perm
JOIN pages p ON perm.page_id = p.page_id
JOIN actions a ON perm.action_id = a.action_id
WHERE perm.permission_id BETWEEN 42 AND 50
ORDER BY perm.permission_id;

SELECT '==================================================' AS '';
SELECT '역할별 할당된 게시판 권한' AS '';
SELECT '==================================================' AS '';

-- 역할별 할당된 권한 확인
SELECT 
    r.role_id,
    r.role_name,
    r.display_name AS role_display_name,
    COUNT(rp.permission_id) AS boards_permissions_count,
    GROUP_CONCAT(
        CONCAT(p.page_name, '.', a.action_name) 
        ORDER BY perm.permission_id 
        SEPARATOR ', '
    ) AS assigned_permissions
FROM roles r
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.permission_id
JOIN pages p ON perm.page_id = p.page_id
JOIN actions a ON perm.action_id = a.action_id
WHERE rp.permission_id BETWEEN 42 AND 50
GROUP BY r.role_id, r.role_name, r.display_name
ORDER BY r.role_id;

SELECT '==================================================' AS '';
SELECT '구조 요약' AS '';
SELECT '==================================================' AS '';
SELECT '' AS '';
SELECT '📌 페이지 구조:' AS info;
SELECT '   1. board_types (system_management 아래)' AS info;
SELECT '      → 게시판 종류 관리 (관리자 전용)' AS info;
SELECT '      → API: POST/GET/PATCH/DELETE /boards' AS info;
SELECT '' AS '';
SELECT '   2. content_management (최상위 카테고리)' AS info;
SELECT '      → 콘텐츠 관리 메뉴 그룹' AS info;
SELECT '' AS '';
SELECT '   3. boards.posts (content_management 아래)' AS info;
SELECT '      → 게시글 작성/관리 (일반 사용자도 가능)' AS info;
SELECT '      → API: POST/GET/PATCH/DELETE /boards/:boardId/posts' AS info;
SELECT '' AS '';
SELECT '✅ 권한 분리 완료: 게시판 타입 관리와 게시글 사용 분리' AS info;
SELECT '==================================================' AS '';

SELECT '' AS '';
SELECT '=== 샘플 데이터 ===' AS '';
SELECT '==================================================' AS '';

-- 생성된 게시판 확인 (모든 테넌트)
SELECT 
    CASE 
        WHEN b.tenant_id = 1 THEN 'system'
        WHEN b.tenant_id = 2 THEN 'demo_company'
        ELSE CONCAT('tenant_', b.tenant_id)
    END AS tenant,
    b.board_id,
    b.board_key,
    b.name,
    b.description,
    b.sort_order,
    b.is_active,
    COUNT(p.post_id) AS post_count
FROM board b
LEFT JOIN post p ON b.board_id = p.board_id AND p.delete_state = 'N'
WHERE b.tenant_id IN (1, 2)
GROUP BY b.tenant_id, b.board_id
ORDER BY b.tenant_id, b.sort_order;

SELECT '' AS '';
SELECT '=== 테넌트별 통계 ===' AS '';
SELECT '==================================================' AS '';

-- 테넌트별 통계
SELECT 
    CASE 
        WHEN t.tenant_id = 1 THEN 'system'
        WHEN t.tenant_id = 2 THEN 'demo_company'
        ELSE t.tenant_name
    END AS tenant,
    COUNT(DISTINCT b.board_id) AS board_count,
    COUNT(DISTINCT p.post_id) AS post_count,
    SUM(CASE WHEN p.is_notice = 1 THEN 1 ELSE 0 END) AS notice_count,
    SUM(CASE WHEN p.is_notice = 0 THEN 1 ELSE 0 END) AS normal_count
FROM tenants t
LEFT JOIN board b ON t.tenant_id = b.tenant_id
LEFT JOIN post p ON b.board_id = p.board_id AND p.delete_state = 'N'
WHERE t.tenant_id IN (1, 2)
GROUP BY t.tenant_id, t.tenant_name
ORDER BY t.tenant_id;

SELECT '' AS '';
SELECT '=== 게시판별 게시글 목록 (tenant_id = 1: system) ===' AS '';
SELECT '==================================================' AS '';

-- tenant_id = 1 게시글
SELECT 
    p.post_id,
    b.name AS board_name,
    p.title,
    CASE WHEN p.is_notice = 1 THEN '공지' ELSE '일반' END AS post_type,
    p.is_active,
    CASE 
        WHEN p.start_dtm IS NOT NULL AND NOW() < p.start_dtm THEN '게시 예정'
        WHEN p.end_dtm IS NOT NULL AND NOW() > p.end_dtm THEN '게시 종료'
        ELSE '게시 중'
    END AS status
FROM post p
JOIN board b ON p.board_id = b.board_id
WHERE p.tenant_id = 1 AND p.delete_state = 'N'
ORDER BY b.board_id, p.is_notice DESC, p.post_id;

SELECT '' AS '';
SELECT '=== 게시판별 게시글 목록 (tenant_id = 2: demo_company) ===' AS '';
SELECT '==================================================' AS '';

-- tenant_id = 2 게시글
SELECT 
    p.post_id,
    b.name AS board_name,
    p.title,
    CASE WHEN p.is_notice = 1 THEN '공지' ELSE '일반' END AS post_type,
    p.is_active,
    CASE 
        WHEN p.start_dtm IS NOT NULL AND NOW() < p.start_dtm THEN '게시 예정'
        WHEN p.end_dtm IS NOT NULL AND NOW() > p.end_dtm THEN '게시 종료'
        ELSE '게시 중'
    END AS status
FROM post p
JOIN board b ON p.board_id = b.board_id
WHERE p.tenant_id = 2 AND p.delete_state = 'N'
ORDER BY b.board_id, p.is_notice DESC, p.post_id;

SELECT '==================================================' AS '';
