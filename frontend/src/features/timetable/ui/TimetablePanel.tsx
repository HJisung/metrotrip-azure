import { Icon } from '../../../shared/ui/Icon';
import { Button } from '../../../shared/ui/Button';
import { DIRECTION_LABELS } from '../data/timetables';
import type { TimetablePanelProps } from '../types';

export function TimetablePanel({
  station,
  onClose,
  direction,
  onDirectionChange,
  rows,
  dialogRef,
  closeButtonRef,
}: TimetablePanelProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-[2px] sm:p-md lg:items-stretch lg:justify-end lg:p-0"
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        className="flex max-h-[min(88dvh,42rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-outline-variant bg-surface-bright shadow-2xl sm:max-w-[min(100%,30rem)] lg:h-full lg:max-h-none lg:w-[clamp(22rem,26vw,26rem)] lg:max-w-none lg:rounded-none lg:border-y-0 lg:border-r-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timetable-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-md border-b border-outline-variant p-md">
          <div>
            <p className="text-label-caps text-primary">예시 시간표</p>
            <h2 id="timetable-title" className="mt-xs text-headline-sm text-on-surface">
              {station.name}
            </h2>
            <p className="text-body-md text-on-surface-variant">{station.line}</p>
          </div>
          <Button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="시간표 닫기"
            variant="ghost"
            size="icon"
          >
            <Icon name="close" />
          </Button>
        </header>

        <div className="border-b border-outline-variant p-sm">
          <div className="grid grid-cols-2 gap-xs rounded-xl bg-surface-container-low p-xs">
            {(Object.keys(DIRECTION_LABELS) as Array<'up' | 'down'>).map((value) => (
              <Button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => onDirectionChange(value)}
                variant={direction === value ? 'default' : 'ghost'}
                className="w-full"
              >
                {DIRECTION_LABELS[value]}
              </Button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-sm p-lg text-center">
            <Icon name="schedule" className="text-[30px] text-on-surface-variant" />
            <p className="text-body-lg font-bold text-on-surface">시간표 데이터가 없습니다.</p>
            <p className="text-body-md text-on-surface-variant">
              선택한 방향의 운행 정보는 아직 준비하지 않았습니다.
            </p>
          </div>
        ) : (
          <ul className="min-h-0 space-y-xs overflow-y-auto p-sm">
            {rows.map((row) => (
              <li
                key={`${direction}-${row.hour}`}
                className="flex items-center gap-md rounded-xl bg-surface-container-low px-md py-sm transition hover:bg-surface-container"
              >
                <span className="w-10 shrink-0 text-mono-table text-on-surface-variant">
                  {row.hour}시
                </span>
                <span className="flex-1 text-mono-table text-on-surface">{row.minutes}</span>
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
