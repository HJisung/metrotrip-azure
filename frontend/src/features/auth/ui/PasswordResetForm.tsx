import { useState } from 'react';
import { getAuthPath, navigate } from '../../../app/route';
import { requestPasswordReset, resetPassword } from '../api/auth';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthField } from './AuthField';
import { AuthMessage } from './AuthMessage';

export function PasswordResetForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [notice, setNotice] = useState('');
  const { loading, error, run } = useAuthForm();

  async function sendCode() {
    const result = await run(() => requestPasswordReset(email));
    if (result) setNotice('재설정 코드를 발송했습니다. 백엔드 콘솔을 확인해주세요.');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setNotice('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.');
      return;
    }
    const result = await run(() => resetPassword({ email, code, newPassword, newPasswordConfirm }));
    if (result) navigate(getAuthPath('login'));
  }

  return (
    <form className="space-y-md" onSubmit={submit}>
      <div className="flex items-end gap-sm"><div className="min-w-0 flex-1"><AuthField label="이메일" type="email" value={email} onChange={setEmail} /></div><button type="button" className="rounded-md border border-primary px-sm py-sm text-body-md text-primary" onClick={sendCode} disabled={loading}>코드 발송</button></div>
      <AuthField label="인증 코드" value={code} onChange={setCode} placeholder="6자리 코드" />
      <AuthField label="새 비밀번호" type="password" value={newPassword} onChange={setNewPassword} />
      <AuthField label="새 비밀번호 확인" type="password" value={newPasswordConfirm} onChange={setNewPasswordConfirm} />
      <AuthMessage message={notice} />
      <AuthMessage message={error} error />
      <button className="w-full rounded-md bg-primary px-md py-sm font-semibold text-on-primary" disabled={loading}>{loading ? '변경 중...' : '비밀번호 변경'}</button>
    </form>
  );
}
