# 다른 PC에서 이어서 작업하기

> 데스크톱에서 작업하던 내용을 **노트북 등 다른 PC에서 그대로 이어받기 위한 문서**입니다.
> 이 문서만 읽으면 지금까지의 맥락 없이도 이어서 작업할 수 있습니다.
>
> 마지막 갱신: 2026-07-22 / 작업 브랜치: `feat/fe-project-setup`

---

## 1. 지금 상태 요약

프론트엔드 MVP의 **1~3단계까지 완료**되어 있고, 브라우저에서 지도가 뜨는 것까지 확인했습니다.

| SPEC 단계 | 내용 | 상태 |
|---|---|---|
| 1 | Vite + React + TypeScript 세팅 | ✅ 완료 |
| 2 | 카카오맵 SDK 로드 + 지도 표시 | ✅ 완료 (탕정역 기준) |
| 3 | 역 데이터 + 역 목록 UI | ✅ 데이터만 완료 (UI는 4단계) |
| 4 | 역 목록 UI | ⬜ **다음 작업** |
| 5 | 역 클릭 → 지도 중심 이동 | ⬜ |
| 6 | 반경 1km 장소 검색 → 마커 | ⬜ |
| 7 | 마커 클릭 → 인포윈도우 | ⬜ |
| 8 | 반응형 정리 + README | ⬜ |

### 만들어져 있는 것

```
src/
├─ api/stations.ts          역 데이터 접근 계층 (async, 나중에 fetch로 교체)
├─ data/stations.json       1호선 천안·아산 11개 역 (좌표 검증 완료)
├─ types/station.ts         Station 타입
├─ types/kakao.d.ts         카카오맵 SDK 타입 선언
├─ components/MapView/      지도 컴포넌트
└─ App.tsx                  탕정역 기준 초기 렌더
```

### 아직 없는 것

- 역 목록/검색 UI (`src/components/StationList/`)
- 장소 검색 (`src/api/places.ts`)
- 마커, 인포윈도우
- 배포

---

## 2. 노트북에서 최초 1회 세팅

### ① 저장소 받기

이미 클론되어 있으면 `git pull` 만 하면 됩니다. 처음이면:

```bash
git clone https://github.com/lellon0403/MetroTrip.git
```

```bash
cd MetroTrip
```

### ② 작업 브랜치로 이동

**`main`에는 앱 코드가 없습니다.** 반드시 브랜치로 이동하세요.

```bash
git fetch origin
```

```bash
git checkout feat/fe-project-setup
```

```bash
git pull
```

### ③ 패키지 설치

```bash
npm install
```

### ④ `.env` 만들기 ← 이걸 빼먹으면 지도가 안 뜹니다

`.env`는 GitHub에 올라가지 않습니다. **노트북에서 직접 만들어야 합니다.**

```bash
cp .env.example .env
```

그다음 `.env` 파일을 열어 값을 채웁니다.

```
VITE_KAKAO_MAP_KEY=여기에_JavaScript_키
```

