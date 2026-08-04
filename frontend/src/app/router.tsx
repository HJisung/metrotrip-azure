import type { Station } from '../shared/types/station';
import { LineMapPage } from '../pages/LineMapPage';
import { MapPage } from '../pages/MapPage';
import { MyPage } from '../pages/MyPage';
import { RoutePage } from '../pages/RoutePage';
import { AuthPage } from '../pages/AuthPage';
import type { AppRoute } from './route';

type AppRouterProps = {
  route: AppRoute;
  selected: Station;
  onSelectStation: (station: Station) => void;
  onLogout: () => void;
};

/** URL 경로에 맞는 얇은 페이지 컴포넌트만 선택합니다. */
export function AppRouter({ route, selected, onSelectStation, onLogout }: AppRouterProps) {
  let page = <MyPage onLogout={onLogout} />;
  if (route.view === 'line') page = <LineMapPage selected={selected} />;
  if (route.view === 'map') page = <MapPage selected={selected} onSelectStation={onSelectStation} />;
  if (route.view === 'route') page = <RoutePage />;
  return <>{page}{route.authPage && <AuthPage page={route.authPage} />}</>;
}
