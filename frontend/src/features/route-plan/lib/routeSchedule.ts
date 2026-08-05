import type { DayType, Timetable } from '../api/timetables';
import type { RouteOption } from '../types';
import { MINUTES_PER_TRANSFER, type LineOrder } from './findRoutes';
import { resolveSchedule } from './resolveSchedule';
import type { TimetableStats } from './timetableStats';

/**
 * 경로의 역별 도착 시각 계산 (docs/SPEC.md 2-2).
 *
 * 지금은 열차 시간표가 없어 `역당 2분 + 환승 5분` 근사치를 출발 시각에 더한다.
 * 시간표 데이터가 들어오면 `api/timetables.ts` 를 통해 실제 시각으로 바꾼다.
 */

/** "HH:MM" 을 자정 기준 분으로 바꾼다. 형식이 어긋나면 null. */
export function toMinutes(clock: string): number | null {
  const matched = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!matched) return null;

  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/** 자정 기준 분을 "HH:MM" 으로 바꾼다. 24시를 넘으면 다음날로 표시한다. */
export function toClock(minutes: number): { text: string; nextDay: boolean } {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);

  return {
    text: `${String(hours).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`,
    nextDay: minutes >= 1440,
  };
}

/** 지금 시각을 "HH:MM" 으로 반환한다. 출발 시각 기본값에 쓴다. */
export function currentClock(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * 경유역마다 출발 시각으로부터 몇 분 뒤에 도착하는지 추정한다.
 *
 * 시간표가 없는 구간에서만 쓴다. 역간 소요와 대기 시간은
 * `computeTimetableStats` 가 **실제 시간표에서 뽑은 값**이다.
 *
 * 첫 값이 0 이 아니라 대기 시간인 것에 주의. 역에 도착하자마자 열차를 타는 게
 * 아니라 다음 열차를 기다려야 한다. 이걸 빼먹으면 도착 시각이 실제보다
 * 30~40분씩 빨라진다.
 */
export function getArrivalOffsets(
  option: RouteOption,
  stats: TimetableStats,
): number[] {
  // 구간이 바뀌는 지점 = 환승역. 여기서 환승 시간을 더한다.
  const transferNames = new Set(
    option.legs.slice(1).map((leg) => leg.stations[0].name),
  );

  // 처음 타는 열차도 기다려야 한다.
  let minutes = stats.averageWait;

  return option.stations.map((station, index) => {
    if (index > 0) minutes += stats.minutesPerHop;
    // 환승은 갈아타는 도보 시간에 다음 열차 대기가 더해진다.
    if (transferNames.has(station.name)) {
      minutes += MINUTES_PER_TRANSFER + stats.averageWait;
    }
    return Math.round(minutes);
  });
}

/** 경로의 역별 도착 시각. 시간표로 계산했는지 여부를 함께 담는다. */
export type RouteSchedule = {
  /** `option.stations` 와 같은 순서의 도착 시각(자정 기준 분) */
  arrivals: number[];
  /** 출발부터 도착까지 걸리는 시간(분) */
  totalMinutes: number;
  /** true 면 실제 열차를 따라간 값, false 면 시간표에서 뽑은 평균으로 추정한 값 */
  fromTimetable: boolean;
  /** 시간표에 그 역이 없어 앞뒤에서 추정한 자리 */
  interpolated: boolean[];
  /** 구간별로 타는 열차 번호. 근사치일 때는 빈 배열. */
  trainNos: string[];
};

/**
 * 도착 시각을 계산한다.
 *
 * 시간표로 계산할 수 있으면 그 값을 쓰고, 안 되면 근사치로 되돌아간다.
 * 되돌아가는 경우는 주말·공휴일(시드에 평일만 있음)이나
 * 시간표에 없는 구간이다.
 */
export function buildSchedule(
  option: RouteOption,
  departureMinutes: number,
  timetables: Timetable[],
  dayType: DayType,
  lineOrder: LineOrder,
  stats: TimetableStats,
): RouteSchedule {
  const resolved = resolveSchedule(
    option,
    departureMinutes,
    timetables,
    dayType,
    lineOrder,
  );

  if (resolved) {
    return { ...resolved, fromTimetable: true };
  }

  const offsets = getArrivalOffsets(option, stats);
  return {
    arrivals: offsets.map((offset) => departureMinutes + offset),
    totalMinutes: offsets.at(-1) ?? 0,
    fromTimetable: false,
    interpolated: offsets.map(() => false),
    trainNos: [],
  };
}
