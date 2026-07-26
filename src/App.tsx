import { useState } from 'react';
import { MapView } from './components/MapView/MapView';
import { StationList } from './components/StationList/StationList';
import { Sidebar } from './components/Sidebar/Sidebar';
import { NAV_ITEMS } from './components/Sidebar/navItems';
import { LineMapView } from './components/LineMap/LineMapView';
import { RoutePlanView } from './components/RoutePlan/RoutePlanView';
import { TimetableView } from './components/Timetable/TimetableView';
import { Icon } from './components/Icon';
import type { Station } from './types/station';
import type { ViewId } from './types/view';

/** 초기 지도 중심: 탕정역 (docs/SPEC.md 6장) */
const INITIAL_STATION: Station = {
  name: '탕정역',
  lat: 36.78825,
  lng: 127.084417,
  line: '1호선',
};

function App() {
  const [selected, setSelected] = useState<Station>(INITIAL_STATION);
  const [view, setView] = useState<ViewId>('map');

  /** 역을 고르면 어느 화면에서 골랐든 지도로 돌아온다 */
  const selectStation = (station: Station) => {
    setSelected(station);
    setView('map');
  };

  return (
    <div className="flex h-dvh bg-background text-on-background">
      <Sidebar current={view} onNavigate={setView} />

      <main className="relative flex-1 overflow-hidden">
        {/* 상단 바 (모바일 전용) — 사이드바가 숨겨지므로 여기서 화면을 전환한다 */}
        <header className="absolute left-0 top-0 z-50 flex h-14 w-full items-center gap-sm border-b border-outline-variant bg-surface/80 px-md backdrop-blur-md lg:hidden">
          <Icon name="subway" className="text-primary" />
          <span className="text-headline-sm font-heading font-bold text-primary">
            MetroTrip
          </span>
          <nav className="ml-auto flex gap-xs">
            {NAV_ITEMS.filter((item) => item.view).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setView(item.view!)}
                aria-label={item.label}
                aria-current={item.view === view ? 'page' : undefined}
                className={
                  item.view === view
                    ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container'
                    : 'flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant'
                }
              >
                <Icon name={item.icon} className="text-[20px]" />
              </button>
            ))}
          </nav>
        </header>

        {/*
          지도는 항상 붙여 둔다.
          숨겼다 되살리면 컨테이너 크기가 0이 되는 시점이 생겨 지도가 깨지므로,
          다른 화면은 지도 위에 덮는 방식으로 처리한다.
        */}
        <div className="absolute inset-0">
          <MapView lat={selected.lat} lng={selected.lng} />
        </div>

        {view === 'map' && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full flex-col p-md pt-16 sm:w-72 lg:pt-md">
            <div className="pointer-events-auto flex min-h-0 flex-1 flex-col">
              <StationList selected={selected} onSelect={selectStation} />
            </div>
          </div>
        )}

        {/* 지도의 확대/축소 컨트롤이 z-30이라, 덮는 화면은 그보다 위(z-40)에 둔다 */}
        {view !== 'map' && (
          <div className="absolute inset-0 z-40 bg-background">
            {view === 'line' && (
              <LineMapView selected={selected} onSelect={selectStation} />
            )}
            {view === 'route' && <RoutePlanView />}
            {view === 'timetable' && <TimetableView />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
