import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getAuthPath, navigate } from '../../../app/route';
import { Button } from '../../../shared/ui/Button';
import { AuthField } from './AuthField';
import { AuthMessage } from './AuthMessage';
import { confirmEmailVerification, registerAccount, requestEmailVerification } from '../api/auth';
import { useAuthForm } from '../hooks/useAuthForm';

const STAGES = ['terms', 'nickname', 'email', 'verification', 'password', 'confirm'] as const;
type SignupStage = (typeof STAGES)[number];

type SignupValues = {
  email: string;
  code: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
};

const STAGE_COPY: Record<SignupStage, { title: string; description: string }> = {
  terms: { title: '약관에 동의해주세요', description: '서비스 이용을 위해 약관 동의가 필요합니다.' },
  nickname: { title: '닉네임을 입력해주세요', description: '다른 사용자에게 보여질 닉네임입니다.' },
  email: { title: '이메일을 입력해주세요', description: '가입에 사용할 이메일을 인증해주세요.' },
  verification: { title: '인증 코드를 입력해주세요', description: '입력한 이메일로 전송된 코드를 확인해주세요.' },
  password: { title: '비밀번호를 만들어주세요', description: '영문, 숫자, 특수문자를 포함해 8자 이상 입력해주세요.' },
  confirm: { title: '비밀번호를 한 번 더 확인해주세요', description: '안전한 가입을 위해 비밀번호를 확인합니다.' },
};

