import { getAccessToken } from './session';

export type CurrentUser = {
  userId: number;
  email: string;
  name: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');

export class SessionValidationError extends Error {
  status: number;

  constructor(status: number) {
    super('현재 로그인 상태를 확인하지 못했습니다.');
    this.status = status;
  }
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
  });
  if (!response.ok) throw new SessionValidationError(response.status);
  return response.json() as Promise<CurrentUser>;
}
