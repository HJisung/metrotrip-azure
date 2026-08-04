import { useEffect, useState } from 'react';
import { getStations } from '../shared/lib/stations';
import type { Station } from '../shared/types/station';
import { AppRouter } from './router';
import { getAuthPath, getPath, navigate, readRoute, type AppRoute } from './route';
import { TopNav } from './ui/TopNav';
import type { ViewId } from './view';
import { cn } from '../shared/lib/cn';

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
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
      <main className={cn(
        'relative min-h-0 min-w-0 flex-1 pb-16 lg:ml-20 lg:h-dvh lg:pb-0',
        route.authPage && route.authPage !== 'login' ? 'overflow-y-auto' : 'overflow-hidden',
      )}>
        <AppRouter
          route={route}
          selected={selected}
          onSelectStation={selectStation}
          onLogout={() => {
            window.localStorage.removeItem('metrotrip-access-token');
            window.localStorage.removeItem('metrotrip-refresh-token');
            navigate(getAuthPath('login'));
          }}
        />
      </main>
    </div>
  );
}

export default App;
