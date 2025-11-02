// frontend/src/types/index.ts
import { ModelMode } from '../contexts/ThemeContext'; // <-- *** THIS IS THE FIX *** (was './')

// --- Generic Types ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface TrainingFormData {
  learning_rate: number;
  epochs: number;
}

export type PredictionFormData = {
  [key: string]: number; // Allows for {cgpa, iq} or {studytime_hours, goout_hours}
};

// --- Neural Network Types ---
export interface NeuralNetworkParameters {
  [key: string]: number[][];
}

export interface NetworkLayer {
  size: number;
  type: 'input' | 'hidden' | 'output';
}

export interface PlotImage {
  epoch: number;
  image: string;
}

export interface TrainingHistory {
  loss: number[];
  weights: { [key: string]: number[][] }[];
  biases: { [key: string]: number[][] }[];
  
  // Mode-specific
  accuracy?: number[];
  r2_score?: number[];
  decision_boundaries?: PlotImage[];
  prediction_surfaces?: PlotImage[];
}

export interface TrainingStatus {
  is_training: boolean;
  epoch: number;
  total_epochs: number;
  loss: number;
  progress_percentage: number;
  current_weights?: Record<string, number[][]>;
  current_biases?: Record<string, number[][]>;
  session_id?: string;
  error?: string;

  // Mode-specific
  accuracy?: number;
  r2_score?: number;
  decision_boundary?: PlotImage;
  prediction_surface?: PlotImage;
}

export interface SessionData {
  session_id: string;
  hyperparameters: {
    learning_rate: number;
    epochs: number;
  };
  history: TrainingHistory;
  mode: ModelMode;
  timestamp: string;
}

export interface SessionsResponse {
  success: boolean;
  data: {
    session_id: string;
    hyperparameters: {
      learning_rate: number;
      epochs: number;
    };
    timestamp: string;
    mode: ModelMode;
  }[];
}

// --- EDA Types ---
export interface FeatureStats {
  mean: number;
  median: number;
  min: number;
  max: number;
}

export interface EDAStats {
  total_samples: number;
  train_test_split: string;
  features: {
    [key: string]: FeatureStats; // e.g., features['cgpa'] or features['studytime_hours']
  };
  // Classification specific
  placement_rate?: number;
}

export interface EDAPlots {
  [key: string]: string; // e.g., plots['cgpa_hist'] or plots['studytime_hist']
}

export interface EDAData {
  stats: EDAStats;
  plots: EDAPlots;
}

// --- Prediction/Evaluation Types ---
export interface PredictionResult {
  prediction: number;
  label?: string; // Classification: "PLACED ✅"
  probability?: number; // Classification
  prediction_label?: string; // Regression: "Predicted Grade: 78.5"
  input: { [key: string]: number };
  scaled_input: { [key: string]: number };
}

export interface EvaluationResult {
  // Classification
  accuracy?: number;
  confusion_matrix?: {
    true_positives: number;
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
  };
  precision?: number;
  recall?: number;
  f1_score?: number;
  
  // Regression
  r2_score?: number;
  loss_mse?: number;
  mean_absolute_error?: number;
}

// --- Model IO Types ---
export interface TrainResponse {
  success: boolean;
  message: string;
  session_id: string;
}

export interface SaveModelResponse {
  success: boolean;
  data: {
    filename: string;
    download_url: string;
  };
}

export interface LoadModelResponse {
  success: boolean;
  message: string;
}

// --- Chatbot Types ---
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  message?: string;
}