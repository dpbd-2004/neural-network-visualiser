// frontend/src/services/api.ts
import axios from 'axios';
import {
  TrainingFormData,
  TrainingStatus,
  PredictionResult,
  ModelState,
  EdaStats,
  EdaPlots,
  SessionSummary,
  SessionData,
  SaveModelResponse
} from '../types'; // Import types

// Define the base URL for your Flask API
const API_BASE_URL = 'http://localhost:5000'; // Adjust if your backend runs elsewhere

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Functions ---

// Fetch EDA data
export const getEdaData = async (): Promise<{ stats: EdaStats; plots: EdaPlots }> => {
  try {
    const response = await apiClient.get('/api/eda');
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch EDA data');
    }
  } catch (error) {
    console.error('Error fetching EDA data:', error);
    throw error; // Re-throw to be caught by the component
  }
};

// Start training
export const startTraining = async (formData: TrainingFormData): Promise<{ success: boolean; message: string; session_id: string }> => {
  try {
    const response = await apiClient.post('/api/train', formData);
    return response.data; // Should contain { success: true, message: '...', session_id: '...' }
  } catch (error) {
    console.error('Error starting training:', error);
    throw error;
  }
};

// Get current training status
export const getTrainingStatus = async (): Promise<TrainingStatus> => {
  try {
    const response = await apiClient.get('/api/train/status');
    if (response.data.success) {
      // Add default empty objects if weights/biases are missing in response
      const statusData = response.data.data;
      statusData.current_weights = statusData.current_weights ?? {};
      statusData.current_biases = statusData.current_biases ?? {};
       // Handle decision boundary format consistency if needed here
      if (typeof statusData.decision_boundary === 'string') {
           statusData.decision_boundary = { epoch: statusData.epoch, image: statusData.decision_boundary };
      }
      return statusData;
    } else {
      throw new Error(response.data.message || 'Failed to fetch training status');
    }
  } catch (error) {
    // Avoid throwing an error here for polling, maybe return a default state or log
    console.warn('Polling failed:', error);
    // Return a default "not training" status to prevent breaking the UI loop
    return {
        is_training: false, epoch: 0, total_epochs: 0, loss: 0, accuracy: 0,
        progress_percentage: 0, current_weights: {}, current_biases: {},
        decision_boundary: null
    };
     // Or re-throw if you want the component to handle polling errors more explicitly
     // throw error;
  }
};

// Get current model state (weights, biases, maybe boundary)
export const getModelState = async (): Promise<ModelState> => {
  try {
    const response = await apiClient.get('/api/model/state');
    if (response.data.success) {
      const stateData = response.data.data;
        // Handle decision boundary format consistency
        if (typeof stateData.decision_boundary === 'string') {
           stateData.decision_boundary = { epoch: 0, image: stateData.decision_boundary }; // Assuming epoch 0 for initial state
        }
      return stateData;
    } else {
      throw new Error(response.data.message || 'Failed to fetch model state');
    }
  } catch (error) {
    console.error('Error fetching model state:', error);
    throw error;
  }
};

// Make a prediction
export const predict = async (cgpa: number, iq: number): Promise<PredictionResult> => {
  try {
    const response = await apiClient.post('/api/predict', { cgpa, iq });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Prediction failed');
    }
  } catch (error) {
    console.error('Error making prediction:', error);
    throw error;
  }
};

// Save the current model
export const saveModel = async (): Promise<SaveModelResponse> => {
    try {
        const response = await apiClient.get('/api/save-model');
        if(response.data.success) {
            return response.data.data; // { filename: '...', download_url: '...' }
        } else {
            throw new Error(response.data.message || 'Failed to save model');
        }
    } catch (error) {
        console.error('Error saving model:', error);
        throw error;
    }
}

// Get list of saved sessions
export const getSessions = async (): Promise<SessionSummary[]> => {
    try {
        const response = await apiClient.get('/api/sessions');
        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to fetch sessions');
        }
    } catch (error) {
        console.error('Error fetching sessions:', error);
        throw error;
    }
}

// Replay a specific session
export const replaySession = async (sessionId: string): Promise<SessionData> => {
    try {
        const response = await apiClient.get(`/api/replay-session/${sessionId}`);
        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to replay session');
        }
    } catch (error) {
        console.error(`Error replaying session ${sessionId}:`, error);
        throw error;
    }
}

// Add other API functions if needed (e.g., evaluate, load-model)