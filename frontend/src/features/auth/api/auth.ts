import type { ApiError, AuthTokens, RegisteredUser } from '../types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const body = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok) {
    const error = body as ApiError | null;
    const validationMessages = error?.details?.errors
      ?.map((item) => {
        const field = item.loc?.filter((part) => part !== 'body').join('.') ?? '';
        return field && item.msg ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join(' / ');
    const message = [error?.message, validationMessages].filter(Boolean).join(' ');
    throw new Error(message || '요청을 처리하지 못했습니다.');
  }
  return body as T;
}

export function requestEmailVerification(email: string) {
  return request<{ message: string }>('/auth/email-verifications', {
    method: 'POST',
    body: JSON.stringify({ email, purpose: 'SIGNUP' }),
  });
}

export function confirmEmailVerification(email: string, code: string) {
  return request<{ verificationToken: string }>('/auth/email-verifications/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code, purpose: 'SIGNUP' }),
  });
}

export function registerAccount(input: {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  nickname: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  emailVerificationToken: string;
}) {
  return request<RegisteredUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginAccount(email: string, password: string) {
  return request<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function requestPasswordReset(email: string) {
  return request<{ message: string }>('/auth/password-reset/requests', {
    method: 'POST',
    body: JSON.stringify({ email, purpose: 'PASSWORD_RESET' }),
  });
}

export function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
  newPasswordConfirm: string;
}) {
  return request<{ message: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ ...input, purpose: 'PASSWORD_RESET' }),
  });
}
