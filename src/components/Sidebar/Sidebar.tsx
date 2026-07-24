import { Icon } from '../Icon';

/**
 * 좌측 사이드 내비게이션 (데스크톱 lg 이상).
 *
 * 지도(Map)만 실제 기능이고, 나머지(노선/경로/시간표/마이페이지)는
 * MVP 범위 밖이라 비활성 상태로 둔다. 발표에서 "다음 단계"를 보여주는 역할.
 */
type NavItem = {
  icon: string;
  label: string;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'map', label: '지도', active: true },
  { icon: 'directions_subway', label: '노선' },
  { icon: 'route', label: '경로' },
  { icon: 'schedule', label: '시간표' },
  { icon: 'person', label: '마이페이지' },
];

export function Sidebar() {
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
        {NAV_ITEMS.map((item) =>
          item.active ? (
            <span
              key={item.label}
              className="flex items-center gap-sm rounded-xl bg-primary-container px-md py-sm font-bold text-on-primary-container"
            >
              <Icon name={item.icon} />
              <span className="text-body-lg">{item.label}</span>
            </span>
          ) : (
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
          ),
        )}
      </nav>

      <p className="mt-auto px-sm text-label-caps leading-relaxed text-on-surface-variant/60">
        발표용 MVP · 1호선 천안·아산 구간
      </p>
    </aside>
  );
}
