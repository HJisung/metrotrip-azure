import type { Review, ReviewInput, ReviewListResponse } from '../types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

type ApiError = {
  message?: string;
  details?: { errors?: Array<{ loc?: Array<string | number>; msg?: string }> } | null;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem('metrotrip-access-token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok) {
    const error = body as ApiError | null;
    const validation = error?.details?.errors
      ?.map((item) => item.msg)
      .filter(Boolean)
      .join(' / ');
    throw new Error([error?.message, validation].filter(Boolean).join(' ') || '요청을 처리하지 못했습니다.');
  }
  return body as T;
}

export function listReviews(params: { keyword?: string; stationId?: number; tag?: string; page?: number; size?: number } = {}) {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.stationId) query.set('station_id', String(params.stationId));
  if (params.tag) query.set('tag', params.tag);
  query.set('page', String(params.page ?? 1));
  query.set('size', String(params.size ?? 20));
  return request<ReviewListResponse>(`/reviews?${query}`);
}

export function listMyReviews(params: { page?: number; size?: number } = {}) {
  const query = new URLSearchParams({ page: String(params.page ?? 1), size: String(params.size ?? 20) });
  return request<ReviewListResponse>(`/users/me/reviews?${query}`);
}

export function getReview(reviewId: number) {
  return request<Review>(`/reviews/${reviewId}`);
}

export function createReview(input: ReviewInput) {
  return request<Review>('/reviews', { method: 'POST', body: JSON.stringify(input) });
}

export function updateReview(reviewId: number, input: Partial<ReviewInput>) {
  return request<Review>(`/reviews/${reviewId}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteReview(reviewId: number) {
  await request<null>(`/reviews/${reviewId}`, { method: 'DELETE' });
}