키는 [카카오 개발자 콘솔](https://developers.kakao.com/) → 내 애플리케이션 → **위치확인앱**(ID 1402576) → 앱 키 → **JavaScript 키**에서 다시 복사할 수 있습니다.
**REST API 키가 아닙니다.** 가운데 있는 JavaScript 키입니다.

### ⑤ 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 탕정역 일대 지도가 보이면 정상입니다.

---

## 3. Claude Code로 이어서 작업하기

노트북에서 Claude Code를 열고 **아래를 그대로 복사해서** 첫 메시지로 보내세요.

```
docs/HANDOFF.md 를 읽고 현재 상태를 파악해줘.
그 다음 git fetch 해서 브랜치가 최신인지 확인하고,
SPEC 4단계(역 목록 UI)부터 이어서 작업하자.
```

저장소 루트의 `CLAUDE.md`를 Claude Code가 자동으로 읽기 때문에,
Git 규칙·검증 규칙·한국어 응답 같은 팀 규칙은 **노트북에서도 동일하게 적용**됩니다.
따로 설명할 필요가 없습니다.

> 세션이 바뀌면 이전 대화는 사라집니다. 파일과 커밋만 남습니다.
> 그래서 이 문서와 `docs/WORKLOG.md`가 유일한 인수인계 수단입니다.
> **작업이 끝나면 두 문서를 갱신**하세요.

---

## 4. 반드시 알아야 할 함정

여기서 실제로 시간을 많이 썼습니다. 같은 함정을 다시 밟지 마세요.

### ① 카카오는 접속 주소가 정확히 일치해야 한다

카카오 콘솔에 등록된 주소와 **완전히 같아야만** 지도가 뜹니다. 실제 테스트 결과:

| 접속 주소 | 결과 |
|---|---|
| `http://localhost:5173` | ✅ 200 |
| `http://127.0.0.1:5173` | ❌ 401 |
| `http://localhost:5174` | ❌ 401 |
| `http://192.168.x.x:5173` (LAN) | ❌ 401 |

- **반드시 `localhost`로 접속**하세요. `127.0.0.1`은 안 됩니다
- 포트는 `vite.config.ts`에서 5173으로 고정해 뒀습니다 (`strictPort`).
  5173이 사용 중이면 서버가 **에러를 내고 멈춥니다.** 이건 의도한 동작입니다 —
  조용히 다른 포트로 옮겨가면 원인을 못 찾기 때문입니다.
  이때는 5173을 쓰는 다른 프로그램을 끄세요

### ② 카카오맵 서비스가 켜져 있어야 한다

`제품 설정 > 카카오맵` → 활성화 ON. 꺼져 있으면 SDK가 403을 반환합니다.

```
{"errorType":"NotAuthorizedError",
 "message":"App(위치확인앱) disabled OPEN_MAP_AND_LOCAL service."}
```

### ③ `유료 API > 일반`의 카카오맵은 `사용 안 함`으로 둘 것

이건 **쿼터 초과 시 과금하며 계속 쓸지**를 정하는 설정입니다.
`사용 안 함`으로 두면 초과 시 요금이 청구되는 대신 호출이 막힙니다. 학생 프로젝트에는 이게 안전합니다.

### ④ 팀원이 각자 카카오 앱을 만들면 안 된다

2026-07-21 정책 변경으로, 무료 쿼터는 **계정당 첫 번째로 활성화한 앱에만** 제공됩니다.
두 번째 앱부터는 비즈월렛(결제수단) 연결이 필요합니다.
**지금 쓰는 키 하나를 팀에서 공유**하세요.

무료 쿼터: 지도 SDK 30만건/일, 장소 검색 10만건/일 — 데모에는 충분합니다.

### ⑤ 지도 컨테이너 높이가 0이면 지도가 안 보인다

에러도 안 나고 그냥 안 보여서 헷갈립니다. `.map-view`는 부모 높이를 채우도록 되어 있고,
부모(`.app-main`)에 `min-height: 0`이 필요합니다. 레이아웃을 고칠 때 이 부분을 깨뜨리지 마세요.

---

## 5. 배포 (아직 안 됨)

Vercel 로그인에서 막혀 있는 상태입니다. 노트북에는 로그인 세션이 남아 있을 테니 **노트북에서 진행**하세요.

### 순서

1. **PR 병합** — 앱 코드가 `main`에 있어야 배포됩니다
   https://github.com/lellon0403/MetroTrip/pull/new/feat/fe-project-setup
2. [vercel.com](https://vercel.com) → Add New… → Project → `MetroTrip` Import
3. Framework Preset은 **Vite**로 자동 인식됨. Build 설정은 건드리지 말 것
4. **Environment Variables**에 추가 ← 빼먹으면 지도가 안 뜸

   | Name | Value |
   |---|---|
   | `VITE_KAKAO_MAP_KEY` | JavaScript 키 |

5. Deploy
6. 배포 주소(`https://xxx.vercel.app`)를 **카카오 콘솔 → JavaScript SDK 도메인에 추가**
   - 기존 `http://localhost:5173`은 지우지 말고 **같이** 둘 것
   - `https` 입니다

### 주의

Vercel은 커밋마다 미리보기 URL(`...-git-xxx.vercel.app`)을 따로 만듭니다.
그 주소는 카카오에 등록되어 있지 않아 지도가 안 뜹니다.
**팀원에게는 프로덕션 URL을 공유**하세요.

### Vercel 로그인이 계속 막히면

GitHub Pages로도 배포할 수 있습니다. 새로 로그인할 계정이 없다는 게 장점입니다.
필요하면 Claude Code에게 "GitHub Pages 배포 설정 만들어줘"라고 요청하세요.
(GitHub Actions 워크플로 + `vite.config.ts`의 `base` 설정 + 저장소 Secret 등록이 필요합니다)

---

## 6. 팀원이 로컬에서 실행해보고 싶다고 할 때

배포 전이라면 위 **2번 세팅 절차**를 그대로 전달하면 됩니다.
`.env`의 키는 GitHub에 없으므로 **Discord DM 등으로 따로** 전달해야 합니다.
(채팅방이나 스크린샷으로 키를 공유하지 마세요)

카카오에 `http://localhost:5173`이 등록되어 있고, 팀원 PC에서도 주소가 같으므로
**추가 등록 없이 그대로 작동**합니다.
