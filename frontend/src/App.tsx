import { useEffect, useState } from 'react';
import { getStations } from './api/stations';
import { AppRouter } from './components/AppRouter/AppRouter';
import { TopNav } from './components/TopNav/TopNav';
import { getPath, navigate, readRoute, type AppRoute } from './lib/router';
import type { Station } from './types/station';
import type { ViewId } from './types/view';

const INITIAL_STATION: Station = {
  name: '탕정역',
  lat: 36.78825,
  lng: 127.084417,
  line: '1호선',
};

type ThemeMode = 'light' | 'dark';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('metrotrip-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function App() {
  const [selected, setSelected] = useState<Station>(INITIAL_STATION);
  const [route, setRoute] = useState<AppRoute>(() => readRoute());
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (window.localStorage.getItem('metrotrip-theme')) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onSystemThemeChange);
    return () => media.removeEventListener('change', onSystemThemeChange);
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (route.view !== 'map' || !route.stationName) return;

    let cancelled = false;
    getStations().then((stations) => {
      const station = stations.find(({ name }) => name === route.stationName);
      if (station && !cancelled) setSelected(station);
    });

    return () => {
      cancelled = true;
    };
  }, [route]);

  const selectStation = (station: Station) => {
    setSelected(station);
    navigate(getPath('map', station.name));
  };

  const navigateToView = (view: ViewId) => {
    navigate(getPath(view, view === 'map' ? selected.name : undefined));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-background lg:flex-row">
      <TopNav
        current={route.view}
        onNavigate={navigateToView}
        theme={theme}
        onToggleTheme={() =>
          setTheme((current) => {
            const next = current === 'dark' ? 'light' : 'dark';
            window.localStorage.setItem('metrotrip-theme', next);
            return next;
          })
        }
      />
      <main className="relative min-h-0 flex-1 overflow-hidden lg:ml-20 lg:h-dvh">
        <AppRouter
          route={route}
          selected={selected}
          onSelectStation={selectStation}
        />
      </main>
    </div>
  );
}

export default App;
