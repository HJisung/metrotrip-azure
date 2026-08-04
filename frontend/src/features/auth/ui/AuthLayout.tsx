import type { ReactNode } from 'react';
import { getAuthPath, getPath, navigate, type AuthPage } from '../../../app/route';
import { Button } from '../../../shared/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../shared/ui/Dialog';

type AuthLayoutProps = {
  title: string;
  description: string;
  page: AuthPage;
  children: ReactNode;
};

export function AuthLayout({ title, description, page, children }: AuthLayoutProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && navigate(getPath('map'))}>
      <DialogContent className="overflow-hidden border-primary/20 p-0">
        <div className="h-2 bg-primary" aria-hidden="true" />
        <div className="p-lg">
        <Button
          type="button"
          variant="ghost"
          className="mb-lg h-auto justify-start px-0 text-headline-sm font-heading font-bold text-primary hover:bg-transparent"
          onClick={() => navigate(getAuthPath('login'))}
        >
          MetroTrip
        </Button>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-lg">{children}</div>
        <nav className="mt-lg flex flex-wrap justify-center gap-xs border-t border-outline-variant/70 pt-md">
          {page !== 'login' && <AuthLink page="login">로그인</AuthLink>}
          {page !== 'signup' && <AuthLink page="signup">회원가입</AuthLink>}
          {page !== 'password-reset' && <AuthLink page="password-reset">비밀번호 찾기</AuthLink>}
        </nav>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthLink({ page, children }: { page: AuthPage; children: ReactNode }) {
  return <Button type="button" variant="ghost" size="sm" onClick={() => navigate(getAuthPath(page))}>{children}</Button>;
}
