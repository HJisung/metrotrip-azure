import { useState } from 'react';
import { asset } from '../../shared/lib/asset';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import type { ViewId } from '../view';
import { NAV_ITEMS } from './navItems';

const LOGO_IMAGE = 'logo.png';

type TopNavProps = {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

export function TopNav({ current, onNavigate, theme, onToggleTheme }: TopNavProps) {
  const [logoMissing, setLogoMissing] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-md border-b border-outline-variant/70 bg-surface-bright/95 px-md shadow-sm backdrop-blur-xl sm:px-lg lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:h-dvh lg:w-20 lg:flex-col lg:gap-md lg:border-b-0 lg:border-r lg:px-sm lg:py-md">
      <div className="flex shrink-0 items-center gap-xs pr-sm sm:pr-md lg:pr-0">
        {logoMissing ? (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-primary">
              <Icon name="subway" />
            </span>
            <span className="text-headline-sm font-heading font-bold text-on-surface lg:hidden">MetroTrip</span>
          </>
        ) : (
          <img
            src={asset(LOGO_IMAGE)}
            alt="MetroTrip"
            className="h-8 w-auto max-w-[110px] object-contain sm:h-9 sm:max-w-[150px] lg:h-auto lg:w-14"
            onError={() => setLogoMissing(true)}
          />
        )}
      </div>

      <nav className="flex min-w-0 flex-1 items-center gap-xs overflow-x-auto lg:w-full lg:flex-col lg:items-stretch lg:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.view === current;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-label={item.label}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex h-11 shrink-0 items-center gap-xs rounded-xl px-sm text-body-md transition-all lg:h-auto lg:flex-col lg:px-xs lg:py-sm lg:text-center ${
                isCurrent
                  ? 'bg-primary-container font-bold text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Icon name={item.icon} className="text-[20px]" />
              <span className="hidden sm:inline lg:block lg:text-[11px] lg:leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        aria-pressed={theme === 'dark'}
        className="shrink-0 lg:mt-auto"
      >
        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[20px]" />
      </Button>
    </header>
  );
}
