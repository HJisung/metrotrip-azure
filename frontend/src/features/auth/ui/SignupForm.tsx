import { useState } from 'react';
import { getAuthPath, navigate } from '../../../app/route';
import { confirmEmailVerification, registerAccount, requestEmailVerification } from '../api/auth';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthField } from './AuthField';
import { AuthMessage } from './AuthMessage';

export function SignupForm() {
  const [form, setForm] = useState({ email: '', code: '', password: '', passwordConfirm: '', name: '', nickname: '' });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [notice, setNotice] = useState('');
  const { loading, error, run } = useAuthForm();
  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function sendCode() {
    const result = await run(() => requestEmailVerification(form.email));
    if (result) setNotice('인증 코드를 발송했습니다. 백엔드 콘솔을 확인해주세요.');
  }

  async function verifyCode() {
    const result = await run(() => confirmEmailVerification(form.email, form.code));
    if (result) {
      setVerificationToken(result.verificationToken);
      setNotice('이메일 인증이 완료되었습니다.');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      setNotice('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.');
      return;
    }
    if (!verificationToken) {
      setNotice('먼저 이메일 인증을 완료해주세요.');
      return;
    }
    if (!termsAgreed || !privacyAgreed) {
      setNotice('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }
    const result = await run(() => registerAccount({ ...form, termsAgreed, privacyAgreed, emailVerificationToken: verificationToken }));
    if (result) navigate(getAuthPath('login'));
  }

  return (
    <form className="space-y-md" onSubmit={submit}>
      <div className="flex items-end gap-sm">
        <div className="min-w-0 flex-1"><AuthField label="이메일" type="email" value={form.email} onChange={update('email')} /></div>
        <button type="button" className="rounded-md border border-primary px-sm py-sm text-body-md text-primary" onClick={sendCode} disabled={loading}>인증 발송</button>
      </div>
      <div className="flex items-end gap-sm">
        <div className="min-w-0 flex-1"><AuthField label="인증 코드" value={form.code} onChange={update('code')} placeholder="6자리 코드" /></div>
        <button type="button" className="rounded-md border border-primary px-sm py-sm text-body-md text-primary" onClick={verifyCode} disabled={loading}>인증 확인</button>
      </div>
      <AuthField label="이름" value={form.name} onChange={update('name')} />
      <AuthField label="닉네임" value={form.nickname} onChange={update('nickname')} />
      <AuthField label="비밀번호" type="password" value={form.password} onChange={update('password')} placeholder="영문·숫자·특수문자 포함 8자 이상" />
      <AuthField label="비밀번호 확인" type="password" value={form.passwordConfirm} onChange={update('passwordConfirm')} />
      <label className="flex items-center gap-sm text-body-md text-on-surface"><input type="checkbox" checked={termsAgreed} onChange={(event) => setTermsAgreed(event.target.checked)} /> 이용약관에 동의합니다.</label>
      <label className="flex items-center gap-sm text-body-md text-on-surface"><input type="checkbox" checked={privacyAgreed} onChange={(event) => setPrivacyAgreed(event.target.checked)} /> 개인정보처리방침에 동의합니다.</label>
      <AuthMessage message={notice} />
      <AuthMessage message={error} error />
      <button className="w-full rounded-md bg-primary px-md py-sm font-semibold text-on-primary" disabled={loading}>{loading ? '가입 중...' : '회원가입'}</button>
    </form>
  );
}
