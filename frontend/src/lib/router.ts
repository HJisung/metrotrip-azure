import type { ViewId } from '../types/view';

export type AppRoute = {
  view: ViewId;
  stationName: string | null;
};

const PATH_BY_VIEW: Record<ViewId, string> = {
  line: '/',
  map: '/map',
  route: '/route',
  mypage: '/mypage',
};

const VIEW_BY_PATH: Record<string, ViewId> = {
  '/': 'line',
  '/map': 'map',
  '/route': 'route',
  '/mypage': 'mypage',
};

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export function readRoute(location: Location = window.location): AppRoute {
  const appPath = location.pathname.startsWith(BASE_PATH)
    ? location.pathname.slice(BASE_PATH.length)
    : location.pathname;
  const normalizedPath = appPath.replace(/\/$/, '') || '/';
  const view = VIEW_BY_PATH[normalizedPath] ?? 'line';
  const stationName = new URLSearchParams(location.search).get('station');

  return { view, stationName };
}

export function getPath(view: ViewId, stationName?: string): string {
  const path = PATH_BY_VIEW[view];
  const targetPath = `${BASE_PATH}${path}` || '/';
  if (view !== 'map' || !stationName) return targetPath;

  return `${targetPath}?station=${encodeURIComponent(stationName)}`;
}

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
