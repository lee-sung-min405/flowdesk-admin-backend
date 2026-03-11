-- ============================================================
-- flowdesk-admin 데이터 초기화 및 재설정
-- 
-- 실행 방법:
--   mysql -u [username] -p [database_name] < reset-and-seed.sql
--
-- 경고: 이 스크립트는 모든 기존 데이터를 삭제하고 초기 시드 데이터를 다시 생성합니다!
--
-- 최종 수정: 2026-03-11 (웹사이트/보안/상담/공통코드 목데이터 추가)
-- ============================================================

-- 외래 키 체크 비활성화
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 기존 데이터 완전 삭제
-- ============================================================
SELECT '🔄 기존 데이터 삭제 중...' AS 'Status';

TRUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsel_log;
TRUNCATE TABLE counsel_field_value;
TRUNCATE TABLE counsel;
TRUNCATE TABLE counsel_field_def;
TRUNCATE TABLE block_word;
TRUNCATE TABLE b-- flowdesk-admin 데이터 초기화 및 재설정
-- 
-- 실NC-- 
-- 실행 방법:
--   mysql -u [username] -p AT--TA--   mysql -u [uTR--
-- 경고: 이 스크립트는 모든 기존 데이터를 ?B-E --
-- 최종 수정: 2026-03-11 (웹사이트/보안/상담/공통코드 목데이터 추가)
-- =======================TA-LE-- ============================================================

-- 외래 키 체크 비CT '✅ 기존 데이터 삭제 완료!' AS 'Status';

-- ============================================================
-- 2. 초기 시드 데이터 재생성
-- ====================-- 1. 기존 데이터 완전 삭제
-- ======================??-- ================================atSELECT '🔄 기존 데이터 삭제 중...' AS 'Status';

TRUSE
TRUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_aTRUNCATE TABLE counsel_log;
TRU??TRUNCATE TABLE counsel_fie??TRUNCATE TABLE counsel;
TRUNCATE T
(4, 'delete', '삭제', 1TRUNCATE TABLE block_word;
TRUNCpaTRUNCATE TABLE b-- flowdeme-- 
-- 실NC-- 
-- 실행 방법:
--   mysql -u [username] -p AT--1,--UL-- 실행 , --   mysql -u [u? -- 경고: 이 스크립??자 전용 기능', 1, 1),
(2-- 최종 수정: 2026-03-11 (웹사이트/보안/상담/공통코??- =======================TA-LE-- ======================================================='?-- 외래 키 체크 비CT '✅ 기존 데이터 삭제 완료!' AS 'Status';

-- ==========s', '페이지 관리', 'RBAC 페이지 CRUD', 1, 3),
(5, 1, 'super.actions', '/pe-- 2. 초기 시드 데이터 재생성
-- =================== 1, 4),
(6, 1, 'super.permissions', '/perm-- ======================??-- ============================CR
TRUSE
TRUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_aTRUNCATE TABLE counsel_log;
TRU??TRUNCATE TABLE counsel??RUN??RUNCATE TABLE counsels_aTRUNCA/rTRU??TRUNCATE TABLE counsel_fie??TRUNCATE TABLE cou? TRUNCATE T
(4, 'delete', '삭제', 1TRUNCATE TABLE bloc?4, 'dele??TRUNCpaTRUNCATE TABLE b-- flowdeme-- 
-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실행 s/catalog', '권한 (2-- 최종 수정: 2026-03-11 (웹사이트/보안/상담/공통코??- =======================TA-LE-- ==============='?-- ==========s', '페이지 관리', 'RBAC 페이지 CRUD', 1, 3),
(5, 1, 'super.actions', '/pe-- 2. 초기 시드 데이터 재생성
-- =================== 1, 4),
(6, 1, 'super.permissions', '/perm-- ======================??-- ======== 'security', '/security', '차단 관리', 'IP, 전화번호, 단어 ?- =================== 1, 4),
(6, 1, 'super.permissions', '/perm-- '(6, 1, 'super.permissions', ??RUSE
TRUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_3, 'board_types', '/boards', '?RUN?RUNCATE TABLE counsels_aTRUNCA?류 생성/수정/삭제 (공지사항, FAQ 등)', 1, (4, 'delete', '삭제', 1TRUNCATE TABLE bloc?4, 'dele??TRUNCpaTRUNCATE TABLE b-- flowdeme-- 
-- 실NC-- 
??-- 실NC-- 
-- 실행 ??-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실행 s/catalog', '권한 (2-- 최종졕?-- 실NC?/-- 제', 1, 1)--   m'/-- 실?n(5, 1, 'super.actions', '/pe-- 2. 초기 시드 데이터 재생성
-- =================== 1, 4),
(6, 1, 'super.permissions', '/perm-- ======================??-- ======== 'security', '/security', '차단 관리', 'IP, 전화??-- =================== 1, 4),
(6, 1, 'super.permissions', '/perm--??(6, 1, 'super.permissions', ?6, 1, 'super.permissions', '/perm-- '(6, 1, 'super.permissions', ??RUSE
TRUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_3, 'board_types', '/boards', '?RUN??RUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_3, 'board_types),TRUNCATE TABLE counsels_3, 'boa ?- 실NC-- 
??-- 실NC-- 
-- 실행 ??-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실행 s/catalog', '권한 (2-- 최종졕?-- 실NC?/-- 제', 1, 1)--   m'/-- 실?n(5, 1, 'super.actions', '/pe-- 2. 초기 시드 데이터 재생',??-- 실NC, -- 실행 ??? ??-- 실NC-- 
-- 실햭?- 실행 ?4--   m'/-- 실??-- =================== 1, 4),
(6, 1, 'super.permissions', '/perm-- ======================??-- ======== 'security', ?이지 수정', 'RBAC 페이지 수정', 1),
(1(6, 1, 'super.permissions',  '(6, 1, 'super.permissions', '/perm--??(6, 1, 'super.permissions', ?6, 1, 'super.permissions', '/perm-- '(6, 1, 'super.permissions', ??RUSE
TRUNCATE TABLE ??RUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_3, 'board_types', '/boards', '?RUN??RUNCATE TABLE counsel_memo_log;
TRUNCATE ?RUNCATE TABLE counsels_3, 'boa??TRUNCATE TABLE counsels_3, 'board_types),TRUNCATE TABLE counsels_3, 'boa ?- 실NC-- 
??-- 실NC '??-- 실NC-- 
-- 실행 ??-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
-- 실햌?- 실행 ?,--   m'/-- 실??- 실햭?- 실행 ?4--   m'/-- 실??-- =================== 1, 4),
(6, 1, 'super.permissions', '/perm-- ======================??-- ======== 'security', ?이지 수정', 'RBAC 페이지 수정', ??(6, 삭제', '역할 삭제', 1),
(23, 8, 1, '사용자 조회', '사용(1(6, 1, 'super.permissions',  '(6, 1, 'super.permissions', '/perm--??(6, 1, 'super.permissions', ?6, 1, 'super.permissions', '?RUNCATE TABLE ??RUNCATE TABLE counsel_memo_log;
TRUNCATE TABLE counsels_3, 'board_types', '/boards', '?RUN??RUNCATE TABLE counsel_memo_log;
TRUNCATE ?RUNCATE TABL?RUNCATE TABLE counsels_3, 'board_types', '/boar ?RUNCATE ?RUNCATE TABLE counsels_3, 'boa??TRUNCATE TABLE counsels_3, 'board_types),TRUNCATE TA1,??-- 실NC '??-- 실NC-- 
-- 실행 ??-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- 실NC-- 
',??-- 실NC-- 
-- 실햄?-- 실행 밈?--   m'/-- 실??- 실햌?- 실행 ?,--   m'/-- 실??1(6, 1, 'super.permissions', '/perm-- ======================??-- ======== 'security', ?이지 수정', 'RBAC 페?(23, 8, 1, '사용자 조회', '사용(1(6, 1, 'super.permissions',  '(6, 1, 'super.permissions', '/perm--??(6, 1, 'super.permissions', ?6, 1, 'super.permissio?,TRUNCATE TABLE counsels_3, 'board_types', '/boards', '?RUN??RUNCATE TABLE counsel_memo_log;
TRUNCATE ?RUNCATE TABL?RUNCATE TABLE counsels_3, 'board_types', '/boar ?RUNCATE ?RUNCATE TABLE counsels_3, 'boa???TRUNCATE ?RUNCATE TABL?RUNCATE TABLE counsels_3, 'board_types', '/boar ?RUNCATE ?RUNCATE  ?- 실행 ??-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- 실NC-- 
',??-- 실NC-- 
-- 실햄?-- 실행 밈?--   m'/-- 실??- 실햌?-????-- 실NC-- 
-- 실햲?-- 실행 반 --   m'/-- 실그 --??-- 실행 ??-- 실NC-- 
',??-- 실NC-- ?,??-- 실NC-- 
-- 실햄??- 실햄?-- ?(TRUNCATE ?RUNCATE TABL?RUNCATE TABLE counsels_3, 'board_types', '/boar ?RUNCATE ?RUNCATE TABLE counsels_3, 'boa???TRUNCATE ?RUNCATE TABL?RUNCATE TABLE counsels_3, 'board_types', '/boar ?RUNCATE ?RUNCATE  ?- 실행 ??-- 실NC-- 
??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- 실NC-- 
',??-- 실NC-- 
-- 실햄?-- 실행 밈?--   m'/-- 실??- 실햌?-????-- 실NC-- 
-- 실햲?-- 실행 반 --????-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- 실NC-- 
',??-- 실NC-- 
-- 실햄?-- 실행 밈?--   m'/-- 실??- 실햌?-????-- 실NC-- 
-- 실햲?-- 실행 반 --   m'/-- 실그 --??54, 19,-- 실행 ??--   m'/-- 실귃?--??-- 실행 ??-- 실NC-- 
',??-- 실NC--?'',??-- 실NC-- 
-- 실햄??- 실햄?-- ??- 실햲?-- 실행 반 --   m'/-- 실그 --??-- 실행 ??-- 실NC--??,??-- 실NC-- ?,??-- 실NC-- 
-- 실햄??- 실햄?-- ?(TRUNCATE??-- 실햄??- 실햄?-- ?(TR 1??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- 실NC-- 
',??-- 실NC-- 
-- 실햄?-- 실행 밈?--   m'/-- 실??- 실햌?-????-- 실NC-- 
-- 실햲?-- 실행 반 --????-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- ??- 실행 ?f--   m'/-- 실?
--??-- 실행 ??-- 실NC-- 
',??-- 실NC--.f',??-- 실NC-- 
-- 실햄?s
-- 실햄?-- ?e-- 실햲?-- 실행 반 --????-- 실NC-- 
-- 실행 방법:
--   m'/ve-- 실행 방법:
--   m'/-- 실?- 실??--   m'/-- 실??-??-- 실행 ??-- 실NC-- 
',???고 관리?,??-- 실NC-- 
-- 실햄?mi-- 실햄?-- ?-- 실햲?-- 실행 반 --   m'/-- 실그 --??54, 19,-- 실행 ??- ?,??-- 실NC--?'',??-- 실NC-- 
-- 실햄??- 실???리자: 전체 권한)
INSERT INTO role_permissions (role_-- 실햄??- 실햄?-- ??-1)-- 실햄??- 실햄?-- ?(TRUNCATE??-- 실햄??- 실햄?-- ?(TR 1??-- 실NC-- 
-- 실행 방법:
--   m'/-- 실?- 실행  (-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- ? --   m'/-- 실? --??-- 실행 ??-- 실NC-- 
',??-- 실NC--1,',??-- 실NC-- 
-- 실햄?, -- 실햄?-- ?1-- 실햲?-- 실행 반 --????-- 실NC-- 
-- 실행 방법:
--   m'/, -- 실행 방법:
--   m'/-- 실?- ??50--   m'/-- 실?2--??-- 실행 ??-- 실NC-- 
',??-- 실NC--.f',??--  5',??-- 실NC--.f',??-- 실is-- 실햄?s
-- 실햄?-- ?e--.*-- 실햄?NS-- 실행 방법:
--   m'/ve-- 실행 방법:
--   m'/--S
--   m'/ve-- 실, --   m'/-- 실?- 실??--
(',???고 관리?,??-- 실NC-- 
-- 실햄?mi-- 실햄?-- ?-- 실?,-- 실햄?mi-- 실햄?-- ?--, -- 실햄??- 실???리자: 전체 권한)
INSERT INTO role_permissions (role_-- 실햄??- 실햄?-- ??-1 (2, 48), (2, 49),INSERT INTO role_permissions (role_-- 실햄, -- 실행 방법:
--   m'/-- 실?- 실행  (-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- ? --   m'/-- 실? - u--   m'/-- 실?i--   m'/-- 실?- 실행 ??????-- 실NC-- 
mi--??-- 실행 ??-- ? --   m'/-- 실? --V1',??-- 실NC--1,',??-- 실NC-- 
-- 실햄?, -- 실햄?-- ?1-- 실wd-- 실햄?, -- 실햄?-- ?1--t_-- 실행 방법:
--   m'/, -- 실행 방법:
--   m'/-- 실?- ??2'--   m'/, -- 실',--   m'/-- 실?- ??50--nt',??-- 실NC--.f',??--  5',??-- 실NC--.f',??-- 실is-roles (user_seq,-- 실햄?-- ?e--.*-- 실햄?NS-- 실행 방법:
--   m'/ve-- at--   m'/ve-- 실행 방법:
--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUES
(1, 'counselINSERT INTO role_permissions (role_-- 실햄??- 실햄?-- ??-1 (2, 48), (2, 49),INSERT INTO role_permissions (ou--   m'/-- 실?- 실행  (-- 실행 방법:
--   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- ? --   m'/-- 실? - u--   m'/-- ? --   m'/-- 실?- 실행 ??????-- 실NC-- 
??--??-- 실행 ??-- ? --   m'/-- 실? -  3mi--??-- 실행 ??-- ? --   m'/-- 실? --V1',??-- 실NC--1,',??-- 실NC-- 
-- 실햄?, -- 실햄?--   -- 실햄?, -- 실햄?-- ?1-- 실wd-- 실햄?, -- 실햄?-- ?1--t_-- 실했/--   m'/, -- 실행 방법:
--   m'/-- 실?- ??2'--   m'/, -- 실',--   m'/-- 실D'--   m'/-- 실?- ??2'--?-   m'/ve-- at--   m'/ve-- 실행 방법:
--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUES
(1, 'counselINSER',--   m'/--S
--   m'/st--   m'/--S
--   mt??--   m'/st  --   mtatus_grou--  ??-- 실?order, is_active) VALUES
(1, 'counselINSERT INTO rons(1, 'counselINSERT INTO role_pe  --   m'/-- 실?- 실행 ??????-- 실NC-- 
--??-- 실행 ??-- ? --   m'/-- 실? - u--   m'/-- ? --   m'/-- 실?- 실행 ??????-- 실NC-- 
??--??-- 실행 ??-- ? --??--??-- 실행 ??-- ? --   m'/-- 실? -  '??--??-- 실행 ??-- ? --   m'/-- 실? -  3mi--??-- 실행 ??-- ? --   m'/-- 실? --V1',??-- ? -- 실햄?, -- 실햄?--   -- 실햄?, -- 실햄?-- ?1-- 실wd-- 실햄?, -- 실햄?-- ?1--t_-- 실했/--   m'/, -- 실?
--   m'/-- 실?- ??2'--   m'/, -- 실',--   m'/-- 실D'--   m'/-- 실?- ??2'--?-   m'/ve-- at--   m'/ve-- 실행 방법:
--'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_grou--  ??-- 실?order, is_active) VALUES
(1                      '#8B(1, 'counselINSER',--   m'/--S
IN--   m'/st--   m'/--S
--   mt, --   mt??--   m'/st ? (1, 'counselINSERT INTO rons(1, 'counselINSERT INTO role_pe  --   m'/-- ? --??-- 실행 ??-- ? --   m'/-- 실? - u--   m'/-- ? --   m'/-- 실?- 실행 ??????-- 실NC-- 
?co??--??-- 실행 ??-- ? --??--??-- 실행 ??-- ? --   m'/-- 실? -  '??--??-- 실행 ??-- ? --  #2--   m'/-- 실?- ??2'--   m'/, -- 실',--   m'/-- 실D'--   m'/-- 실?- ??2'--?-   m'/ve-- at--   m'/ve-- 실행 방법:
--'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_grou--  ??  --'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VA??--   m'/st--  ?-   mtatus_grou--  ??-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_g b(1                      '#8B(1, 'counselINSER',--   m'/--S
IN--   m'/st--   m'/--S
--   mt, --   mtceIN--   m'/st--   m'/--S
--   mt, --   mt??--   m'/st ? (1??--   mt, --   mt??--  ',?co??--??-- 실행 ??-- ? --??--??-- 실행 ??-- ? --   m'/-- 실? -  '??--??-- 실행 ??-- ? --  #2--   m'/-- 실?- ??2'--   m'/, -- 실',--   m'/-- 실D'--   m'/-- 실?- ??2'--?-   m'/ve-- at-, --'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_grou--  ??  --'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou--  (9-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_g안내', 40, 1),
(10, 2, 'qna', 'Q&A', '일반 질의응답 게시판', 50, 1);

-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??--   m'/st--  ?-   mtatus_g, IN--   m'/st--   m'/--S
--   mt, --   mtceIN--   m'/st--   m'/--S
--   mt, --   mt??--   m'/st ? (1??--   mt, --   mt??--  ',?co??--??-- 실행 ??-- ? --??--??-- 실행 ??-- ? --   m'/??-   mt, --   mtceIN--L,--   mt, --   mt??--   m'/st ? (1??--   ??--   m'/st--   m'/--S
--   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_grou--  ??  --'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou--  (9-- 실?order, is_active) ?-공지사항', '<h2>-- 실?order, is_active) VALUESun--   m'/stED--   mtat
(5, 7--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- LL--   mtatus_grou--  bs(10, 2, 'qna', 'Q&A', '일반 질의응답 게시판', 50, 1);

-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??--   m'/st--  ?d
-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   mt, --   mtceIN--   m'/st--   m'/--S
--   mt, --   mt??--   m'/st ? (1??--   mt, --   mt??--  ',?co??--??-- '--   mt, --   mt??--   m'/st ? (1??--   ??-   mtatus_grou--   m'/veke(',???고 관리?,??-- 실NC-- 
-- 실?order, is_active) VALUESun--   m'/stED--   mtatus_grou--  ??  --'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_active) VALUESun--   m'/stED--   mtatus_g?-   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- 2,--   mtatus_grou--  mo(5, 7--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- LL--   mtatus_grou--  bs(10, 2, 'qna', 'Q&A', '일반 질의응답 게시판', 5_i--   mtatus_grou--   m'/?o
-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??--   m'/st--  ?d
-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   DIU-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   mt, --  , --   mt, --   mt??--   m'/st ? (1??--   mt, --   mt??--  ',?co??--??-- '--   mt, --   mt??--   m'/st ? , -- 실?order, is_active) VALUESun--   m'/stED--   mtatus_grou--  ??  --'c--   m'/--S
--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_active, --   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?-   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- 2,--   mtatus_grou--  mo(5, 7--   m'/st--   m'/--S
--   mtatNS--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- LL--   mtatus_grou--  bs(10, 2, 'qna', 'Q&A', '?,-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??--   m'/st--  ?d
-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   DIU-- Post--   mtatus_grci-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   DIU-- Po??--   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_active, --   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?-   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- 2,--   mtatus_grou--  mo(5, 7--   m'/st--   m'/--S
--   mtatNS--   mtatus_grou-??--   mtatus_grou--  it--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?at--   mtatNS--   mtatus_grou--   m'/계--   m'/st--  ??-   mtatus_grou-- LL--   mtatus_grou--  bs(10, 2, 'qna', 'Q&A', '?,-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??--   m'/st--  '1-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   DIU-- Post--   mtatus_grci-- Post--   mtatus_grou--  SE-- 실?order, is_active) VA??-k ?-   DIU-- Po??--   m'/st--   m'/--S
--   mas--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_active, --   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?-   mtatus_grou-??--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?0---   mtatNS--   mtatus_grou-??--   mtatus_grou--  it--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?at--   mtatNS--   mtatus_grou--   m'/계--   m'/st--  ??-, --   mas--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_active, --   m'/st--   m'/--S
--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?-   mtatus_grou-??--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?0---   mtatNS--   mtatus_grou-??--   mtatus_grou--  it--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?at--   mtatNS--   mtatus_grou--   m'/계--   m'/st--  ??-, --   mas--   mtatus_grou--   m'/계--   m'ns--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?-   mtatrd--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?-   mtatus_grou-??--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?0---   mtatNS--   mtatus_grou-??--   mtatus_grou--  it--   mtatus_grou--   m'/계--   m'/st--, -- 실?order, is_act ?-   mtatus_grou--  ?at--   mtatNS--   mtatus_grou--   m'/계--   m'/st--  ??-, --   mas--   mtatus_grou--   m'/계--   m'ns--   mtatus_grou--   m'/계--   m'/st--, -- 실?or원)', '프로젝트 예상 예산', NULL, NULL),
(4, 1, 'visitDate', '방문 희망일', 'date', 0, 1, 40, NULL, '방문 상담 희망일을 선택합니다', NULL, NULL),
(5, 2, 'productInterest', '관심 상품', 'select', 1, 1, 10, '관심 상품을 선택하세요', '고객이 관심 있는 상품', NULL, '["상품A","상품B","상품C","상품D","기타"]'),
(6, 2, 'companyName', '회사명', 'text', 0, 1, 20, '회사명을 입력하세요', 'B2B 고객의 회사명', NULL, NULL),
(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL, NULL),
(8, 2, 'meetingDatetime', '미팅 희망일시', 'datetime', 0, 1, 40, NULL, '미팅 희망 일시를 선택합니다', NULL, NULL),
(9, 2, 'referralSource', '유입 경로', 'select', 0, 1, 50, NULL, '어떻게 알게 되셨나요?', NULL, '["검색엔진","SNS","지인추천","광고","기타"]');

-- Counsels
INSERT INTO counsel (counsel_seq, tenant_id, web_code, name, counsel_hp, counsel_ip, coun(4, 1, 'visitDate', '방문 희망일', 'date'iu(5, 2, 'productInterest', '관심 상품', 'select', 1, 1, 10, '관심 상품을 선택하세요', '고객이 관심 있?(6, 2, 'companyName', '회사명', 'text', 0, 1, 20, '회사명을 입력하세요', 'B2B 고객의 회사명', NULL, NULL),
(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 ?
(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetingDatetime', '미팅 희망일시', 'datetime', 0, 1, 40, NULL, '미팅 희망 일시를 선택합니다', NULL, NUL56(9, 2, 'referralSource', '유입 경로', 'select', 0, 1, 50, NULL, '어떻게 알게 되셨나요?', NULL, '["검색엔진","SNS",  
-- Counsels
INSERT INTO counsel (counsel_seq, tenant_id, web_code, name, counsel_hp, counsel_ip, coun(4, 1, 'visitDate', '방문 희망일', 'date'iu(5, 2, 'productI   INSERT INT?7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 ?
(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetingDatetime', '미팅 희망일시', 'datetime', 0, 1, 40, NULL, '미팅 희망 일시를 선택합니다', NULL, NUL56(9, 2, 'referralSource', '유입 경로', 'select', 0, 1, 'd(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 ?,-- Counsels
INSERT INTO counsel (counsel_seq, tenant_id, web_code, name, counsel_hp, counsel_ip, coun(4, 1, 'visitDate', '방문 희망일', 'date'iu(5, 2, 'productI   INSERT INT?7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 ?
(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetin  INSERT INT??7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetingDatetime', '미팅 희망일시', 'datetime', 0, 1, 40, NULL, '미팅 희망 일시를 선택??INSERT INTO counsel (counsel_seq, tenant_id, web_code, name, counsel_hp, counsel_ip, coun(4, 1, 'visitDate', '방문 희망일', 'date'iu(5, 2, 'productI   INSERT INT?7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 ?
(7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetin  INSERT INT?        (7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetin  INSERT INT??7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하  (7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetin  INSERT INT?        (7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetin  INSERT INT??7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하  (7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 수를 입력하세요', '회사 규모 파악용', NULL,  (8, 2, 'meetin  INSERT INT?        (7, 2, 'employeeCount', '직원 수', 'number', 0, 1, 30, '직원 ???A', NULL, NULL, NULL),
(6, 2, 6, 'ABC Corp', NULL, NULL, NULL),
(7, 2, 5, '상품B', NULL, NULL, NULL),
(7, 2, 9, '검색엔진', NULL, NULL, NULL),
(8, 2, 5, '상품C', NULL, NULL, NULL),
(8, 2, 6, 'XYZ Ltd', NULL, NULL, NULL),
(8, 2, 7, NULL, 50.000000, NULL, NULL),
(9, 2, 5, '상품A', NULL, NULL, NULL),
(9, 2, 8, NULL, NULL, NULL, '2026-03-25 14:00:00'),
(10, 2, 5, '상품D', NULL, NULL, NULL),
(10, 2, 6, 'DEF Inc', NULL, NULL, NULL),
(10, 2, 9, '지인추천', NULL, NULL, NULL);

-- Counsel Logs
INSERT INTO counsel_log (counsel_seq, tenant_id, log_no, counsel_stat, reg_dtm) VALUES
(1, 1, 1, 1, '2026-03-01 09:00:00'),
(2, 1, 1, 1, '2026-03-02 10:30:00'),
(2, 1, 2, 3, '2026-03-02 15:00:00'),
(3, 1, 1, 1, '2026-03-03 11:00:00'),
(3, 1, 2, 2, '2026-03-03 14:00:00'),
(3, 1, 3, 4, '2026-03-04 09:00:00'),
(4, 1, 1, 1, '2026-03-04 14:00:00'),
(4, 1, 2, 3, '2026-03-05 10:00:00'),
(4, 1, 3, 5, '2026-03-06 09:00:00'),
(5, 1, 1, 1, '2026-03-05 09:30:00'),
(5, 1, 2, 10, '2026-03-05 09:30:01'),
(6, 2, 1, 12, '2026-03(6, 2, 6, 'ABC Corp',  1(7, 2, 5, '상품B', NULL, NULL, NULL), 1(7, 2, 9, '검색엔진', NULL, NULL, 2,(8, 2, 5, '상품C', NULL, NULL, NULL),
(8,6-(8, 2, 6, 'XYZ Ltd', NULL, NULL, NULL)03(8, 2, 7, NULL, 50.000000, NULL, NULL)-0(9, 2, 5, '상품A', NULL, NULL, NULL)4 (9, 2, 8, NULL, NULL, NULL, '2026-03-209(10, 2, 5, '상품D', NULL, NULL, NULL),
(10, 2, 610(10, 2, 6, 'DEF Inc', NULL:00:00'),
(10, (10, 2, 9, '지인추천', NULL, NULL, 2,
-- Counsel Logs
INSERT INTO counsel_log (co2, INSERT INTO co:0(1, 1, 1, 1, '2026-03-01 09:00:00'),
(2, 1, 1, 1, '2026-03-02 10:30:00'),
(2, 1, 2, 3
((2, 1, 1, 1, '2026-03-02 10:30:00')),
(12, 2, 2, 21, '2026-03-07 08:30:01'(3, 1, 1, 1, '2026-03-03 11:00:00')O (3, 1, 2, 2, '2026-03-03 14:00:00')se(3, 1, 3, 4, '2026-03-04 09:00:00')ex(4, 1, 1, 1, '2026-03-04 14:00:00')1,(4, 1, 2, 3, '2026-03-05 10:00:00')??(4, 1, 3, 5, '2026-03-06 09:00:00')?5, 1, 1, 1, '2026-03-05 09:30:00')),(5, 1, 2, 10, '2026-03-05 09:30:01'?6, 2, 1, 12, '2026-03(6, 2, 6, 'ABC? (8,6-(8, 2, 6, 'XYZ Ltd', NULL, NULL, NULL)03(8, 2, 7, NULL, 50.000000, NULL, NULL)-0(9, 2, 5, '상품A', NULL, NULL, NULL)4 (9, 2, 8, NULL, NULL, NULL, '2026-03-209  (10, 2, 610(10, 2, 6, 'DEF Inc', NULL:00:00'),
(10, (10, 2, 9, '지인추천', NULL, NULL, 2,
-- Counsel Logs
INSERT INTO counsel_log (co2, INSERT INTO co:0(1, 1, 1, 1, '2026-03-01 09:00:00'),
(2, 1, 1, 10)(10, (10, 2, 9, '지인추천', NULL, NULL, 2 3-- Counsel Logs
INSERT INTO counsel_log (co2,??INSERT INTO co  (2, 1, 1, 1, '2026-03-02 10:30:00'),
(2, 1, 2, 3
((2, 1, 1, 1, '2026-03-02 10:,    (2, 1, 2, 3
((2, 1, 1, 1, '2026-03-8,((2, 1,, 18,(12, 2, 2, 21, '2026-03-07 08:30:01'??10, (10, 2, 9, '지인추천', NULL, NULL, 2,
-- Counsel Logs
INSERT INTO counsel_log (co2, INSERT INTO co:0(1, 1, 1, 1, '2026-03-01 09:00:00'),
(2, 1, 1, 10)(10, (10, 2, 9, '지인추천', NULL, NULL, 2 3-- Counsel Logs
INSERT INTO counsel_log (co2,??INSERT INTO co  (2, 1, 1, 1, '2026-03-02 10:30:00'),
(2, 1, 2, 3
((2, 1, 1, 1, '2026-03-02 10:,    (2, 1, 2, 3
((2, 1, 1, 1, '2026-03-8,((2, 1,, 18,(12, 2, 2, 21, '2026-03-07 08:30:01'??10, (10, 2, 9, '지인추천', NULL, NULL, 2,
-- Counsel Logs
INSERT INTO counsel_log (co2, INSERT INTO co:0(1, 1, 1, 1, '2026-03-01 09:00:00?- Counsel Logs
INSERT INTO counsel_log (co2,S INSERT INTO co??(2, 1, 1, 10)(10, (10, 2, 9, '지인추천', NULL, NULL, 2 3-- Counsel Logs
INSERLEINSERT INTO counsel_log (co2,??INSERT INTO co  (2, 1, 1, 1, '2026-03-02 10er(2, 1, 2, 3
((2, 1, 1, 1, '2026-03-02 10:,    (2, 1, 2, 3
((2, 1, 1, 1, '2026-03-8OM((2, 1, 1,LE((2, 1, 1, 1, '2026-03-8,((2, 1,, 18,(12, 2,UN-- Counsel Logs
INSERT INTO counsel_log (co2, INSERT INTO co:0(1, 1, 1, 1, '2026-03-01 09:00:00'),
(2, 1, 1, 10)(10, (10,naINSERT INTO coM (2, 1, 1, 10)(10, (10, 2, 9, '지인추천', NULL, NULL, 2 3-- Counsel Logs
INSER FINSERT INTO counsel_log (co2,??INSERT INTO co  (2, 1, 1, 1, '2026-03-02 10'C(2, 1, 2, 3
((2, 1, 1, 1, '2026-03-02 10:,    (2, 1, 2, 3
((2, 1, 1, 1, '2026-03-8*)((2, 1, 1, I((2, 1, 1, 1, '2026-03-8,((2, 1,, 18,(12, 2,HP-- Counsel Logs
INSERT INTO counsel_log (co2, INSERT INTO co:0(1, 1, 1, 1, '2026-03-01 09:00:00?- Counsel Logs
INSERT IldINSERT INTO coOUINSERT INTO counsel_log (co2,S INSERT INTO co??(2, 1, 1, 10)(10, (10, 2, 9, '지인추천', NULvaINSERLEINSERT INTO counsel_log (co2,??INSERT INTO co  (2, 1, 1, 1, '2026-03-02 10er(2, 1, 2, 3
((2, 1, 1, 1, '2026-03-02 EL((2, 1, 1, 1, '2026-03-02 10:,    (2, 1, 2, 3
((2, 1, 1, 1, '2026-03-8OM((2, 1, 1,LE((2, 1, 1?)((2, 1, 1, 1, '2026-03-8OM((2, 1, 1,LE((2, 1inINSERT IN?? 관리자)' AS 'Account 2';
