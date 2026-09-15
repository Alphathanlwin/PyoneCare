import type { ApiErrorLike } from '../types/api';

export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiErrorLike;
  return e.response?.data?.error?.message || e.response?.data?.detail || fallback;
}
