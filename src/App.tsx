import { MapView } from './components/MapView/MapView';
import './App.css';

/** 초기 지도 중심: 탕정역 (docs/SPEC.md 6장) */
const INITIAL_STATION = { name: '탕정역', lat: 36.78825, lng: 127.084417 };

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>MetroTrip</h1>
        <p>지하철 역 주변 1km의 가볼 만한 곳</p>
      </header>
      <main className="app-main">
        <MapView lat={INITIAL_STATION.lat} lng={INITIAL_STATION.lng} />
      </main>
    </div>
  );
}

export default App;
