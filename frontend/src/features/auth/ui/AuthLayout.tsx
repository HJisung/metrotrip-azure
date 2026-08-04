import type { ReactNode } from 'react';
import { getAuthPath, getPath, navigate, type AuthPage } from '../../../app/route';

type AuthLayoutProps = {
  title: string;
  description: string;
  page: AuthPage;
  children: ReactNode;
};

export function AuthLayout({ title, description, page, children }: AuthLayoutProps) {
  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 px-md py-xl">
      <div className="w-full max-w-[28rem] rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-xl">
        <button type="button" className="float-right text-body-md text-on-surface-variant hover:text-primary" onClick={() => navigate(getPath('map'))}>닫기</button>
        <button
          type="button"
          className="mb-xl text-headline-sm font-heading font-bold text-primary"
          onClick={() => navigate(getAuthPath('login'))}
        >
          MetroTrip
        </button>
        <h1 className="text-headline-md text-on-surface">{title}</h1>
        <p className="mt-xs text-body-md text-on-surface-variant">{description}</p>
        <div className="mt-lg">{children}</div>
        <nav className="mt-lg flex justify-center gap-md text-body-md text-on-surface-variant">
          {page !== 'login' && <AuthLink page="login">로그인</AuthLink>}
          {page !== 'signup' && <AuthLink page="signup">회원가입</AuthLink>}
          {page !== 'password-reset' && <AuthLink page="password-reset">비밀번호 찾기</AuthLink>}
        </nav>
      </div>
    </section>
  );
}

function AuthLink({ page, children }: { page: AuthPage; children: ReactNode }) {
  return (
    <button type="button" className="hover:text-primary" onClick={() => navigate(getAuthPath(page))}>
      {children}
    </button>
  );
}
