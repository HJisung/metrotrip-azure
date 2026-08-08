# 프론트엔드 API 연동 현황

최종 갱신: 2026-08-08

## 완료된 연동

- 인증 세션: 401 응답 시 Refresh Token으로 한 번만 갱신하고 원래 요청을 재시도한다. 로그아웃은 `POST /api/v1/auth/logout` 호출 뒤 로컬 Access/Refresh Token을 모두 정리한다.
- 회원 관리: 마이페이지에서 `GET/PATCH /api/v1/users/me`, 목적별 재인증, `PATCH /users/me/password`, `DELETE /users/me`를 사용한다. 재인증 토큰은 화면 메모리에만 두고 `X-Reauthentication-Token` 헤더로 전송한다.
- 즐겨찾기 역: `GET/POST/DELETE /api/v1/users/me/favorites`를 사용한다. 정적 역 데이터에는 DB `station_id`를 포함해 추가 요청에 사용한다.
- 후기: 목록·상세·작성·수정·삭제·미디어 업로드와 내가 작성한 후기 조회가 연동되어 있다. 후기 목록은 `tag` 쿼리로 태그 필터를 지원한다.
- 모집 게시판: `/api/v1/posts`의 목록·상세·작성·수정·삭제와 참여 신청·취소, 작성자의 신청자 승인·거절을 지원한다. 마이페이지에는 내가 작성한 모집글과 신청/확정 모집글을 표시한다.

## 아직 프론트에 연결하지 않는 API

`/lines`, `/stations`, 시간표·주변 장소·여행 계획·공지사항 API는 현재 백엔드가 `501 Not Implemented`를 반환한다. 해당 화면은 정적 데이터 또는 기존 구현을 유지하며, API 구현 후 이 문서와 `docs/BACKEND-HANDOFF.md`를 함께 갱신한다.

## 검증 기록

- 프론트: `npm.cmd run lint`, `npm.cmd run build` 통과
- 백엔드: `backend/.venv/Scripts/python.exe -m pytest` — 55개 통과
- 브라우저: 로컬 계정으로 프로필 수정, 즐겨찾기 추가/삭제, 모집글 CRUD, 참여 신청/취소, 작성자 승인, 마이페이지 목록, 비밀번호 변경 후 재로그인, 회원 탈퇴를 확인했다. 검증용 게시글과 계정은 모두 삭제했다.
