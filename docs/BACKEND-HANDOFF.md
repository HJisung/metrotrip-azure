# 백엔드 연동 인수인계 문서

MVP는 백엔드 없이 프론트 단독으로 동작합니다.
나중에 백엔드가 붙을 때 **프론트를 크게 뜯어고치지 않도록**, 지금부터 지켜야 할 경계를 정리합니다.

> 대상: 백엔드(윤홍규), DB(김유진), 프론트(우진, 황지성)
> 상태: 현재 FastAPI Swagger 계약 기준 — 비즈니스 로직 구현 전

---

## 1. 핵심 원칙

**프론트 컴포넌트는 데이터가 어디서 오는지 몰라야 합니다.**

지금은 정적 JSON에서, 나중에는 API에서 오지만 컴포넌트 코드는 그대로여야 합니다.
그래서 데이터 접근은 반드시 **각 Feature의 `api/` 또는 shared 데이터 접근 함수 한 겹을 거쳐서** 합니다.

```
역 Feature  →  frontend/src/shared/lib/stations.ts  →  (지금) shared/data/stations.json
                                                     →  (나중) GET /api/v1/stations
장소 Feature → frontend/src/features/station-map/api/places.ts → (지금) places.json
                                                                → (나중) 백엔드 API
```

컴포넌트에서 `import stations from '../data/stations.json'` 처럼 **직접 import 하지 않습니다.**

## 2. 지금 만들어 둘 인터페이스

```ts
// frontend/src/shared/types/station.ts
export type Station = {
  name: string;
  lat: number;
  lng: number;
  line: string;
};

// frontend/src/shared/lib/stations.ts
// MVP: stations.json을 반환. 백엔드 연동 시 이 함수 내부만 fetch로 교체.
export async function getStations(): Promise<Station[]>;
export async function searchStations(keyword: string): Promise<Station[]>;
```

> `async`로 만들어 두는 이유: 나중에 API로 바꿔도 **호출부 시그니처가 바뀌지 않기 때문**입니다.
> 지금 동기 함수로 만들면 나중에 전부 고쳐야 합니다.

## 3. 교체 지점 목록

| 현재 (MVP) | 교체 후 (P1) | 영향 파일 |
|---|---|---|
| `stations.json` 정적 로드 | `GET /api/v1/stations` | `frontend/src/shared/lib/stations.ts` |
| 카카오 로컬 API 프론트 직접 호출 | 백엔드 프록시 경유 (키 은닉 + 캐싱) | `frontend/src/features/station-map/api/places.ts` |
| 없음 | 인증 토큰 처리 | `frontend/src/shared/lib/apiClient.ts` (신규) |
| 프론트에서 그래프 탐색으로 경로 계산 | `GET /api/v1/routes` (**계약에 없음 — 신설 필요**) | `frontend/src/features/route-plan/api/routes.ts` |
| DB 시드를 변환한 정적 시간표 | `GET /api/v1/stations/{id}/timetables` | `frontend/src/features/route-plan/api/timetables.ts` |
| DB 시드를 변환한 정적 역·노선 | `GET /api/v1/stations`, `/lines` | `shared/lib/stations.ts`, `route-plan/api/routes.ts` |

### 카카오 API를 백엔드로 옮겨야 하는 이유
지금은 JavaScript 키가 브라우저에 노출됩니다. MVP에서는 **도메인 제한**으로 막지만,
운영 단계에서는 백엔드가 REST 키로 호출하고 프론트는 백엔드만 부르는 구조가 맞습니다.

### 경로 탐색 API — 백엔드(윤홍규)에게 요청

`docs/SPEC.md` 2-2로 경로 기능이 범위에 들어왔는데,
**현재 계약에 경로 탐색 엔드포인트가 없습니다.** 아래 형태로 신설이 필요합니다.

```
GET /api/v1/routes?from_station_id={id}&to_station_id={id}
```

응답에 필요한 것:

| 필요한 것 | 화면에서의 용도 |
|---|---|
| 두 가지 안 (최소 시간 / 최소 환승) | 나란히 비교하는 카드 |
| 안별 경유역 목록 (순서 포함) | 세로 타임라인 렌더 |
| 안별 환승 지점 (역·이전 노선·다음 노선) | 타임라인에 환승 표시 |
| 안별 예상 소요시간 | 비교 카드의 요약 |

- 프론트 타입은 `frontend/src/features/route-plan/types.ts`에 있고,
  DB의 `stations` / `line_stations` 구조에 맞춰 잡아 뒀습니다.
- 그전까지는 프론트가 정적 데이터로 직접 그래프 탐색을 합니다.
  API가 생기면 `features/route-plan/api/routes.ts` **내부만** 교체합니다.
- **소요시간**은 시간표가 있는 구간은 실제 값으로, 없는 구간은
  `역당 2분 + 환승 5분` 근사치로 계산하고 화면에 "예상"이라고 표기합니다.
- 비교 기준은 **정차역 수가 아니라 시간**입니다. 역 사이 소요 시간이 구간마다 달라서,
  시간표가 들어오면 "역을 적게 지나는 경로"와 "빨리 도착하는 경로"가 달라집니다.

