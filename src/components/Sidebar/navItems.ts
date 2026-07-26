import type { ViewId } from '../../types/view';

export type NavItem = {
  icon: string;
  label: string;
  /** 없으면 아직 화면을 만들지 않은 메뉴 (비활성 처리) */
  view?: ViewId;
  /** 화면만 있고 실제 동작은 없는 발표용 프리뷰 (docs/SPEC.md 2-1) */
  preview?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { icon: 'map', label: '지도', view: 'map' },
  { icon: 'directions_subway', label: '노선', view: 'line', preview: true },
  { icon: 'route', label: '경로', view: 'route', preview: true },
  { icon: 'schedule', label: '시간표', view: 'timetable', preview: true },
  { icon: 'person', label: '마이페이지' },
];
