import apiClient from './auth';
import type {
  ApiResponse,
  Assessment,
  CreateAssessmentPayload,
  Paginated,
} from '../types/api';

export const getAssessments = async (
  page = 1,
  size = 10
): Promise<ApiResponse<Paginated<Assessment>>> => {
  const response = await apiClient.get<ApiResponse<Paginated<Assessment>>>('/assessments/', {
    params: { page, size },
  });
  return response.data;
};

export const createAssessment = async (
  payload: CreateAssessmentPayload
): Promise<ApiResponse<Assessment>> => {
  const response = await apiClient.post<ApiResponse<Assessment>>('/assessments/', payload);
  return response.data;
};

export const getAssessment = async (id: string): Promise<ApiResponse<Assessment>> => {
  const response = await apiClient.get<ApiResponse<Assessment>>(`/assessments/${id}`);
  return response.data;
};
