import { useState } from 'react';
import { MapView } from './components/MapView/MapView';
import { StationList } from './components/StationList/StationList';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Icon } from './components/Icon';
import type { Station } from './types/station';

/** 초기 지도 중심: 탕정역 (docs/SPEC.md 6장) */
const INITIAL_STATION: Station = {
  name: '탕정역',
  lat: 36.78825,
  lng: 127.084417,
  line: '1호선',
};

function App() {
  const [selected, setSelected] = useState<Station>(INITIAL_STATION);

  return (
    <div className="flex h-dvh bg-background text-on-background">
      <Sidebar />

      <main className="relative flex-1 overflow-hidden">
        {/* 상단 바 (모바일: 브랜드 표시 / 데스크톱: 선택 역 표시) */}
        <header className="absolute left-0 top-0 z-20 flex h-14 w-full items-center gap-sm border-b border-outline-variant bg-surface/80 px-md backdrop-blur-md lg:hidden">
          <Icon name="subway" className="text-primary" />
          <span className="text-headline-sm font-heading font-bold text-primary">
            MetroTrip
          </span>
        </header>

        {/* 지도 (전체 채움) */}
        <div className="absolute inset-0">
          <MapView lat={selected.lat} lng={selected.lng} />
        </div>

        {/* 좌측 플로팅 패널: 검색 + 역 목록 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full flex-col p-md pt-16 sm:w-96 lg:pt-md">
          <div className="pointer-events-auto flex min-h-0 flex-1 flex-col">
            <StationList selected={selected} onSelect={setSelected} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
