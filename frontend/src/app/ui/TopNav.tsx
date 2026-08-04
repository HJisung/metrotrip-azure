import { useState } from 'react';
import { Icon } from '../../shared/ui/Icon';
import type { ViewId } from '../view';
import { NAV_ITEMS } from './navItems';
import { asset } from '../../shared/lib/asset';

/** public/ 에 넣어 둔 로고 파일명 */
const LOGO_IMAGE = 'logo.png';

type TopNavProps = {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

/**
 * 상단 가로 내비게이션.
 *
 * 원래 좌측 사이드바였는데, 지도 화면을 넓게 쓰려고 상단으로 옮겼다.
 * 좁은 화면에서는 글자를 감추고 아이콘만 남긴다.
 */
export function TopNav({
  current,
  onNavigate,
  theme,
  onToggleTheme,
}: TopNavProps) {
  // 로고 파일을 아직 넣지 않았으면 원래 쓰던 아이콘 + 글자로 돌아간다
  const [logoMissing, setLogoMissing] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-lg border-b border-outline-variant bg-surface px-md sm:px-lg lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:h-dvh lg:w-20 lg:flex-col lg:gap-md lg:border-b-0 lg:border-r lg:px-sm lg:py-md">
      <div className="flex shrink-0 items-center gap-xs pr-sm sm:pr-md lg:pr-0">
        {logoMissing ? (
          <>
            <Icon name="subway" className="text-primary" />
            <span className="text-headline-sm font-heading font-bold text-on-surface">
              MetroTrip
            </span>
          </>
        ) : (
          // 로고 안에 이미 이름이 들어 있으므로 글자를 따로 붙이지 않는다
          <img
            src={asset(LOGO_IMAGE)}
            alt="MetroTrip"
            // 로고 여백까지 포함된 이미지라 조금 크게 잡아야 글자가 읽힌다.
            // 좁은 화면에서는 메뉴 자리를 뺏지 않도록 줄인다.
            className="h-8 w-auto max-w-[110px] object-contain sm:h-9 sm:max-w-[150px] lg:h-auto lg:w-14"
            onError={() => setLogoMissing(true)}
          />
        )}
      </div>

      {/* 메뉴가 넘치면 페이지가 아니라 메뉴 줄만 옆으로 밀리게 한다 */}
      <nav className="flex min-w-0 flex-1 items-stretch gap-md overflow-x-auto lg:w-full lg:flex-col lg:items-stretch lg:gap-xs lg:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.view === current;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-label={item.label}
              aria-current={isCurrent ? 'page' : undefined}
              className={`relative flex shrink-0 items-center gap-xs border-b-2 px-xs py-sm text-body-md transition-colors sm:px-sm lg:flex-col lg:border-b-0 lg:border-l-2 lg:px-xs lg:py-sm lg:text-center ${
                isCurrent
                  ? 'border-primary font-bold text-primary lg:border-l-primary'
                  : 'border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface lg:hover:border-l-outline'
              }`}
            >
              <Icon name={item.icon} className="text-[20px]" />
              <span className="hidden text-body-md sm:inline lg:block lg:text-[11px] lg:leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        aria-pressed={theme === 'dark'}
        className="flex h-9 w-9 shrink-0 items-center justify-center border-l border-outline-variant pl-sm text-on-surface-variant hover:text-primary lg:mt-auto lg:border-l-0 lg:border-t lg:pl-0 lg:pt-sm"
      >
        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
      </button>

    </header>
  );
}
