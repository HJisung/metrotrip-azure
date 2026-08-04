import type { ViewId } from './view';

export type AppRoute = {
  view: ViewId;
  stationName: string | null;
  authPage: AuthPage | null;
};

export type AuthPage = 'login' | 'signup' | 'password-reset';

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

const AUTH_PAGE_BY_PATH: Record<string, AuthPage> = {
  '/login': 'login',
  '/signup': 'signup',
  '/password-reset': 'password-reset',
};

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export function readRoute(location: Location = window.location): AppRoute {
  const appPath = location.pathname.startsWith(BASE_PATH)
    ? location.pathname.slice(BASE_PATH.length)
    : location.pathname;
  const normalizedPath = appPath.replace(/\/$/, '') || '/';
  const authPage = AUTH_PAGE_BY_PATH[normalizedPath] ?? null;
  const view = VIEW_BY_PATH[normalizedPath] ?? 'line';
  const stationName = new URLSearchParams(location.search).get('station');
  return { view, stationName, authPage };
}

export function getPath(view: ViewId, stationName?: string): string {
  const targetPath = `${BASE_PATH}${PATH_BY_VIEW[view]}` || '/';
  if (view !== 'map' || !stationName) return targetPath;
  return `${targetPath}?station=${encodeURIComponent(stationName)}`;
}

export function getAuthPath(page: AuthPage): string {
  return `${BASE_PATH}/${page}`;
}

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
