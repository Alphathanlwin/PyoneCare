import apiClient from './auth';
import type { ApiResponse, TelegramLinkData } from '../types/api';

export const getTelegramLinkStatus = async (): Promise<ApiResponse<TelegramLinkData>> => {
  const response = await apiClient.get<ApiResponse<TelegramLinkData>>('/telegram/link');
  return response.data;
};
