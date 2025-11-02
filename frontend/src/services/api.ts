// frontend/src/services/api.ts
import axios from 'axios';
import {
  ApiResponse,
  EDAData,
  TrainResponse,
  TrainingStatus,
  PredictionResult,
  EvaluationResult,
  SaveModelResponse,
  LoadModelResponse,
  SessionsResponse,
  SessionData,
  TrainingFormData,
  PredictionFormData,
  ChatResponse // Added this in last step
} from '../types';
import { ModelMode } from '../contexts/ThemeContext'; // <-- Import ModelMode

const API_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Update all relevant functions ---

export const fetchEDA = async (mode: ModelMode): Promise<EDAData> => {
  const response = await api.get<ApiResponse<EDAData>>(`/api/eda?mode=${mode}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch EDA data');
};

export const startTraining = async (formData: TrainingFormData, mode: ModelMode): Promise<string> => {
  try {
    const response = await api.post<TrainResponse>('/api/train', {
      ...formData,
      mode: mode, // <-- Send mode in request body
    });

    if (response.data.success) {
      return response.data.session_id;
    } else {
      throw new Error(response.data.message || 'Failed to start training');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getTrainingStatus = async (mode: ModelMode): Promise<TrainingStatus> => {
  const response = await api.get<ApiResponse<TrainingStatus>>(`/api/train/status?mode=${mode}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch training status');
};

export const predict = async (formData: PredictionFormData, mode: ModelMode): Promise<PredictionResult> => {
  const response = await api.post<ApiResponse<PredictionResult>>('/api/predict', {
    ...formData,
    mode: mode, // <-- Send mode in request body
  });
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to make prediction');
};

export const evaluate = async (mode: ModelMode): Promise<EvaluationResult> => {
  const response = await api.get<ApiResponse<EvaluationResult>>(`/api/evaluate?mode=${mode}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to evaluate model');
};

export const getModelState = async (mode: ModelMode): Promise<{
  weights: any;
  biases: any;
  decision_boundary?: { epoch: number; image: string; };
  prediction_surface?: { epoch: number; image: string; }; // <-- Add new surface
}> => {
  const response = await api.get<ApiResponse<any>>(`/api/model/state?mode=${mode}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error('Failed to fetch model state');
};

// --- Unchanged functions ---

export const loadModel = async (file: File): Promise<void> => {
  // This would need to be mode-aware if you use it
  const formData = new FormData();
  formData.append('model_file', file);
  
  const response = await api.post<LoadModelResponse>('/api/load-model', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to load model');
  }
};

export const saveModel = async (mode: ModelMode): Promise<SaveModelResponse['data']> => {
  // This would need to be mode-aware
  const response = await api.get<SaveModelResponse>(`/api/save-model?mode=${mode}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error('Failed to save model');
};

export const getSessions = async (): Promise<SessionsResponse['data']> => {
  // This would need to be mode-aware
  const response = await api.get<SessionsResponse>('/api/sessions');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error('Failed to fetch sessions');
};

export const replaySession = async (sessionId: string): Promise<SessionData> => {
  // This would need to be mode-aware
  const response = await api.get<ApiResponse<SessionData>>(`/api/replay-session/${sessionId}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to replay session');
};

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await api.post<ChatResponse>('/api/chat', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as ChatResponse;
    }
    return { success: false, message: 'Failed to connect to the chat service.' };
  }
};