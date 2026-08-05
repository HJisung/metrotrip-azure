import { MINUTES_PER_HOP, MINUTES_PER_TRANSFER } from './findRoutes';
import type { RouteOption } from '../types';

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
 * 경유역마다 출발 시각으로부터 몇 분 뒤에 도착하는지 계산한다.
 *
 * `option.stations` 와 같은 순서·길이로 돌아온다.
 * 마지막 값은 `option.estimatedMinutes` 와 같다.
 */
export function getArrivalOffsets(option: RouteOption): number[] {
  // 구간이 바뀌는 지점 = 환승역. 여기서 환승 시간을 더한다.
  const transferNames = new Set(
    option.legs.slice(1).map((leg) => leg.stations[0].name),
  );

  let minutes = 0;
  return option.stations.map((station, index) => {
    if (index > 0) minutes += MINUTES_PER_HOP;
    if (transferNames.has(station.name)) minutes += MINUTES_PER_TRANSFER;
    return minutes;
  });
}
