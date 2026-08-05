import { Card } from '../../../shared/ui/Card';
import { Icon } from '../../../shared/ui/Icon';
import { Input } from '../../../shared/ui/Input';
import { toClock, toMinutes } from '../lib/routeSchedule';

/**
 * 출발 시각 입력과 도착 예정 시각 (docs/SPEC.md 2-2).
 *
 * 시간표 데이터가 없는 동안에는 근사치로 계산한 값이므로
 * "예상"이라는 표기를 반드시 남긴다.
 */

type RouteDepartureTimeProps = {
  value: string;
  onChange: (value: string) => void;
  /** 총 소요 시간(분). 경로가 없으면 null. */
  totalMinutes: number | null;
  /** 열차 시간표 데이터가 준비됐는지 */
  hasTimetable: boolean;
};

export function RouteDepartureTime({
  value,
  onChange,
  totalMinutes,
  hasTimetable,
}: RouteDepartureTimeProps) {
  const departure = toMinutes(value);
  const arrival =
    departure !== null && totalMinutes !== null
      ? toClock(departure + totalMinutes)
      : null;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-md p-md">
      <label className="flex items-center gap-sm" htmlFor="route-departure">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-primary">
          <Icon name="schedule" className="text-[20px]" />
        </span>
        <span>
          <span className="block text-label-caps text-on-surface-variant">
            출발 시각
          </span>
          <Input
            id="route-departure"
            type="time"
            className="mt-xs h-9 w-[9rem] px-sm"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      </label>

      {arrival && (
        <div className="text-right">
          <span className="block text-label-caps text-on-surface-variant">
            {hasTimetable ? '도착' : '도착 예상'}
          </span>
          <span className="mt-xs block text-headline-sm font-heading text-on-surface">
            {arrival.text}
            {arrival.nextDay && (
              <span className="ml-xs text-body-md text-on-surface-variant">
                다음날
              </span>
            )}
          </span>
        </div>
      )}
    </Card>
  );
}
