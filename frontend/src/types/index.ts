// Neural Network Types
export interface NeuralNetworkParameters {
  [key: string]: number[][];
}

export interface NetworkLayer {
  size: number;
  type: 'input' | 'hidden' | 'output';
}

export interface TrainingHistory {
  loss: number[];
  accuracy: number[];
  weights: {
    [key: string]: number[][];
  }[];
  biases: {
    [key: string]: number[][];
  }[];
  decision_boundaries: {
    epoch: number;
    image: string;
  }[];
}

export interface TrainingStatus {
  is_training: boolean;
  epoch: number;
  total_epochs: number;
  loss: number;
  accuracy: number;
  progress_percentage: number;
  weights?: Record<string, number[][]>;
  biases?: Record<string, number[][]>;
  current_weights?: Record<string, number[][]>;
  current_biases?: Record<string, number[][]>;
  decision_boundary?: string | {
    epoch: number;
    image: string;
  };
}

export interface SessionData {
  session_id: string;
  hyperparameters: {
    learning_rate: number;
    epochs: number;
  };
  weights: Record<string, number[][]>[];
  biases: Record<string, number[][]>[];
  losses: number[];
  accuracies: number[];
  decision_boundaries?: {
    epoch: number;
    image: string;
  }[];
  timestamp: string;
}

export interface EDAStats {
  total_samples: number;
  placement_rate: number;
  train_test_split: string;
  features: {
    cgpa: {
      mean: number;
      median: number;
      min: number;
      max: number;
    };
    iq: {
      mean: number;
      median: number;
      min: number;
      max: number;
    };
  };
}

export interface EDAPlots {
  cgpa_hist: string;
  iq_hist: string;
  scatter_plot: string;
}

export interface EDAData {
  stats: EDAStats;
  plots: EDAPlots;
}

export interface PredictionResult {
  prediction: number;
  probability: number;
  label: string;
  input: {
    cgpa: number;
    iq: number;
  };
  scaled_input: {
    cgpa: number;
    iq: number;
  };
}

export interface EvaluationResult {
  accuracy: number;
  confusion_matrix: {
    true_positives: number;
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
  };
  precision: number;
  recall: number;
  f1_score: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

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

export interface SessionsResponse {
  success: boolean;
  data: {
    session_id: string;
    hyperparameters: {
      learning_rate: number;
      epochs: number;
      hidden_units: number;
    };
    timestamp: string;
  }[];
}

// Form Types
export interface TrainingFormData {
  learning_rate: number;
  epochs: number;
}

export interface PredictionFormData {
  cgpa: number;
  iq: number;
}

// Chatbot Types
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