import axios, { type AxiosInstance } from 'axios';
import type {
  ApiResponse,
  LoginData,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types/api';

// In dev this stays relative ('/api/v1') and Vite's dev server proxies /api to
// the backend (see vite.config.ts), so it works identically via localhost or a
// phone on the LAN. In production the frontend is a separate static site, so
// the build injects VITE_API_BASE_URL (e.g. https://ohas-api.onrender.com/api/v1)
// pointing at the deployed backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const authApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ohas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('ohas_token');
    }
    return Promise.reject(error);
  }
);

export const register = async (payload: RegisterPayload): Promise<ApiResponse<User>> => {
  const response = await authApi.post<ApiResponse<User>>('/auth/register', payload);
  return response.data;
};

export const login = async (payload: LoginPayload): Promise<ApiResponse<LoginData>> => {
  const response = await authApi.post<ApiResponse<LoginData>>('/auth/login', payload);
  return response.data;
};

export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  const response = await authApi.get<ApiResponse<User>>('/users/me');
  return response.data;
};

export default authApi;
