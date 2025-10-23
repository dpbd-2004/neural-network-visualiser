# backend/app/neural_network.py
import numpy as np
# --- New Imports ---
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg') # Essential for backend plotting without GUI
import seaborn as sns
import json
import os
from io import BytesIO
import base64
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
# --- End New Imports ---

class NeuralNetwork:
    def __init__(self, layers=[2, 2, 1], learning_rate=0.01):
        self.layers = layers
        self.learning_rate = learning_rate
        self.parameters = {}
        self.initialize_parameters()
        # --- Add Attributes ---
        self.scaler = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.df_raw = None # To store the original dataframe
        # --- End Add Attributes ---

    def initialize_parameters(self):
        # Your existing code
        np.random.seed(3)
        for i in range(1, len(self.layers)):
            self.parameters['W' + str(i)] = np.random.randn(self.layers[i], self.layers[i-1]) * 0.01
            self.parameters['b' + str(i)] = np.zeros((self.layers[i], 1))
        print("Initialized parameters (Your shapes):", {k: v.shape for k, v in self.parameters.items()}) # Debug

    # --- ADD load_and_preprocess_data ---
    def load_and_preprocess_data(self, filepath='app/placement-dataset.csv'):
        """Loads data, scales features, and splits into train/test sets."""
        try:
            print(f"[NN Class] Attempting to load data from: {filepath}")
            # Robust path checking (relative to this file, then project root)
            if not os.path.exists(filepath):
                 current_dir = os.path.dirname(__file__)
                 alt_filepath_app = os.path.join(current_dir, 'placement-dataset.csv')
                 alt_filepath_root = os.path.join(current_dir, '..', '..', 'placement-dataset.csv')
                 if os.path.exists(alt_filepath_app):
                     filepath = alt_filepath_app
                     print(f"[NN Class] Using path relative to app/: {filepath}")
                 elif os.path.exists(alt_filepath_root):
                    filepath = alt_filepath_root
                    print(f"[NN Class] Using path relative to project root: {filepath}")
                 else:
                    raise FileNotFoundError(f"Dataset not found. Checked: {filepath}, {alt_filepath_app}, {alt_filepath_root}")

            df = pd.read_csv(filepath)
            print("[NN Class] Dataset loaded successfully.")

            # Drop 'Unnamed: 0' if it exists
            if 'Unnamed: 0' in df.columns:
                df = df.drop(columns=['Unnamed: 0'])

            self.df_raw = df.copy() # Store raw data for EDA stats

            X = df[['cgpa', 'iq']].values
            # YOUR Y shape is (1, examples), ensure consistency
            y = df['placement'].values.reshape(1, -1)

            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)

            # Split data (use flattened y for split)
            X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
                X_scaled, y.flatten(), test_size=0.2, random_state=42)

            # Store scaled data in the shape your training expects: X=(features, examples), Y=(1, examples)
            self.X_train = X_train_s.T
            self.X_test = X_test_s.T
            self.y_train = y_train_s.reshape(1, -1)
            self.y_test = y_test_s.reshape(1, -1)

            print("[NN Class] Data preprocessed and split.")
            return self.df_raw # Return original DataFrame

        except FileNotFoundError as e:
            print(f"[NN Class] Error loading dataset: {e}")
            raise
        except Exception as e:
            print(f"[NN Class] Error during data processing: {e}")
            raise

    # --- ADD get_eda_stats ---
    def get_eda_stats(self, df):
        """Calculates statistics and generates plots for EDA."""
        if df is None or df.empty:
            raise ValueError("DataFrame is empty or not loaded for EDA.")
        try:
            print("[NN Class] Generating EDA stats...")
            stats = {
                'total_samples': len(df),
                'placement_rate': df['placement'].mean() * 100,
                'train_test_split': '80/20',
                'features': {
                    'cgpa': df['cgpa'].describe().to_dict(), # Use describe() for common stats
                    'iq': df['iq'].describe().to_dict()
                },
                'correlation_cgpa_iq': df['cgpa'].corr(df['iq']),
            }
            # Clean up describe() output if needed (e.g., remove count/percentiles if redundant)
            for feature in ['cgpa', 'iq']:
                stats['features'][feature].pop('count', None)
                stats['features'][feature].pop('25%', None)
                stats['features'][feature].pop('50%', None)
                stats['features'][feature].pop('75%', None)


            plots = {}
            plt.style.use('seaborn-v0_8-darkgrid')

            # CGPA Histogram
            fig1 = plt.figure(figsize=(8, 5))
            sns.histplot(df['cgpa'], bins=10, kde=True, color='skyblue')
            plt.title('CGPA Distribution')
            plt.xlabel('CGPA')
            plt.ylabel('Frequency')
            plt.tight_layout()
            buffer_cgpa = BytesIO()
            fig1.savefig(buffer_cgpa, format='png', dpi=90)
            buffer_cgpa.seek(0)
            plots['cgpa_hist'] = base64.b64encode(buffer_cgpa.getvalue()).decode('utf-8')
            plt.close(fig1)

            # IQ Histogram
            fig2 = plt.figure(figsize=(8, 5))
            sns.histplot(df['iq'], bins=15, kde=True, color='salmon')
            plt.title('IQ Distribution')
            plt.xlabel('IQ Score')
            plt.ylabel('Frequency')
            plt.tight_layout()
            buffer_iq = BytesIO()
            fig2.savefig(buffer_iq, format='png', dpi=90)
            buffer_iq.seek(0)
            plots['iq_hist'] = base64.b64encode(buffer_iq.getvalue()).decode('utf-8')
            plt.close(fig2)

            # Scatter Plot
            fig3 = plt.figure(figsize=(8, 6))
            sns.scatterplot(x='cgpa', y='iq', hue='placement', data=df, palette=['red', 'green'], s=70, alpha=0.7)
            plt.title('Placement based on CGPA and IQ')
            plt.xlabel('CGPA')
            plt.ylabel('IQ Score')
            plt.legend(title='Placement (0=No, 1=Yes)')
            plt.tight_layout()
            buffer_scatter = BytesIO()
            fig3.savefig(buffer_scatter, format='png', dpi=90)
            buffer_scatter.seek(0)
            plots['scatter_plot'] = base64.b64encode(buffer_scatter.getvalue()).decode('utf-8')
            plt.close(fig3)

            print("[NN Class] EDA stats and plots generated.")
            return stats, plots

        except Exception as e:
            print(f"[NN Class] Error generating EDA stats/plots: {e}")
            raise


    # --- Keep your existing sigmoid, compute_loss, forward, backward, update_parameters ---
    # (Ensure sigmoid returns only A, add clipping in compute_loss)
    def sigmoid(self, Z):
        A = 1 / (1 + np.exp(-np.clip(Z, -500, 500))) # Add clipping
        # Return ONLY A unless Z is explicitly needed elsewhere
        # return A, Z
        return A

    def compute_loss(self, A, Y):
        m = Y.shape[1]
        epsilon = 1e-15
        A_clipped = np.clip(A, epsilon, 1 - epsilon) # Add clipping
        loss = -1/m * np.sum(Y * np.log(A_clipped) + (1 - Y) * np.log(1 - A_clipped))
        return np.squeeze(loss)

    def forward(self, X):
        # Your existing code (ensure sigmoid call is correct)
        cache = {'A0': X}
        A = X
        for i in range(1, len(self.layers)):
            W = self.parameters['W' + str(i)]
            b = self.parameters['b' + str(i)]
            Z = np.dot(W, A) + b
            A = self.sigmoid(Z) # Corrected call
            cache['Z' + str(i)] = Z
            cache['A' + str(i)] = A
        return A, cache

    def backward(self, Y, cache):
         # Your existing backward pass logic (verify against math if needed)
         # Looks generally correct for your structure, but careful testing is good
        grads = {}
        m = Y.shape[1]
        L = len(self.layers) - 1

        A_L = cache['A' + str(L)]
        A_prev = cache['A' + str(L-1)]
        dZ = A_L - Y # Correct for sigmoid + binary cross entropy

        grads['dW' + str(L)] = (1/m) * np.dot(dZ, A_prev.T)
        grads['db' + str(L)] = (1/m) * np.sum(dZ, axis=1, keepdims=True)

        dA_prev = np.dot(self.parameters['W' + str(L)].T, dZ)

        for i in range(L - 1, 0, -1):
            A_curr = cache['A' + str(i)]
            A_prev_loop = cache['A' + str(i-1)]
            Z_curr = cache['Z' + str(i)]
            W_curr = self.parameters['W' + str(i)]

            sigmoid_derivative = A_curr * (1 - A_curr) # Derivative of sigmoid
            dZ = dA_prev * sigmoid_derivative # Element-wise product

            grads['dW' + str(i)] = (1/m) * np.dot(dZ, A_prev_loop.T)
            grads['db' + str(i)] = (1/m) * np.sum(dZ, axis=1, keepdims=True)

            if i > 1:
                dA_prev = np.dot(W_curr.T, dZ) # Update dA_prev for next loop iteration

        return grads


    def update_parameters(self, grads):
        # Your existing code
        for i in range(1, len(self.layers)):
            self.parameters['W' + str(i)] -= self.learning_rate * grads['dW' + str(i)]
            self.parameters['b' + str(i)] -= self.learning_rate * grads['db' + str(i)]

