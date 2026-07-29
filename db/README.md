# 데이터베이스

MetroTrip 서비스의 데이터베이스 스키마와 관련 산출물입니다.

> **MVP 단계에서는 사용하지 않습니다.** 현재 발표용 MVP는 프론트엔드 단독으로 동작하며 백엔드가 없습니다.
> 이 폴더는 백엔드 연동(P1) 대비 산출물이며, [요구사항 정의서 V1.3](https://docs.google.com/spreadsheets/d/1VoXGmwvz8NwPQYi8wy_9lcEH0s8k9UKr7djuU2-z6Ss/edit) 기준으로 작성했습니다.

---

## 폴더 구성

| 경로 | 내용 |
| --- | --- |
| `schema/` | 현재 시점의 전체 테이블 구조 (baseline) |
| `erd/` | ERD 파일 |

---

## 초기 세팅

MySQL 8.0 기준입니다.

```sql
CREATE DATABASE metrotrip_db;
```

문자셋이 utf8mb4 인지 확인합니다. MySQL 8.0 은 옵션을 생략해도 기본값이 utf8mb4 입니다.

```sql
SELECT default_character_set_name, default_collation_name
FROM information_schema.schemata
WHERE schema_name = 'metrotrip_db';
```

utf8mb4 가 아니라면 아래를 먼저 실행합니다.

```sql
ALTER DATABASE metrotrip_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

이후 아래 순서로 실행합니다.

1. `schema/schema_V1.7.sql`
2. `migrations/` 하위 파일을 번호 순서대로 (있는 경우)
3. `seed/` 하위 파일

### 실행 결과 확인

```sql
-- 테이블 20개
SHOW TABLES;

-- 제약: PRIMARY KEY 20 / UNIQUE 10 / FOREIGN KEY 30 / CHECK 15
SELECT constraint_type, COUNT(*)
FROM information_schema.table_constraints
WHERE table_schema = 'metrotrip_db'
GROUP BY constraint_type;
```

---

## 스키마 현황

| 항목 | 수 |
| --- | --- |
| 테이블 | 20 |
| 컬럼 | 121 |
| PRIMARY KEY | 20 |
| UNIQUE | 10 |
| FOREIGN KEY | 30 (CASCADE 12 / RESTRICT 12 / SET NULL 6) |
| CHECK | 15 |

### 테이블 목록

| 도메인 | 테이블 |
| --- | --- |
| 회원 | `users` `user_agreements` `social_accounts` `auth_tokens` `email_verifications` |
| 지하철 | `subway_lines` `stations` `line_stations` `train_timetables` `line_view_logs` |
| 장소 | `places` `place_stations` `place_images` |
| 회원 활동 | `station_favorites` `travel_plans` `travel_plan_items` `reviews` `review_media` `review_tags` |
| 공지 | `notices` |

---

## 설계 시 정한 것들

작업 중 자주 되묻게 되는 항목만 추렸습니다. 전체 근거는 데이터베이스 명세서를 참고하세요.

**마스터 테이블 FK 정책**
`subway_lines` `stations` `places` 를 참조하는 FK 는 `ON DELETE RESTRICT` 로 통일했습니다.
예외로 `train_timetables.destination_station_id`(종착역)와 `travel_plan_items.station_id`(경유역)는
부가 정보이므로 `SET NULL` 입니다.

**여행 계획 동선 정렬**
`travel_plan_items` 에 순번 컬럼이 없습니다. 동선 순서는 `visit_time` 오름차순으로 결정합니다.
같은 시각이 둘 이상일 수 있으므로 조회 시 아래처럼 정렬해야 순서가 흔들리지 않습니다.

```sql
ORDER BY visit_time, plan_item_id
```

**장소 대표 이미지**
`places` 에 썸네일 컬럼이 없습니다. `place_images` 에서 `sort_order` 값이 가장 작은 행이 대표 이미지입니다.
`(place_id, sort_order)` 복합 UNIQUE 로 순서 중복을 막습니다.

**태그 대소문자**
영문 태그는 **애플리케이션에서 소문자로 변환한 뒤** 저장합니다. 검색어에도 같은 변환을 적용해야 합니다.
한글·숫자 태그는 정규화 대상이 아닙니다.

**수정 시각**
`updated_at` 은 `ON UPDATE CURRENT_TIMESTAMP` 를 걸지 않았습니다.
**UPDATE 문에서 직접 값을 넣어야 갱신됩니다.**

**인덱스**
현재 PK / UNIQUE / FK 인덱스만 있습니다. 조회 성능용 인덱스는 기능 개발 후
`EXPLAIN` 으로 확인하며 `migrations/` 에 추가할 예정입니다.

---

## 스키마를 변경할 때

1. `migrations/` 에 다음 번호로 파일을 추가합니다.

   ```
   001__add_review_share_table.sql
   002__alter_places_address_nullable.sql
   ```

2. 되돌리는 방법을 주석으로 남깁니다.

   ```sql
   ALTER TABLE places MODIFY COLUMN address VARCHAR(255) NULL;

   -- rollback:
   -- ALTER TABLE places MODIFY COLUMN address VARCHAR(255) NOT NULL;
   ```

3. `feat/db-...` 브랜치로 PR 을 올립니다. ([CONVENTIONS.md](../docs/CONVENTIONS.md))
4. 병합 후 **팀 채널에 적용하라고 알립니다.** 올리기만 하면 아무도 실행하지 않습니다.
5. 데이터베이스 명세서를 갱신하고 버전을 올립니다.

> **이미 올린 마이그레이션 파일은 절대 수정하지 않습니다.**
> 팀원들이 이미 실행한 상태이므로, 고치면 사람마다 DB 상태가 달라집니다.
> 잘못됐으면 다음 번호 파일을 새로 만들어 되돌리세요.

---

## 하지 말아야 할 것

- 접속 정보·비밀번호를 커밋하지 않습니다. `.env` 를 사용하고 `.env.example` 에 키 이름만 공유합니다.
- 회원 데이터 덤프를 커밋하지 않습니다. 개인정보입니다.
- 운영 중인 DB 에서 `schema/` 의 DROP TABLE 블록을 실행하지 않습니다.

---

## 관련 문서

| 문서 | 위치 |
| --- | --- |
| 데이터베이스 명세서 V1.7 | 팀 공유 드라이브 |
| 요구사항 정의서 V1.3 | [Google Sheets](https://docs.google.com/spreadsheets/d/1VoXGmwvz8NwPQYi8wy_9lcEH0s8k9UKr7djuU2-z6Ss/edit) |
| ERD | `erd/ERD_V1.7.mmd` |
| 백엔드 연동 지점 | [docs/BACKEND-HANDOFF.md](../docs/BACKEND-HANDOFF.md) |

담당: 김유진
