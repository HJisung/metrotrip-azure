import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import type { Station } from '../../types/station';

type Direction = 'up' | 'down';

type TimetableRow = {
  hour: string;
  minutes: string;
  tag?: string;
};

type TimetablePanelProps = {
  station: Station;
  onClose: () => void;
};

const TIMETABLES: Record<string, Record<Direction, TimetableRow[]>> = {
  탕정역: {
    up: [
      { hour: '06', minutes: '03  17  31  45' },
      { hour: '07', minutes: '02  14  26  38  50' },
      { hour: '08', minutes: '04  18  32  46', tag: '혼잡' },
      { hour: '09', minutes: '03  21  39' },
      { hour: '23', minutes: '08  36', tag: '막차' },
    ],
    down: [
      { hour: '06', minutes: '08  22  36  50' },
      { hour: '07', minutes: '04  16  28  40  52' },
      { hour: '08', minutes: '10  24  38  52' },
      { hour: '22', minutes: '12  30  48', tag: '막차' },
    ],
  },
};

const DIRECTION_LABELS: Record<Direction, string> = {
  up: '상행',
  down: '하행',
};

/** 지도 화면 위에서 열리는 반응형 시간표 패널 */
export function TimetablePanel({ station, onClose }: TimetablePanelProps) {
  return <TimetableContent station={station} onClose={onClose} />;
}

function TimetableContent({ station, onClose }: TimetablePanelProps) {
  const [direction, setDirection] = useState<Direction>('up');
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const rows = TIMETABLES[station.name]?.[direction] ?? [];

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/25 p-sm sm:p-md lg:items-stretch lg:justify-end lg:p-0"
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        className="flex max-h-[82dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl lg:h-full lg:max-h-none lg:w-[390px] lg:max-w-none lg:rounded-none lg:border-y-0 lg:border-r-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timetable-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-md border-b border-outline-variant p-md">
          <div>
            <p className="text-label-caps text-primary">열차 시간표</p>
            <h2 id="timetable-title" className="mt-xs text-headline-sm text-on-surface">
              {station.name}
            </h2>
            <p className="text-body-md text-on-surface-variant">{station.line}</p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="시간표 닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="border-b border-outline-variant p-sm">
          <div className="grid grid-cols-2 gap-xs rounded-lg bg-surface-container p-xs">
            {(Object.keys(DIRECTION_LABELS) as Direction[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => setDirection(value)}
                className={`rounded-md px-md py-sm text-body-md font-bold transition-colors ${
                  direction === value
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {DIRECTION_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-sm p-lg text-center">
            <Icon name="schedule" className="text-[30px] text-on-surface-variant" />
            <p className="text-body-lg font-bold text-on-surface">
              시간표 데이터가 없습니다.
            </p>
            <p className="text-body-md text-on-surface-variant">
              선택한 방향의 운행 정보를 아직 준비하지 않았습니다.
            </p>
          </div>
        ) : (
          <ul className="min-h-0 overflow-y-auto">
            {rows.map((row) => (
              <li
                key={`${direction}-${row.hour}`}
                className="flex items-center gap-md border-b border-outline-variant px-md py-sm last:border-b-0"
              >
                <span className="w-10 shrink-0 text-mono-table text-on-surface-variant">
                  {row.hour}시
                </span>
                <span className="flex-1 text-mono-table text-on-surface">
                  {row.minutes}
                </span>
                {row.tag && (
                  <span className="rounded-md bg-tertiary-container/15 px-sm py-xs text-label-caps text-tertiary">
                    {row.tag}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="shrink-0 border-t border-outline-variant px-md py-sm text-body-md text-on-surface-variant">
          표시된 시간은 예시 데이터입니다.
        </p>
      </section>
    </div>
  );
}
