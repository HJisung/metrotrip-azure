import type { ReactNode } from 'react';
import { getAuthPath, getPath, navigate, type AuthPage } from '../../../app/route';
import { asset } from '../../../shared/lib/asset';
import { cn } from '../../../shared/lib/cn';
import { Button } from '../../../shared/ui/Button';
import { Dialog, DialogContent } from '../../../shared/ui/Dialog';

type AuthLayoutProps = {
  page: AuthPage;
  children: ReactNode;
};

type AuthStandaloneLayoutProps = AuthLayoutProps & {
  title: string;
  description: string;
  showHeader?: boolean;
};

export function AuthBrand() {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-center p-0 hover:bg-transparent"
      onClick={() => navigate(getPath('line'))}
      aria-label="MetroTrip 로그인으로 이동"
    >
      <img src={asset('logo.png')} alt="MetroTrip" className="h-[var(--auth-logo-height)] w-auto object-contain" />
    </Button>
  );
}

export function AuthLayout({ page, children }: AuthLayoutProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && navigate(getPath('map'))}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[var(--auth-dialog-width)] border-outline-variant/60 p-[var(--auth-gutter)]">
        <div className="auth-dialog-motion flex flex-col gap-[var(--auth-gap)]">
          <AuthBrand />
          {children}
          <AuthNavigation page={page} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuthStandaloneLayout({ page, title, description, showHeader = true, children }: AuthStandaloneLayoutProps) {
  return (
    <main className="auth-page-shell min-h-dvh overflow-y-auto bg-background px-[var(--auth-gutter)] py-[var(--auth-vertical-gutter)]">
      <div className={cn(
        'mx-auto flex w-full max-w-[var(--auth-width)] flex-col',
        page === 'signup' ? 'py-sm sm:py-xl' : 'min-h-[calc(100dvh-2rem)] justify-center',
      )}>
        <section className="flex flex-col gap-[var(--auth-gap)] rounded-2xl bg-surface-bright px-[var(--auth-gutter)] py-[var(--auth-vertical-gutter)] shadow-card" aria-labelledby="auth-page-title">
          <AuthBrand />
          {showHeader && (
            <header className="space-y-xs text-center">
              <h1 id="auth-page-title" className="text-[var(--auth-title-size)] leading-tight font-heading text-on-surface">{title}</h1>
              <p className="text-[var(--auth-label-size)] leading-relaxed text-on-surface-variant">{description}</p>
            </header>
          )}
          {children}
          <AuthNavigation page={page} />
        </section>
      </div>
    </main>
  );
}

function AuthNavigation({ page }: { page: AuthPage }) {
  return (
    <nav className="flex flex-wrap justify-center gap-xs border-t border-outline-variant/70 pt-md" aria-label="인증 페이지 이동">
      {page !== 'login' && <AuthLink page="login">로그인</AuthLink>}
      {page !== 'signup' && <AuthLink page="signup">회원가입</AuthLink>}
      {page !== 'password-reset' && <AuthLink page="password-reset">비밀번호 찾기</AuthLink>}
    </nav>
  );
}

function AuthLink({ page, children }: { page: AuthPage; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-on-surface-variant transition-transform duration-200 hover:-translate-y-0.5 hover:text-primary"
      onClick={() => navigate(getAuthPath(page))}
    >
      {children}
    </Button>
  );
}
