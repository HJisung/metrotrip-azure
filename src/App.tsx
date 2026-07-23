import { useState } from 'react';
import { MapView } from './components/MapView/MapView';
import { StationList } from './components/StationList/StationList';
import type { Station } from './types/station';
import './App.css';

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
    <div className="app">
      <header className="app-header">
        <h1>MetroTrip</h1>
        <p>지하철 역 주변 1km의 가볼 만한 곳</p>
      </header>
      <main className="app-main">
        <StationList selected={selected} onSelect={setSelected} />
        <MapView lat={selected.lat} lng={selected.lng} />
      </main>
    </div>
  );
}

export default App;