### 시간표 연동 현황 (2026-08-05, V1.10 시드 기준)

**시드를 그대로 쓰고 있습니다.** `scripts/convertSeed.mjs`가
`db/seed/`의 SQL을 프론트 정적 JSON으로 변환합니다.
DB 시드가 갱신되면 이 스크립트를 다시 돌리면 됩니다.
(변환된 JSON을 손으로 고치지 마세요 — 다음 변환 때 덮어써집니다)

`train_no` 컬럼이 있어 같은 열차를 정확히 이을 수 있습니다.
**이전 판에 적어 뒀던 "순서로 매칭하는 방법"은 더 이상 필요 없어 지웠습니다.**

프론트 계산 방식:

1. 출발 시각 이후 승차역에 오는 열차를 `train_no`로 찾는다
2. 같은 열차가 하차역에 서는 시각을 그대로 도착 시각으로 쓴다
3. 환승은 "내린 시각 이후 오는 다음 열차"를 다시 찾아 이어 붙인다

#### 시간표 데이터에서 확인된 것 (DB 담당 확인 요청)

| 항목 | 내용 |
|---|---|
| **역 3개 누락** | `직산`·`탕정`·`신창`의 시간표 행이 **0건**입니다. 신창은 종착역인데도 없습니다 |
| 커버 범위 | 시간표가 있는 역은 성환·두정·천안·봉명·쌍용·아산·배방·온양온천 **8개뿐**입니다 |
| 노선 | `1호선 (신창)` 것만 있고 `1호선 (인천)` 쪽은 없습니다 |

누락된 역은 프론트가 **앞뒤 역 사이를 나눠 추정**하고, 화면에 `약 17:44`처럼
표시해 실제 시간표 값과 구분합니다. 채워 주시면 그대로 실제 시각으로 바뀝니다.

`arrival_time`이 NULL인 시발역은 `departure_time`을 대신 씁니다 (스키마 의도대로).

## 4. 현재 백엔드 API 계약

아래 표는 현재 FastAPI의 Swagger/OpenAPI에 등록된 경로를 기준으로 합니다.
비즈니스 API는 `/api/v1`을 공통 prefix로 사용하고 리소스명은 복수형으로 통일합니다.
요청·응답 필드와 오류 모델의 상세 계약은 실행 중인 서버의 `/docs` 또는
`/openapi.json`에서 확인합니다.

| Method | Path | 용도 |
|---|---|---|
| GET | `/health` | 서버 상태 확인 |
| POST | `/api/v1/auth/register` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| POST | `/api/v1/auth/refresh` | Access Token 갱신 |
| POST | `/api/v1/auth/logout` | 로그아웃 |
| POST | `/api/v1/auth/email-verifications` | 이메일 인증 코드 발송 |
| POST | `/api/v1/auth/email-verifications/confirm` | 이메일 인증 코드 확인 |
| POST | `/api/v1/auth/password-reset/requests` | 비밀번호 재설정 코드 발송 |
| POST | `/api/v1/auth/password-reset/confirm` | 비밀번호 변경 |
| GET | `/api/v1/users/me` | 내 회원 정보 |
| PATCH | `/api/v1/users/me` | 내 회원 정보 수정 |
| DELETE | `/api/v1/users/me` | 회원 탈퇴 |
| GET | `/api/v1/users/me/favorites` | 역 즐겨찾기 목록 |
| POST | `/api/v1/users/me/favorites/{station_id}` | 역 즐겨찾기 추가 |
| DELETE | `/api/v1/users/me/favorites/{station_id}` | 역 즐겨찾기 삭제 |
| GET | `/api/v1/users/me/reviews` | 내가 작성한 후기 목록 |
| GET | `/api/v1/lines` | 노선 목록 |
| GET | `/api/v1/lines/suggestions` | 최근 조회 기록 기반 노선 추천 |
| POST | `/api/v1/lines/{line_id}/views` | 노선 조회 기록 |
| GET | `/api/v1/stations` | 역 목록 및 `keyword` 검색 |
| GET | `/api/v1/stations/{station_id}` | 역 상세 |
| GET | `/api/v1/stations/{station_id}/places` | 역 주변 장소 |
| GET | `/api/v1/stations/{station_id}/timetables` | DB 시간표 조회 |
| GET | `/api/v1/plans` | 내 여행 계획 목록 |
| POST | `/api/v1/plans` | 여행 계획 작성 |
| GET | `/api/v1/plans/{plan_id}` | 여행 계획 상세 |
| PATCH | `/api/v1/plans/{plan_id}` | 여행 계획 수정 |
| DELETE | `/api/v1/plans/{plan_id}` | 여행 계획 삭제 |
| POST | `/api/v1/plans/{plan_id}/share-links` | 읽기 전용 공유 링크 발급 |
| GET | `/api/v1/shared-plans/{share_token}` | 공유 여행 계획 읽기 전용 조회 |
| GET | `/api/v1/reviews` | 후기 목록 |
| POST | `/api/v1/reviews` | 후기 작성 |
| GET | `/api/v1/reviews/{review_id}` | 후기 상세 |
| PATCH | `/api/v1/reviews/{review_id}` | 후기 수정 |
| DELETE | `/api/v1/reviews/{review_id}` | 후기 삭제 |
| POST | `/api/v1/review-media` | 후기 미디어 업로드 URL 발급 |
| GET | `/api/v1/notices` | 공지사항 목록 |
| GET | `/api/v1/notices/{notice_id}` | 공지사항 상세 |
| GET | `/api/v1/posts` | 일반·모집 게시글 목록 |
| POST | `/api/v1/posts` | 게시글 작성 |
| GET | `/api/v1/posts/{post_id}` | 게시글 상세 |
| PATCH | `/api/v1/posts/{post_id}` | 게시글 수정 |
| DELETE | `/api/v1/posts/{post_id}` | 게시글 삭제 |
| POST | `/api/v1/posts/{post_id}/participants` | 모집 참여 신청 |
| GET | `/api/v1/posts/{post_id}/participants` | 참여 신청 목록 |
| PATCH | `/api/v1/posts/{post_id}/participants/me` | 내 참여 신청 취소 |
| PATCH | `/api/v1/posts/{post_id}/participants/{participant_id}` | 참여 신청 수락·거절 |
| POST | `/api/v1/admin/notices` | 공지사항 작성 |
| PATCH | `/api/v1/admin/notices/{notice_id}` | 공지사항 수정 |
| DELETE | `/api/v1/admin/notices/{notice_id}` | 공지사항 삭제 |
| POST | `/api/v1/admin/places` | 장소 추가 |
| PATCH | `/api/v1/admin/places/{place_id}` | 장소 수정 |
| DELETE | `/api/v1/admin/places/{place_id}` | 장소 삭제 |

