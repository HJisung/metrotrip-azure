/**
 * 열차 시간표 접근 계층.
 *
 * DB 담당이 시간표를 올리는 중이다 (2026-08-04 기준 아직 없음).
 * 데이터가 들어오면 **이 파일 내부만** 아래 API 호출로 교체한다.
 *
 *   GET /api/v1/stations/{station_id}/timetables?line_id=&day_type=&direction=
 *
 * 그전까지는 빈 배열을 돌려주고, 화면은 `lib/routeSchedule.ts` 의
 * 근사치(역당 2분 + 환승 5분)로 시각을 계산한다.
 * (routes.ts / places.ts 와 같은 방식 — docs/BACKEND-HANDOFF.md)
 */

/** DB `train_timetables.day_type` 과 같은 값 */
export type DayType = 'WEEKDAY' | 'SATURDAY' | 'HOLIDAY';

/** DB `train_timetables.direction` 과 같은 값 */
export type Direction = 'UP' | 'DOWN';

/** 한 역의 열차 도착 시각 한 건 */
export type Timetable = {
  /** API 가 붙으면 stations.station_id 가 들어올 자리 */
  stationId: string;
  stationName: string;
  line: string;
  dayType: DayType;
  direction: Direction;
  /** "HH:MM" */
  arrivalTime: string;
};

/** 오늘 날짜에 해당하는 요일 구분을 돌려준다. 공휴일은 아직 구분하지 않는다. */
export function getTodayDayType(): DayType {
  const day = new Date().getDay();
  if (day === 0) return 'HOLIDAY';
  if (day === 6) return 'SATURDAY';
  return 'WEEKDAY';
}

/**
 * 시간표 데이터가 준비됐는지 알려준다.
 *
 * 화면에서 "예상 시각" 과 "시간표 기준 시각" 문구를 나누는 데 쓴다.
 * 데이터가 들어오면 실제 조회 결과로 바꾼다.
 */
export async function hasTimetableData(): Promise<boolean> {
  return false;
}

/** 역·노선·방향별 시간표를 가져온다. 아직 데이터가 없어 항상 빈 배열이다. */
export async function getTimetables(
  _stationName: string,
  _line: string,
  _dayType: DayType,
  _direction: Direction,
): Promise<Timetable[]> {
  return [];
}
