import apiClient from './auth';
import type { ApiResponse, ClinicListData } from '../types/api';

export const getNearbyClinics = async (
  lat: number,
  lng: number,
  radius = 5000
): Promise<ApiResponse<ClinicListData>> => {
  const response = await apiClient.get<ApiResponse<ClinicListData>>('/clinics/nearby', {
    params: { lat, lng, radius },
  });
  return response.data;
};

// Area / place-name fallback for when the browser blocks or denies geolocation.
export const searchClinics = async (q: string): Promise<ApiResponse<ClinicListData>> => {
  const response = await apiClient.get<ApiResponse<ClinicListData>>('/clinics/search', {
    params: { q },
  });
  return response.data;
};
