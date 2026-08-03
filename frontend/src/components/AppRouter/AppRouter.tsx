import type { AppRoute } from '../../lib/router';
import type { Station } from '../../types/station';
import { LineMapView } from '../LineMap/LineMapView';
import { MapScreen } from '../MapScreen/MapScreen';
import { MyPageView } from '../MyPage/MyPageView';
import { RoutePlanView } from '../RoutePlan/RoutePlanView';

type AppRouterProps = {
  route: AppRoute;
  selected: Station;
  onSelectStation: (station: Station) => void;
};

/** URL에 해당하는 화면만 렌더링하고 화면별 책임을 분리한다. */
export function AppRouter({
  route,
  selected,
  onSelectStation,
}: AppRouterProps) {
  if (route.view === 'line') {
    return <LineMapView selected={selected} />;
  }

  if (route.view === 'map') {
    return <MapScreen selected={selected} onSelectStation={onSelectStation} />;
  }

  if (route.view === 'route') return <RoutePlanView />;
  return <MyPageView />;
}
