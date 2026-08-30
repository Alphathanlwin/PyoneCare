import apiClient from './auth';

export const getTelegramLinkStatus = async () => {
  const response = await apiClient.get('/telegram/link');
  return response.data;
};
