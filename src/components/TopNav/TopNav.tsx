import { Icon } from '../Icon';
import type { ViewId } from '../../types/view';
import { NAV_ITEMS } from './navItems';

type TopNavProps = {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
};

/**
 * 상단 가로 내비게이션.
 *
 * 원래 좌측 사이드바였는데, 지도 화면을 넓게 쓰려고 상단으로 옮겼다.
 * 좁은 화면에서는 글자를 감추고 아이콘만 남긴다.
 */
export function TopNav({ current, onNavigate }: TopNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-md border-b border-outline-variant bg-surface px-md">
      <div className="flex shrink-0 items-center gap-xs">
        <Icon name="subway" className="text-primary" />
        <span className="text-headline-sm font-heading font-extrabold text-primary">
          MetroTrip
        </span>
      </div>

      <nav className="flex min-w-0 flex-1 items-center gap-xs">
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.view === current;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-label={item.label}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'flex shrink-0 items-center gap-xs rounded-xl bg-primary-container px-sm py-xs font-bold text-on-primary-container sm:px-md'
                  : 'flex shrink-0 items-center gap-xs rounded-xl px-sm py-xs text-on-surface-variant transition-colors hover:bg-surface-container-low sm:px-md'
              }
            >
              <Icon name={item.icon} className="text-[20px]" />
              <span className="hidden text-body-md sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <p className="hidden shrink-0 text-label-caps uppercase tracking-widest text-on-surface-variant/60 xl:block">
        발표용 MVP · 1호선 천안·아산 구간
      </p>
    </header>
  );
}
