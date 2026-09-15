import type {
  ApiResponse,
  LoginData,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('ohas_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (res.status === 401) localStorage.removeItem('ohas_token');
  if (!res.ok) throw { response: { data: body, status: res.status } };
  return body as T;
}

const apiClient = {
  get: <T>(path: string, opts: { params?: Record<string, unknown> } = {}) => {
    const entries = Object.entries(opts.params ?? {}).map(([k, v]) => [k, String(v)]);
    const qs = entries.length ? `?${new URLSearchParams(entries).toString()}` : '';
    return request<T>(`${path}${qs}`, { method: 'GET' }).then((data) => ({ data }));
  },
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) }).then((data) => ({
      data,
    })),
};

export const register = (payload: RegisterPayload): Promise<ApiResponse<User>> =>
  apiClient.post<ApiResponse<User>>('/auth/register', payload).then((r) => r.data);

export const login = (payload: LoginPayload): Promise<ApiResponse<LoginData>> =>
  apiClient.post<ApiResponse<LoginData>>('/auth/login', payload).then((r) => r.data);

export const getCurrentUser = (): Promise<ApiResponse<User>> =>
  apiClient.get<ApiResponse<User>>('/users/me').then((r) => r.data);

export default apiClient;
