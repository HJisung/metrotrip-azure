-- =====================================================================
-- 지하철 노선 기반 관광 추천 서비스 - 테이블 생성 스크립트
-- 근거 문서 : 데이터베이스 명세서 V1.7 (2026-07-28)
-- 대상 DBMS : MySQL 8.0
-- 비고      : 인덱스(CREATE INDEX)는 포함하지 않음. 기능 개발 후 별도 적용.
--             PK / UNIQUE / FK / CHECK 제약만 정의한다.
-- =====================================================================

-- 데이터베이스 생성.
-- CREATE DATABASE metrotrip_db;
-- MySQL 8.0 은 옵션을 생략하면 utf8mb4 / utf8mb4_0900_ai_ci 로 생성.

-- 데이터베이스 선택.
USE metrotrip_db;

-- ---------------------------------------------------------------------
-- 재실행용 초기화 (운영 DB에서는 절대 실행하지 말 것)
-- ---------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS line_view_logs, notices, review_tags, review_media,
--   reviews, travel_plan_items, travel_plans, station_favorites,
--   place_images, place_stations, places, train_timetables, line_stations,
--   stations, subway_lines, email_verifications, auth_tokens,
--   social_accounts, user_agreements, users;
-- SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- 1. users : 회원
-- 요구사항 : UM-001, MB-009, MB-010
-- =====================================================================
CREATE TABLE users (
  user_id      BIGINT       NOT NULL AUTO_INCREMENT   COMMENT '회원 식별자',
  email        VARCHAR(255) NOT NULL                  COMMENT '이메일. 로그인 ID 겸용',
  password     VARCHAR(255) NULL                      COMMENT '비밀번호. 단방향 해시 저장. 소셜 전용 계정은 NULL',
  name         VARCHAR(50)  NOT NULL                  COMMENT '이름(실명)',
  nickname     VARCHAR(30)  NOT NULL                  COMMENT '닉네임. 게시판 노출명',
  phone        VARCHAR(20)  NULL                      COMMENT '전화번호. - 제외 저장',
  role         VARCHAR(20)  NOT NULL DEFAULT 'USER'   COMMENT '권한. USER / ADMIN',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입 일시',
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시. 애플리케이션에서 갱신',
  CONSTRAINT pk_users        PRIMARY KEY (user_id),
  CONSTRAINT uk_users_email  UNIQUE (email),
  CONSTRAINT uk_users_nick   UNIQUE (nickname),
  CONSTRAINT ck_users_role   CHECK (role IN ('USER', 'ADMIN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='회원';


-- =====================================================================
-- 2. subway_lines : 지하철 노선
-- 요구사항 : CM-001, CM-002, CM-003
-- =====================================================================
CREATE TABLE subway_lines (
  line_id        BIGINT      NOT NULL AUTO_INCREMENT COMMENT '노선 식별자',
  line_name      VARCHAR(50) NOT NULL                COMMENT '노선명. 예: 2호선',
  line_number    VARCHAR(10) NULL                    COMMENT '노선 번호. 예: 2',
  display_order  INT         NOT NULL DEFAULT 0      COMMENT '노선도 정렬 순서',
  CONSTRAINT pk_subway_lines      PRIMARY KEY (line_id),
  CONSTRAINT uk_subway_lines_name UNIQUE (line_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='지하철 노선';


-- =====================================================================
-- 3. stations : 지하철 역
-- 요구사항 : CM-004, CM-005, CM-006
-- =====================================================================
CREATE TABLE stations (
  station_id    BIGINT        NOT NULL AUTO_INCREMENT COMMENT '역 식별자',
  station_name  VARCHAR(100)  NOT NULL                COMMENT '역명. 역 검색 대상',
  station_code  VARCHAR(20)   NULL                    COMMENT '역 코드. 공공 API 연동용 외부 코드',
  latitude      DECIMAL(10,7) NOT NULL                COMMENT '위도. 지도 표시 및 반경 계산 기준',
  longitude     DECIMAL(10,7) NOT NULL                COMMENT '경도. 지도 표시 및 반경 계산 기준',
  address       VARCHAR(255)  NULL                    COMMENT '역 소재지 도로명 주소',
  CONSTRAINT pk_stations      PRIMARY KEY (station_id),
  CONSTRAINT uk_stations_code UNIQUE (station_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='지하철 역';


-- =====================================================================
-- 4. user_agreements : 약관 동의 이력
-- 요구사항 : UM-001, CM-010
-- =====================================================================
CREATE TABLE user_agreements (
  agreement_id    BIGINT      NOT NULL AUTO_INCREMENT COMMENT '동의 이력 식별자',
  user_id         BIGINT      NOT NULL                COMMENT '회원 ID',
  agreement_type  VARCHAR(30) NOT NULL                COMMENT '동의 유형. TERMS / PRIVACY / LOCATION / MARKETING',
  is_agreed       TINYINT(1)  NOT NULL DEFAULT 1      COMMENT '1=동의, 0=철회',
  agreed_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '동의·철회 시각',
  CONSTRAINT pk_user_agreements   PRIMARY KEY (agreement_id),
  CONSTRAINT fk_agreements_user   FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT ck_agreements_type   CHECK (agreement_type IN ('TERMS', 'PRIVACY', 'LOCATION', 'MARKETING')),
  CONSTRAINT ck_agreements_agreed CHECK (is_agreed IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='약관 동의 이력';


-- =====================================================================
-- 5. social_accounts : 소셜 계정 연동
-- 요구사항 : UM-002, MB-002
-- =====================================================================
CREATE TABLE social_accounts (
  social_account_id  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '소셜 계정 식별자',
  user_id            BIGINT       NOT NULL                COMMENT '회원 ID',
  provider           VARCHAR(20)  NOT NULL                COMMENT '제공자. KAKAO / NAVER',
  provider_user_id   VARCHAR(100) NOT NULL                COMMENT '소셜 서비스가 발급한 고유 ID',
  connected_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 연동 일시',
  CONSTRAINT pk_social_accounts     PRIMARY KEY (social_account_id),
  CONSTRAINT uk_social_provider     UNIQUE (provider, provider_user_id),
  CONSTRAINT fk_social_user         FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT ck_social_provider     CHECK (provider IN ('KAKAO', 'NAVER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='소셜 계정 연동';


-- =====================================================================
-- 6. auth_tokens : 인증 토큰
-- 요구사항 : MB-001, MB-002
-- =====================================================================
CREATE TABLE auth_tokens (
  token_id       BIGINT       NOT NULL AUTO_INCREMENT COMMENT '토큰 식별자',
  user_id        BIGINT       NOT NULL                COMMENT '회원 ID',
  refresh_token  VARCHAR(512) NOT NULL                COMMENT '리프레시 토큰. 해시 저장',
  issued_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 일시',
  expires_at     DATETIME     NOT NULL                COMMENT '만료 일시',
  revoked_at     DATETIME     NULL                    COMMENT '토큰 무효화 시각',
  user_agent     VARCHAR(255) NULL                    COMMENT '접속 기기. 다중 기기 로그인 식별용',
  CONSTRAINT pk_auth_tokens     PRIMARY KEY (token_id),
  CONSTRAINT uk_auth_refresh    UNIQUE (refresh_token),
  CONSTRAINT fk_auth_user       FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='인증 토큰';


-- =====================================================================
-- 7. email_verifications : 이메일 인증
-- 요구사항 : MB-010
-- =====================================================================
CREATE TABLE email_verifications (
  verification_id  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '인증 식별자',
  user_id          BIGINT       NULL                    COMMENT '회원 ID. 가입 전 인증은 NULL',
  email            VARCHAR(255) NOT NULL                COMMENT '인증번호 발송 대상',
  purpose          VARCHAR(20)  NOT NULL                COMMENT '인증 목적. WITHDRAWAL / SIGNUP / PASSWORD_RESET',
  code_hash        VARCHAR(255) NOT NULL                COMMENT '인증번호 해시. 평문 저장 금지',
  expires_at       DATETIME     NOT NULL                COMMENT '만료 일시. 발급 시각 + 5분',
  attempt_count    INT          NOT NULL DEFAULT 0      COMMENT '시도 횟수. 무차별 대입 차단용',
  verified_at      DATETIME     NULL                    COMMENT '인증 성공 시각. NULL이면 미인증',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 일시',
  CONSTRAINT pk_email_verifications PRIMARY KEY (verification_id),
  CONSTRAINT fk_email_verif_user    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT ck_email_verif_purpose CHECK (purpose IN ('WITHDRAWAL', 'SIGNUP', 'PASSWORD_RESET'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='이메일 인증';


-- =====================================================================
-- 8. line_stations : 노선-역 매핑
-- 요구사항 : CM-002, CM-005
-- =====================================================================
CREATE TABLE line_stations (
  line_station_id  BIGINT NOT NULL AUTO_INCREMENT COMMENT '매핑 식별자',
  line_id          BIGINT NOT NULL                COMMENT '노선 ID',
  station_id       BIGINT NOT NULL                COMMENT '역 ID',
  station_order    INT    NOT NULL                COMMENT '해당 노선에서의 정렬 순서(상행 기준)',
  CONSTRAINT pk_line_stations       PRIMARY KEY (line_station_id),
  CONSTRAINT uk_line_stations       UNIQUE (line_id, station_id),
  CONSTRAINT fk_line_stations_line  FOREIGN KEY (line_id)    REFERENCES subway_lines (line_id) ON DELETE RESTRICT,
  CONSTRAINT fk_line_stations_stn   FOREIGN KEY (station_id) REFERENCES stations (station_id)  ON DELETE RESTRICT,
  CONSTRAINT ck_line_stations_order CHECK (station_order >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='노선-역 매핑';


-- =====================================================================
-- 9. train_timetables : 열차 시간표
-- 요구사항 : CM-009
-- =====================================================================
CREATE TABLE train_timetables (
  timetable_id            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '시간표 식별자',
  line_id                 BIGINT      NOT NULL                COMMENT '노선 ID',
  station_id              BIGINT      NOT NULL                COMMENT '역 ID',
  day_type                VARCHAR(10) NOT NULL                COMMENT '요일 구분. WEEKDAY / SATURDAY / HOLIDAY',
  direction               VARCHAR(10) NOT NULL                COMMENT '운행 방향. UP(상행) / DOWN(하행)',
  arrival_time            TIME        NOT NULL                COMMENT '해당 역 도착 예정 시각',
  destination_station_id  BIGINT      NULL                    COMMENT '종착역 ID',
  CONSTRAINT pk_train_timetables      PRIMARY KEY (timetable_id),
  CONSTRAINT fk_timetables_line       FOREIGN KEY (line_id)    REFERENCES subway_lines (line_id) ON DELETE RESTRICT,
  CONSTRAINT fk_timetables_station    FOREIGN KEY (station_id) REFERENCES stations (station_id)  ON DELETE RESTRICT,
  CONSTRAINT fk_timetables_dest       FOREIGN KEY (destination_station_id) REFERENCES stations (station_id) ON DELETE SET NULL,
  CONSTRAINT ck_timetables_day_type   CHECK (day_type  IN ('WEEKDAY', 'SATURDAY', 'HOLIDAY')),
  CONSTRAINT ck_timetables_direction  CHECK (direction IN ('UP', 'DOWN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='열차 시간표';


-- =====================================================================
-- 10. places : 추천 장소
-- 요구사항 : AD-001~003, CM-006, CM-007
-- =====================================================================
CREATE TABLE places (
  place_id     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '장소 식별자',
  place_name   VARCHAR(100)  NOT NULL                COMMENT '장소 이름',
  category     VARCHAR(30)   NOT NULL                COMMENT '카테고리. TOUR / RESTAURANT / CAFE / SHOPPING / ETC',
  description  TEXT          NULL                    COMMENT '상세 소개',
  address      VARCHAR(255)  NOT NULL                COMMENT '도로명 주소',
  latitude     DECIMAL(10,7) NOT NULL                COMMENT '위도. 지도 마커 좌표',
  longitude    DECIMAL(10,7) NOT NULL                COMMENT '경도. 지도 마커 좌표',
  phone        VARCHAR(20)   NULL                    COMMENT '장소 연락처',
  created_by   BIGINT        NULL                    COMMENT '등록 관리자 ID',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시. 애플리케이션에서 갱신',
  CONSTRAINT pk_places          PRIMARY KEY (place_id),
  CONSTRAINT fk_places_creator  FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT ck_places_category CHECK (category IN ('TOUR', 'RESTAURANT', 'CAFE', 'SHOPPING', 'ETC'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='추천 장소';


-- =====================================================================
-- 11. place_stations : 장소-역 매핑
-- 요구사항 : AD-002, CM-006
-- =====================================================================
CREATE TABLE place_stations (
  place_station_id  BIGINT NOT NULL AUTO_INCREMENT COMMENT '매핑 식별자',
  place_id          BIGINT NOT NULL                COMMENT '장소 ID',
  station_id        BIGINT NOT NULL                COMMENT '역 ID. 반경 1km 기준',
  CONSTRAINT pk_place_stations      PRIMARY KEY (place_station_id),
  CONSTRAINT fk_place_stations_pl   FOREIGN KEY (place_id)   REFERENCES places (place_id)     ON DELETE CASCADE,
  CONSTRAINT fk_place_stations_stn  FOREIGN KEY (station_id) REFERENCES stations (station_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='장소-역 매핑';


-- =====================================================================
-- 12. place_images : 장소 이미지
-- 요구사항 : AD-001
-- sort_order 값이 가장 작은 행을 대표 이미지로 사용
-- =====================================================================
CREATE TABLE place_images (
  place_image_id  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '이미지 식별자',
  place_id        BIGINT       NOT NULL                COMMENT '장소 ID',
  image_url       VARCHAR(500) NOT NULL                COMMENT '오브젝트 스토리지 경로',
  sort_order      INT          NOT NULL                COMMENT '정렬 순서. 1부터 순차 부여. 최솟값이 대표 이미지',
  CONSTRAINT pk_place_images        PRIMARY KEY (place_image_id),
  CONSTRAINT uk_place_images_order  UNIQUE (place_id, sort_order),
  CONSTRAINT fk_place_images_place  FOREIGN KEY (place_id) REFERENCES places (place_id) ON DELETE CASCADE,
  CONSTRAINT ck_place_images_order  CHECK (sort_order >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='장소 이미지';


-- =====================================================================
-- 13. station_favorites : 역 즐겨찾기
-- 요구사항 : MB-012, MB-013, MB-014
-- =====================================================================
CREATE TABLE station_favorites (
  favorite_id  BIGINT   NOT NULL AUTO_INCREMENT COMMENT '즐겨찾기 식별자',
  user_id      BIGINT   NOT NULL                COMMENT '회원 ID',
  station_id   BIGINT   NOT NULL                COMMENT '역 ID',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '즐겨찾기 추가 시각',
  CONSTRAINT pk_station_favorites    PRIMARY KEY (favorite_id),
  CONSTRAINT uk_favorites_user_stn   UNIQUE (user_id, station_id),
  CONSTRAINT fk_favorites_user       FOREIGN KEY (user_id)    REFERENCES users (user_id)       ON DELETE CASCADE,
  CONSTRAINT fk_favorites_station    FOREIGN KEY (station_id) REFERENCES stations (station_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='역 즐겨찾기';


-- =====================================================================
-- 14. travel_plans : 여행 동선 계획
-- 요구사항 : MB-008, MB-015~017
-- =====================================================================
CREATE TABLE travel_plans (
  plan_id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '계획 식별자',
  user_id           BIGINT       NOT NULL                COMMENT '회원 ID',
  plan_title        VARCHAR(100) NOT NULL                COMMENT '계획 제목',
  start_station_id  BIGINT       NOT NULL                COMMENT '출발역 ID',
  end_station_id    BIGINT       NOT NULL                COMMENT '도착역 ID',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 일시',
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시. 애플리케이션에서 갱신',
  CONSTRAINT pk_travel_plans        PRIMARY KEY (plan_id),
  CONSTRAINT fk_plans_user          FOREIGN KEY (user_id)          REFERENCES users (user_id)       ON DELETE CASCADE,
  CONSTRAINT fk_plans_start_station FOREIGN KEY (start_station_id) REFERENCES stations (station_id) ON DELETE RESTRICT,
  CONSTRAINT fk_plans_end_station   FOREIGN KEY (end_station_id)   REFERENCES stations (station_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='여행 동선 계획';


-- =====================================================================
-- 15. travel_plan_items : 여행 계획 상세
-- 요구사항 : MB-008, MB-015
-- 동선 순서는 visit_time 오름차순. 조회 시 ORDER BY visit_time, plan_item_id
-- =====================================================================
CREATE TABLE travel_plan_items (
  plan_item_id  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '계획 상세 식별자',
  plan_id       BIGINT       NOT NULL                COMMENT '계획 ID',
  place_id      BIGINT       NOT NULL                COMMENT '방문 장소 ID',
  station_id    BIGINT       NULL                    COMMENT '경유역 ID. 장소 접근 역',
  visit_time    TIME         NOT NULL                COMMENT '방문 시간. 동선 순서 결정 기준',
  memo          VARCHAR(255) NULL                    COMMENT '사용자 메모',
  CONSTRAINT pk_travel_plan_items   PRIMARY KEY (plan_item_id),
  CONSTRAINT fk_plan_items_plan     FOREIGN KEY (plan_id)    REFERENCES travel_plans (plan_id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_items_place    FOREIGN KEY (place_id)   REFERENCES places (place_id)      ON DELETE RESTRICT,
  CONSTRAINT fk_plan_items_station  FOREIGN KEY (station_id) REFERENCES stations (station_id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='여행 계획 상세';


-- =====================================================================
-- 16. reviews : 여행 후기
-- 요구사항 : MB-003, MB-004, MB-005, MB-011, AD-007
-- =====================================================================
CREATE TABLE reviews (
  review_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '후기 식별자',
  user_id           BIGINT       NOT NULL                COMMENT '작성자 ID',
  title             VARCHAR(100) NOT NULL                COMMENT '글 제목',
  content           TEXT         NOT NULL                COMMENT '본문',
  start_station_id  BIGINT       NOT NULL                COMMENT '출발역 ID',
  end_station_id    BIGINT       NOT NULL                COMMENT '도착역 ID',
  rating            TINYINT      NOT NULL                COMMENT '별점. 반개 단위 표현을 위해 1~10 정수로 저장',
  travel_cost       INT          NULL                    COMMENT '여행 경비. 단위 원(KRW)',
  plan_id           BIGINT       NULL                    COMMENT '연계 계획 ID. 동선 가져오기',
  view_count        INT          NOT NULL DEFAULT 0      COMMENT '조회수',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 일시',
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시. 애플리케이션에서 갱신',
  CONSTRAINT pk_reviews               PRIMARY KEY (review_id),
  CONSTRAINT fk_reviews_user          FOREIGN KEY (user_id)          REFERENCES users (user_id)        ON DELETE CASCADE,
  CONSTRAINT fk_reviews_start_station FOREIGN KEY (start_station_id) REFERENCES stations (station_id)  ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_end_station   FOREIGN KEY (end_station_id)   REFERENCES stations (station_id)  ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_plan          FOREIGN KEY (plan_id)          REFERENCES travel_plans (plan_id) ON DELETE SET NULL,
  CONSTRAINT ck_reviews_rating        CHECK (rating BETWEEN 1 AND 10),
  CONSTRAINT ck_reviews_cost          CHECK (travel_cost >= 0),
  CONSTRAINT ck_reviews_view_count    CHECK (view_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='여행 후기';


-- =====================================================================
-- 17. review_media : 후기 첨부 미디어
-- 요구사항 : MB-003
-- =====================================================================
CREATE TABLE review_media (
  media_id    BIGINT       NOT NULL AUTO_INCREMENT COMMENT '미디어 식별자',
  review_id   BIGINT       NOT NULL                COMMENT '후기 ID',
  media_url   VARCHAR(500) NOT NULL                COMMENT '오브젝트 스토리지 경로',
  media_type  VARCHAR(10)  NOT NULL                COMMENT '미디어 유형. IMAGE / VIDEO',
  CONSTRAINT pk_review_media       PRIMARY KEY (media_id),
  CONSTRAINT fk_review_media_rev   FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE,
  CONSTRAINT ck_review_media_type  CHECK (media_type IN ('IMAGE', 'VIDEO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='후기 첨부 미디어';


-- =====================================================================
-- 18. review_tags : 후기 태그
-- 요구사항 : MB-003, MB-005, MB-006, MB-007
-- 영문 태그는 애플리케이션에서 소문자로 변환한 뒤 저장한다
-- =====================================================================
CREATE TABLE review_tags (
  review_tag_id  BIGINT      NOT NULL AUTO_INCREMENT COMMENT '태그 식별자',
  review_id      BIGINT      NOT NULL                COMMENT '후기 ID',
  tag_name       VARCHAR(30) NOT NULL                COMMENT '회원이 직접 입력한 커스텀 태그',
  CONSTRAINT pk_review_tags      PRIMARY KEY (review_tag_id),
  CONSTRAINT uk_review_tags      UNIQUE (review_id, tag_name),
  CONSTRAINT fk_review_tags_rev  FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='후기 태그';


-- =====================================================================
-- 19. notices : 공지사항
-- 요구사항 : AD-004, AD-005, AD-006
-- =====================================================================
CREATE TABLE notices (
  notice_id    BIGINT       NOT NULL AUTO_INCREMENT COMMENT '공지 식별자',
  admin_id     BIGINT       NULL                    COMMENT '작성 관리자 ID',
  title        VARCHAR(200) NOT NULL                COMMENT '공지 제목',
  content      TEXT         NOT NULL                COMMENT '공지 본문',
  notice_type  VARCHAR(20)  NOT NULL DEFAULT 'BOARD' COMMENT '공지 유형. ALARM(알림 안내) / BOARD(게시판)',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시. 애플리케이션에서 갱신',
  CONSTRAINT pk_notices       PRIMARY KEY (notice_id),
  CONSTRAINT fk_notices_admin FOREIGN KEY (admin_id) REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT ck_notices_type  CHECK (notice_type IN ('ALARM', 'BOARD'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='공지사항';


-- =====================================================================
-- 20. line_view_logs : 노선 조회 로그
-- 요구사항 : CM-003
-- =====================================================================
CREATE TABLE line_view_logs (
  log_id     BIGINT   NOT NULL AUTO_INCREMENT COMMENT '로그 식별자',
  line_id    BIGINT   NOT NULL                COMMENT '노선 ID',
  user_id    BIGINT   NULL                    COMMENT '회원 ID. 비회원은 NULL',
  viewed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '조회 일시. 최근 1시간 집계 기준',
  CONSTRAINT pk_line_view_logs     PRIMARY KEY (log_id),
  CONSTRAINT fk_view_logs_line     FOREIGN KEY (line_id) REFERENCES subway_lines (line_id) ON DELETE RESTRICT,
  CONSTRAINT fk_view_logs_user     FOREIGN KEY (user_id) REFERENCES users (user_id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='노선 조회 로그';
