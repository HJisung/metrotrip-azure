import type { Station } from '../shared/types/station';
import { LineMapPage } from '../pages/LineMapPage';
import { MapPage } from '../pages/MapPage';
import { MyPage } from '../pages/MyPage';
import { RoutePage } from '../pages/RoutePage';
import type { AppRoute } from './route';

type AppRouterProps = {
  route: AppRoute;
  selected: Station;
  onSelectStation: (station: Station) => void;
};

/** URL 경로에 맞는 얇은 페이지 컴포넌트만 선택합니다. */
export function AppRouter({ route, selected, onSelectStation }: AppRouterProps) {
  if (route.view === 'line') return <LineMapPage selected={selected} />;
  if (route.view === 'map') {
    return <MapPage selected={selected} onSelectStation={onSelectStation} />;
  }
  if (route.view === 'route') return <RoutePage />;
  return <MyPage />;
}
