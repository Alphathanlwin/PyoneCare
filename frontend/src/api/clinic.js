import apiClient from './auth';

export const getNearbyClinics = async (lat, lng, radius = 5000) => {
  const response = await apiClient.get('/clinics/nearby', { params: { lat, lng, radius } });
  return response.data;
};