현재 인증 API와 `/health`는 실제 구현되어 있습니다. 그 외 비즈니스 API는 계약만 구현되어 있으며 호출 시 `501 Not Implemented`를 반환합니다.

프론트 인증 연결은 `frontend/src/features/auth/api/auth.ts`에서 담당합니다. 개발 환경의 이메일 발송 모드가 `console`이면 인증 코드는 백엔드 실행 터미널에 표시됩니다.

### 응답 형식

성공 시 단건 API는 리소스를 직접 반환하고, 목록 API는 `items`와 페이지 정보를 반환합니다.
오류는 다음 형식으로 통일합니다.

```json
{
  "code": "STATION_NOT_FOUND",
  "message": "역을 찾을 수 없습니다.",
  "details": null
}
```

## 5. DB 담당에게 전달할 사항

역·노선 정보는 데이터베이스 명세서 V1.10 구조를 기준으로 합니다.

| 테이블 | 역할 |
|---|---|
| `subway_lines` | 노선 마스터 |
| `stations` | 역명·좌표·주소 |
| `line_stations` | 노선과 역의 N:M 관계 및 노선 내 순서 |
| `train_timetables` | 역·방향·요일별 시간표 |
| `places` | 추천 장소 |
| `place_stations` | 장소와 인근 역의 연결 |

- 환승역은 `stations`에 한 건으로 두고 `line_stations`에서 여러 노선과 연결합니다.
- 좌표 정밀도는 소수점 6자리 이상 권장

### 노선·역 데이터 (2026-08-05 갱신 — V1.10 시드 반영 완료)

DB 시드(`seed_03_stations`, `seed_04_line_stations`)를 변환해 **역 100개**를
쓰고 있습니다. 연천~인천/신창 전 구간입니다.

`1호선 (인천)` / `1호선 (신창)` 두 갈래로 나눠 주신 덕분에 **지선이 깔끔하게 표현**되고,
공통 구간(연천~구로)이 양쪽에 들어 있어 환승 계산이 그대로 맞습니다.
`인천역 → 신창역`처럼 갈래가 바뀌는 경로에서 **환승 1회**가 정상 계산되는 것을 확인했습니다.

경로 탐색에 반드시 필요한 것:

| 필요한 것 | 대응 컬럼 | 비고 |
|---|---|---|
| 노선 내 역 순서 | `line_stations.station_order` | **인접 관계 계산의 핵심.** 없으면 경로 탐색 자체가 불가능 |
| 역 좌표 | `stations.latitude` / `longitude` | 경유역 반경 1km 장소 추천에 사용 |
| 환승역 | 한 역이 `line_stations`에서 여러 노선에 연결된 것 | 별도 컬럼 불필요 |

- 1호선처럼 **지선이 있는 노선**(경인선·장항선 등)은 `station_order` 하나만으로
  분기를 표현하기 어렵습니다. 처리 방식을 정해서 알려주세요.
- 공개 데이터셋(jhj0517 gist)을 검토했으나 **천안·아산 구간이 통째로 누락**되어 있고,
  파일 자체에 좌표 부정확 경고가 붙어 있어 쓰지 않기로 했습니다.
