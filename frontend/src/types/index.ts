// frontend/src/types/index.ts

// Basic structure for weights and biases
export interface Parameters {
  W1: number[][];
  b1: number[][]; // Should be [[b1_1], [b1_2], ...]
  W2: number[][];
  b2: number[][]; // Should be [[b2_1]]
}

// Data structure expected from the backend's /api/train/status endpoint
// Matches the structure in bhaskar-nie/backend/app/api.py
export interface TrainingStatus {
  is_training: boolean;
  epoch: number;
  total_epochs: number;
  loss: number;
  accuracy: number;
  progress_percentage: number;
  current_weights?: Record<string, number[][]>; // Use Record for flexibility
  current_biases?: Record<string, number[][]>;
  decision_boundary?: { // Can be an object
    epoch: number;
    image: string; // Base64 image string
  } | string | null; // Or just the string, or null initially
  session_id?: string;
  hyperparameters?: {
    learning_rate: number;
    epochs: number;
  };
  error?: string; // Optional error message
  // Add other fields if your backend sends them
}

// Data structure for the training form
export interface TrainingFormData {
  learning_rate: number;
  epochs: number;
}

// Structure for EDA stats from backend
export interface EdaStats {
    total_samples: number;
    placement_rate: number;
    train_test_split: string;
    features: {
        cgpa: { mean: number; median: number; min: number; max: number };
        iq: { mean: number; median: number; min: number; max: number };
    };
}

// Structure for EDA plots (base64 strings)
export interface EdaPlots {
    cgpa_hist: string;
    iq_hist: string;
    scatter_plot: string;
}

// Structure for prediction result
export interface PredictionResult {
    prediction: number;
    probability: number;
    label: string;
    input: { cgpa: number; iq: number };
    scaled_input: { cgpa: number; iq: number };
}

// Structure for model state
export interface ModelState {
    weights: Record<string, number[][]>;
    biases: Record<string, number[][]>;
    decision_boundary?: { epoch: number; image: string } | string | null;
}

// Structure for saved sessions list
export interface SessionSummary {
    session_id: string;
    hyperparameters: { learning_rate?: number; epochs?: number };
    timestamp: string | number; // Or Date if you parse it
}

// Structure for replayed session data
export interface SessionData extends SessionSummary {
    history: {
        loss: number[];
        accuracy: number[];
        weights: Record<string, number[][]>[];
        biases: Record<string, number[][]>[];
        decision_boundaries: { epoch: number; image: string }[];
    };
    // Add other relevant fields if saved
}

// Structure for save model response
export interface SaveModelResponse {
    filename: string;
    download_url: string;
}