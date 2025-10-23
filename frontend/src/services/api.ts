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
  PredictionFormData
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// EDA endpoints
export const fetchEDA = async (): Promise<EDAData> => {
  const response = await api.get<ApiResponse<EDAData>>('/api/eda');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch EDA data');
};

// Training endpoints
export const startTraining = async (formData: TrainingFormData): Promise<string> => {
  try {
    // Always add a fixed hidden_units = 2 since the architecture is hardcoded in the backend
    const response = await api.post<TrainResponse>('/api/train', {
      ...formData,
      hidden_units: 2 // Fixed value to match [2,2,1] architecture
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

export const getTrainingStatus = async (): Promise<TrainingStatus> => {
  const response = await api.get<ApiResponse<TrainingStatus>>('/api/train/status');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch training status');
};

// Prediction endpoints
export const predict = async (formData: PredictionFormData): Promise<PredictionResult> => {
  const response = await api.post<ApiResponse<PredictionResult>>('/api/predict', formData);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to make prediction');
};

// Evaluation endpoints
export const evaluate = async (): Promise<EvaluationResult> => {
  const response = await api.get<ApiResponse<EvaluationResult>>('/api/evaluate');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to evaluate model');
};

// Model endpoints
export const saveModel = async (): Promise<SaveModelResponse['data']> => {
  const response = await api.get<SaveModelResponse>('/api/save-model');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error('Failed to save model');
};

export const getModelState = async (): Promise<{
  weights: any;
  biases: any;
  decision_boundary?: {
    epoch: number;
    image: string;
  };
}> => {
  const response = await api.get<ApiResponse<{
    weights: any;
    biases: any;
    decision_boundary?: {
      epoch: number;
      image: string;
    };
  }>>('/api/model/state');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error('Failed to fetch model state');
};

export const loadModel = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('model_file', file);
  
  const response = await api.post<LoadModelResponse>('/api/load-model', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to load model');
  }
};

// Session endpoints
export const getSessions = async (): Promise<SessionsResponse['data']> => {
  const response = await api.get<SessionsResponse>('/api/sessions');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error('Failed to fetch sessions');
};

export const replaySession = async (sessionId: string): Promise<SessionData> => {
  const response = await api.get<ApiResponse<SessionData>>(`/api/replay-session/${sessionId}`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to replay session');
};