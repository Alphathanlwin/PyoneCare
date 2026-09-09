import apiClient from './auth';
import type { ApiResponse, ChatAnswerData, ChatIntakeData } from '../types/api';

export const chatIntake = async (text: string): Promise<ApiResponse<ChatIntakeData>> => {
  const response = await apiClient.post<ApiResponse<ChatIntakeData>>('/chat/intake', { text });
  return response.data;
};

export const chatExplain = async (
  assessmentId: string,
  question: string
): Promise<ApiResponse<ChatAnswerData>> => {
  const response = await apiClient.post<ApiResponse<ChatAnswerData>>('/chat/explain', {
    assessment_id: assessmentId,
    question,
  });
  return response.data;
};