export function SignupForm() {
  const [stage, setStage] = useState<SignupStage>('terms');
  const [verificationToken, setVerificationToken] = useState('');
  const [notice, setNotice] = useState('');
  const { loading, error, run } = useAuthForm();
  const {
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignupValues>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      code: '',
      password: '',
      passwordConfirm: '',
      nickname: '',
      termsAgreed: false,
      privacyAgreed: false,
    },
  });
  const values = watch();
  const copy = STAGE_COPY[stage];
  const completedUnits = (
    (values.termsAgreed ? 1 : 0) +
    (values.privacyAgreed ? 1 : 0) +
    (values.nickname.trim() ? 1 : 0) +
    (values.email.trim() ? 1 : 0) +
    (values.code.trim() ? 1 : 0) +
    (values.password ? 1 : 0) +
    (values.passwordConfirm ? 1 : 0)
  );
  const progress = (completedUnits / 7) * 100;
  const canContinue = {
    terms: values.termsAgreed && values.privacyAgreed,
    nickname: Boolean(values.nickname.trim()),
    email: Boolean(values.email.trim()),
    verification: Boolean(values.code.trim()),
    password: Boolean(values.password),
    confirm: Boolean(values.passwordConfirm),
  }[stage];

  function updateField(name: keyof SignupValues) {
    return (value: string) => {
      setValue(name, value as never, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      clearErrors(name);
      setNotice('');
    };
  }

  function moveTo(nextStage: SignupStage) {
    setNotice('');
    setStage(nextStage);
  }

  async function sendCode() {
    const email = getValues('email').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('email', { type: 'manual', message: '올바른 이메일 주소를 입력해주세요.' });
      return;
    }
    const result = await run(() => requestEmailVerification(email));
    if (result) {
      moveTo('verification');
      setNotice('인증 코드를 전송했습니다. 이메일을 확인해주세요.');
    }
  }

  async function verifyCode() {
    const code = getValues('code').trim();
    if (!/^\d{6}$/.test(code)) {
      setError('code', { type: 'manual', message: '인증 코드는 숫자 6자리로 입력해주세요.' });
      return;
    }
    const result = await run(() => confirmEmailVerification(getValues('email'), code));
    if (result) {
      setVerificationToken(result.verificationToken);
      moveTo('password');
      setNotice('이메일 인증이 완료되었습니다.');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = getValues();

    if (stage === 'terms') {
      if (!current.termsAgreed) setError('termsAgreed', { type: 'manual', message: '이용약관에 동의해주세요.' });
      if (!current.privacyAgreed) setError('privacyAgreed', { type: 'manual', message: '개인정보처리방침에 동의해주세요.' });
      if (current.termsAgreed && current.privacyAgreed) moveTo('nickname');
      return;
    }

    if (stage === 'nickname') {
      if (current.nickname.trim().length < 2 || current.nickname.trim().length > 20) {
        setError('nickname', { type: 'manual', message: '닉네임은 2~20자로 입력해주세요.' });
        return;
      }
      moveTo('email');
      return;
    }

    if (stage === 'email') {
      await sendCode();
      return;
    }

    if (stage === 'verification') {
      await verifyCode();
      return;
    }

    if (stage === 'password') {
      if (!/[A-Za-z]/.test(current.password) || !/\d/.test(current.password) || !/[^A-Za-z0-9]/.test(current.password) || current.password.length < 8) {
        setError('password', { type: 'manual', message: '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.' });
        return;
      }
      moveTo('confirm');
      return;
    }

    if (current.password !== current.passwordConfirm) {
      setError('passwordConfirm', { type: 'manual', message: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (!verificationToken) {
      setNotice('이메일 인증이 만료되었습니다. 다시 인증해주세요.');
      moveTo('email');
      return;
    }

    const result = await run(() => registerAccount({
      ...current,
      // 백엔드의 기존 필수 name 필드는 화면에서 받지 않고 닉네임으로 채운다.
      name: current.nickname,
      termsAgreed: current.termsAgreed,
      privacyAgreed: current.privacyAgreed,
      emailVerificationToken: verificationToken,
    }));
    if (result) navigate(getAuthPath('login'));
  }

  return (
    <form className="space-y-lg" onSubmit={submit} noValidate>
      {stage === 'terms' && (
        <header className="space-y-xs text-center">
          <h1 className="text-headline-md font-heading text-on-surface">회원가입</h1>
          <p className="text-body-md leading-relaxed text-on-surface-variant">MetroTrip에서 새로운 여정을 시작해보세요.</p>
        </header>
      )}

      <section className="space-y-lg" aria-live="polite">
        <header className="space-y-xs">
          <h2 className="text-headline-sm font-heading text-on-surface">{copy.title}</h2>
          <p className="text-body-md leading-relaxed text-on-surface-variant">{copy.description}</p>
        </header>

        {stage === 'terms' && (
          <div className="space-y-sm rounded-xl bg-surface-container-low p-md">
            <label className="flex items-start gap-sm text-body-md text-on-surface">
              <input type="checkbox" checked={values.termsAgreed} onChange={(event) => setValue('termsAgreed', event.target.checked, { shouldDirty: true })} />
              <span><strong className="font-semibold">[필수]</strong> 이용약관에 동의합니다.</span>
            </label>
            <AuthMessage message={errors.termsAgreed?.message} error />
            <label className="flex items-start gap-sm text-body-md text-on-surface">
              <input type="checkbox" checked={values.privacyAgreed} onChange={(event) => setValue('privacyAgreed', event.target.checked, { shouldDirty: true })} />
              <span><strong className="font-semibold">[필수]</strong> 개인정보처리방침에 동의합니다.</span>
            </label>
            <AuthMessage message={errors.privacyAgreed?.message} error />
          </div>
        )}

        {stage !== 'terms' && (
          <div className="space-y-md">
            {stage === 'confirm' && <div className="auth-field-enter"><AuthField label="비밀번호 확인" type="password" value={values.passwordConfirm} onChange={updateField('passwordConfirm')} error={errors.passwordConfirm?.message} autoFocus /></div>}
            {(stage === 'password' || stage === 'confirm') && (
              <AuthField label="비밀번호" type="password" value={values.password} onChange={updateField('password')} error={errors.password?.message} autoFocus={stage === 'password'} className={stage === 'password' ? 'auth-field-enter' : undefined} />
            )}
            {(stage === 'verification' || stage === 'password' || stage === 'confirm') && (
              <AuthField label="인증 코드" value={values.code} onChange={updateField('code')} error={errors.code?.message} placeholder="6자리 코드" readOnly={stage !== 'verification'} autoFocus={stage === 'verification'} className={stage === 'verification' ? 'auth-field-enter' : undefined} />
            )}
            {(stage === 'email' || stage === 'verification' || stage === 'password' || stage === 'confirm') && (
              <AuthField label="이메일" type="email" value={values.email} onChange={updateField('email')} error={errors.email?.message} readOnly={stage !== 'email'} autoFocus={stage === 'email'} className={stage === 'email' ? 'auth-field-enter' : undefined} />
            )}
            <AuthField label="닉네임" value={values.nickname} onChange={updateField('nickname')} error={errors.nickname?.message} autoFocus={stage === 'nickname'} className={stage === 'nickname' ? 'auth-field-enter' : undefined} />
          </div>
        )}
      </section>

      <AuthMessage message={notice} />
      <AuthMessage message={error} error />

      <div className="relative overflow-hidden rounded-lg bg-surface-container">
        <div className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} aria-hidden="true" />
        <Button type="submit" variant="ghost" className={`relative z-10 w-full text-body-lg hover:bg-transparent ${progress === 100 ? 'text-on-primary' : 'text-on-surface'}`} disabled={loading || !canContinue}>
          {loading ? '처리 중...' : stage === 'confirm' ? '회원가입' : stage === 'email' ? '인증 발송' : stage === 'verification' ? '인증 확인' : '다음'}
        </Button>
      </div>
    </form>
  );
}
