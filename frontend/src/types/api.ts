// Shared shapes for the OHAS REST API. The backend wraps every response in a
// { success, data, error } envelope (see backend/utils/response.py).

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string } | null;
}

// Loose shape for reading a message out of a failed request (axios error).
export interface ApiErrorLike {
  response?: {
    data?: {
      error?: { code?: string; message?: string } | null;
      detail?: string;
      message?: string;
    };
  };
  code?: string;
  message?: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  date_of_birth?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  date_of_birth: string | null;
}

export interface LoginData {
  access_token: string;
  user?: User;
}

export type SymptomMap = Record<string, boolean>;

export interface PhotoPayload {
  front: string | null;
  upper: string | null;
  lower: string | null;
}

export interface CreateAssessmentPayload {
  symptoms: SymptomMap;
  photos: PhotoPayload;
}

export interface Recommendation {
  id: string;
  action: string;
  urgency: string;
  conditionLabel?: string;
}

export interface Diagnosis {
  id: string;
  condition: string;
  explanation: string;
  triggered_rules?: string[];
  recommendations?: Recommendation[];
}

export interface Assessment {
  id: string;
  created_at: string;
  risk_level: RiskLevel | string;
  diagnoses?: Diagnosis[];
  conditions_detected?: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface ChatAnswerData {
  answer: string;
}

export interface ChatIntakeData {
  symptoms: SymptomMap;
}

export interface Clinic {
  place_id: string;
  name: string;
  address?: string;
  rating?: number | null;
  // null for an area/text search (no origin to measure from).
  distance_km?: number | null;
  phone?: string;
}

export interface ClinicListData {
  items: Clinic[];
}
