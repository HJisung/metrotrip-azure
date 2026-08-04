import { AuthLayout } from '../features/auth/ui/AuthLayout';
import { LoginForm } from '../features/auth/ui/LoginForm';
import { PasswordResetForm } from '../features/auth/ui/PasswordResetForm';
import { SignupForm } from '../features/auth/ui/SignupForm';
import type { AuthPage as AuthPageType } from '../features/auth/types';

export function AuthPage({ page }: { page: AuthPageType }) {
  if (page === 'signup') {
    return <AuthLayout page={page} title="회원가입" description="MetroTrip 서비스를 시작해보세요."><SignupForm /></AuthLayout>;
  }
  if (page === 'password-reset') {
    return <AuthLayout page={page} title="비밀번호 찾기" description="이메일 인증 후 비밀번호를 변경할 수 있습니다."><PasswordResetForm /></AuthLayout>;
  }
  return <AuthLayout page={page} title="로그인" description="MetroTrip에 로그인하세요."><LoginForm /></AuthLayout>;
}
