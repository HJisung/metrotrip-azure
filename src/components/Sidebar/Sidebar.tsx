import { Icon } from '../Icon';
import type { ViewId } from '../../types/view';
import { NAV_ITEMS } from './navItems';

type SidebarProps = {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
};

/**
 * 좌측 사이드 내비게이션 (데스크톱 lg 이상).
 *
 * 지도만 실제 기능이고, 노선/경로/시간표는 발표용 프리뷰 화면이다 (docs/SPEC.md 2-1).
 * 마이페이지는 아직 화면 자체가 없어 비활성으로 둔다.
 */
export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden w-64 flex-col border-r border-outline-variant bg-surface p-md lg:flex">
      <div className="mb-lg px-sm pt-sm">
        <h2 className="text-headline-sm font-heading font-extrabold text-primary">
          MetroTrip
        </h2>
        <p className="text-label-caps uppercase tracking-widest text-on-surface-variant">
          지하철 여행 가이드
        </p>
      </div>

      <nav className="flex-1 space-y-xs">
        {NAV_ITEMS.map((item) => {
          if (!item.view) {
            return (
              <span
                key={item.label}
                title="발표 이후 지원 예정"
                className="flex cursor-not-allowed items-center gap-sm rounded-xl px-md py-sm text-on-surface-variant/40"
              >
                <Icon name={item.icon} />
                <span className="text-body-lg">{item.label}</span>
                <span className="ml-auto text-label-caps uppercase text-on-surface-variant/40">
                  준비중
                </span>
              </span>
            );
          }

          const isCurrent = item.view === current;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.view!)}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'flex w-full items-center gap-sm rounded-xl bg-primary-container px-md py-sm font-bold text-on-primary-container'
                  : 'flex w-full items-center gap-sm rounded-xl px-md py-sm text-on-surface transition-colors hover:bg-surface-container-low'
              }
            >
              <Icon name={item.icon} />
              <span className="text-body-lg">{item.label}</span>
              {item.preview && (
                <span
                  className={
                    isCurrent
                      ? 'ml-auto text-label-caps uppercase text-on-primary-container/70'
                      : 'ml-auto text-label-caps uppercase text-on-surface-variant/60'
                  }
                >
                  미리보기
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <p className="mt-auto px-sm text-label-caps leading-relaxed text-on-surface-variant/60">
        발표용 MVP · 1호선 천안·아산 구간
      </p>
    </aside>
  );
}
