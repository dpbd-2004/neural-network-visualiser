import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import seaborn as sns
import json
import os
from io import BytesIO
import base64
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from matplotlib.colors import LinearSegmentedColormap

# Use a style similar to the app
plt.style.use('dark_background')
plt.rcParams.update({
    'axes.facecolor': '#1E1E1E',
    'axes.edgecolor': 'white',
    'axes.labelcolor': 'white',
    'xtick.color': 'white',
    'ytick.color': 'white',
    'text.color': 'white',
    'figure.facecolor': '#121212',
    'grid.color': '#444444'
})

class RegressionNetwork:
    def __init__(self):
        self.parameters = None
        self.scaler_X = None
        self.scaler_y = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.layer_dimensions = [2, 2, 1]  # 2 inputs, 2 hidden, 1 output
        self.training_history = {
            'loss': [],
            'r2_score': [],
            'weights': [],
            'biases': [],
            'prediction_surfaces': []
        }
        
    def load_and_preprocess_data(self, filepath=None):
        if filepath is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            filepath = os.path.join(current_dir, 'student_studytime_goout_G3_actual_hours.csv')
            
        print(f"Loading data from: {filepath}")
        df = pd.read_csv(filepath)
        
        # Drop any rows with missing values
        df = df[['studytime_hours', 'goout_hours', 'G3']].dropna()
        
        X = df[['studytime_hours', 'goout_hours']].values
        y = df[['G3']].values  # Keep as 2D array for scaler

        # Scale features (X)
        self.scaler_X = StandardScaler()
        X_scaled = self.scaler_X.fit_transform(X)

        # Scale target (y)
        self.scaler_y = StandardScaler()
        y_scaled = self.scaler_y.fit_transform(y)

        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X_scaled, y_scaled, test_size=0.2, random_state=42)
        
        return df
    
    def get_eda_stats(self, df):
        stats = {
            'total_samples': len(df),
            'train_test_split': '80/20',
            'features': {
                'studytime_hours': {
                    'mean': df['studytime_hours'].mean(),
                    'median': df['studytime_hours'].median(),
                    'min': df['studytime_hours'].min(),
                    'max': df['studytime_hours'].max()
                },
                'goout_hours': {
                    'mean': df['goout_hours'].mean(),
                    'median': df['goout_hours'].median(),
                    'min': df['goout_hours'].min(),
                    'max': df['goout_hours'].max()
                },
                'G3': {
                    'mean': df['G3'].mean(),
                    'median': df['G3'].median(),
                    'min': df['G3'].min(),
                    'max': df['G3'].max()
                }
            }
        }
        
        plots = {}
        
        # Study Time histogram
        plt.figure(figsize=(10, 6))
        sns.histplot(df['studytime_hours'], bins=15, kde=True, color='#FF5252')
        plt.title('Study Time Distribution')
        plt.xlabel('Study Time (Hours)')
        plt.ylabel('Frequency')
        buffer = BytesIO()
        plt.savefig(buffer, format='png', facecolor='#121212')
        buffer.seek(0)
        plots['studytime_hist'] = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        # Go Out histogram
        plt.figure(figsize=(10, 6))
        sns.histplot(df['goout_hours'], bins=15, kde=True, color='#FF80AB')
        plt.title('Go Out Time Distribution')
        plt.xlabel('Go Out Time (Hours)')
        plt.ylabel('Frequency')
        buffer = BytesIO()
        plt.savefig(buffer, format='png', facecolor='#121212')
        buffer.seek(0)
        plots['goout_hist'] = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        # Scatter plot
        plt.figure(figsize=(10, 6))
        sns.scatterplot(x='studytime_hours', y='goout_hours', hue='G3', data=df, palette='Reds', s=100, alpha=0.7)
        plt.title('Grade based on Study vs. Go Out Time')
        plt.xlabel('Study Time (Hours)')
        plt.ylabel('Go Out Time (Hours)')
        buffer = BytesIO()
        plt.savefig(buffer, format='png', facecolor='#121212')
        buffer.seek(0)
        plots['scatter_plot'] = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        return stats, plots
    
    def initialize_parameters(self):
        np.random.seed(3)
        parameters = {}
        parameters['W1'] = np.random.randn(2, 2) * 0.01
        parameters['b1'] = np.zeros((2, 1))
        parameters['W2'] = np.random.randn(2, 1) * 0.01
        parameters['b2'] = np.zeros((1, 1))
        
        self.parameters = parameters
        return parameters
    
    def sigmoid(self, Z):
        return 1 / (1 + np.exp(-Z))

    # --- NEW: Add ReLU activation function ---
    def relu(self, Z):
        return np.maximum(0, Z)

    # --- NEW: Add ReLU derivative (for backpropagation) ---
    def relu_backward(self, Z):
        # dReLU/dZ is 1 if Z > 0, 0 otherwise
        dZ = np.zeros_like(Z)
        dZ[Z > 0] = 1
        return dZ
    
    def linear_activation(self, Z):
        # No activation for regression output
        return Z
    
    def L_layer_forward(self, X):
        A1 = X
        
        W1 = self.parameters['W1']
        b1 = self.parameters['b1']
        Z1 = np.dot(W1.T, A1) + b1
        # --- MODIFIED: Use ReLU for hidden layer ---
        A2 = self.relu(Z1)  # Was self.sigmoid(Z1)
        
        W2 = self.parameters['W2']
        b2 = self.parameters['b2']
        Z2 = np.dot(W2.T, A2) + b2
        A3 = self.linear_activation(Z2)  # Linear in output layer
        
        cache = {'A1': A1, 'Z1': Z1, 'A2': A2, 'Z2': Z2, 'A3': A3}
        return A3, cache
    
    def compute_cost_mse(self, y, y_hat):
        """
        Computes the cost for a SINGLE sample (y and y_hat are scalars)
        This is the 1/2 * (y_hat - y)^2 part of the MSE.
        The "mean" (1/m) and "sum" are handled in the training loop.
        """
        cost = 0.5 * np.square(y_hat - y)
        return np.squeeze(cost)
    
    # --- MODIFIED: Changed signature from A2 to Z1 ---
    def update_parameters_regression(self, y, y_hat, Z1, X, learning_rate=0.01):
        # y and y_hat are scalars
        
        # --- MODIFIED: Need A2 for W2 update, get it from Z1 ---
        A2 = self.relu(Z1)

        # Output layer (linear activation)
        dZ2 = y_hat - y  # Derivative of 1/2*MSE w.r.t Z2
        
        # Update W2 and b2
        self.parameters['W2'][0][0] -= learning_rate * dZ2 * A2[0][0]
        self.parameters['W2'][1][0] -= learning_rate * dZ2 * A2[1][0]
        self.parameters['b2'][0][0] -= learning_rate * dZ2

        # Hidden layer (ReLU activation)
        # --- MODIFIED: Use ReLU derivative ---
        d_activation = self.relu_backward(Z1) # Was A2 * (1 - A2)
        
        # Neuron 1
        # --- MODIFIED: Use d_activation ---
        grad_hidden1 = dZ2 * self.parameters['W2'][0][0] * d_activation[0][0]
        self.parameters['W1'][0][0] -= learning_rate * grad_hidden1 * X[0][0]
        self.parameters['W1'][0][1] -= learning_rate * grad_hidden1 * X[1][0]
        self.parameters['b1'][0][0] -= learning_rate * grad_hidden1

        # Neuron 2
        # --- MODIFIED: Use d_activation ---
        grad_hidden2 = dZ2 * self.parameters['W2'][1][0] * d_activation[1][0]
        self.parameters['W1'][1][0] -= learning_rate * grad_hidden2 * X[0][0]
        self.parameters['W1'][1][1] -= learning_rate * grad_hidden2 * X[1][0]
        self.parameters['b1'][1][0] -= learning_rate * grad_hidden2
    
    def predict(self, X):
        # X shape is (n_features, n_samples)
        m = X.shape[1]
        predictions_scaled = np.zeros((1, m))
        
        for i in range(m):
            x_i = X[:, i:i+1]
            A3, _ = self.L_layer_forward(x_i)
            predictions_scaled[0, i] = A3[0, 0]
        
        return predictions_scaled.T  # Return as (n_samples, 1)

    def calculate_r2(self, y_true_scaled, y_pred_scaled):
        # Inverse transform to original scale for meaningful R2
        y_true = self.scaler_y.inverse_transform(y_true_scaled)
        y_pred = self.scaler_y.inverse_transform(y_pred_scaled)
        return r2_score(y_true, y_pred)

    def generate_prediction_surface(self, X_scaled_train, Y_scaled_train):
        """
        Generates two 2D "best-fit line" plots (Partial Dependence Plots)
        and returns them as a single image.
        """
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7), facecolor='#121212')
        fig.suptitle('Neural Network Best-Fit Lines (Partial Dependence)', fontsize=16, y=1.02)
        
        # --- Inverse transform data for plotting ---
        X_orig_train = self.scaler_X.inverse_transform(X_scaled_train.T)
        Y_orig_train = self.scaler_y.inverse_transform(Y_scaled_train)

        # Get mean values (in scaled space) for constant features
        x1_scaled_mean = np.mean(X_scaled_train[0, :])
        x2_scaled_mean = np.mean(X_scaled_train[1, :])
        
        # --- Plot 1: Study Time vs. Grade ---
        ax1.set_facecolor('#1E1E1E')
        # Scatter plot of actual data
        ax1.scatter(X_orig_train[:, 0], Y_orig_train.flatten(), c='#FF80AB', alpha=0.3, label='Actual Data')
        
        # Create X-axis range for the line (scaled)
        x1_range_scaled = np.linspace(X_scaled_train[0, :].min(), X_scaled_train[0, :].max(), 50)
        # Create test grid (StudyTime varies, GoOut is held at mean)
        test_grid_1 = np.array([x1_range_scaled, np.full_like(x1_range_scaled, x2_scaled_mean)])
        
        # Predict and inverse transform
        predictions_1_scaled = self.predict(test_grid_1)
        predictions_1_orig = self.scaler_y.inverse_transform(predictions_1_scaled)
        x1_range_orig = self.scaler_X.inverse_transform(test_grid_1.T)[:, 0] # Get original study time
        
        # Plot the best-fit line
        ax1.plot(x1_range_orig, predictions_1_orig.flatten(), color='#FF5252', linewidth=3, label='NN Best-Fit Line')
        
        ax1.set_xlabel('Study Time (Hours)', labelpad=10)
        ax1.set_ylabel('Final Grade (G3)', labelpad=10)
        ax1.set_title('Grade vs. Study Time\n(holding Go Out Time at average)')
        ax1.grid(True, color='#444444', linestyle='--', alpha=0.5)
        ax1.legend()

        # --- Plot 2: Go Out Time vs. Grade ---
        ax2.set_facecolor('#1E1E1E')
        # Scatter plot of actual data
        ax2.scatter(X_orig_train[:, 1], Y_orig_train.flatten(), c='#FF80AB', alpha=0.3, label='Actual Data')
        
        # Create X-axis range for the line (scaled)
        x2_range_scaled = np.linspace(X_scaled_train[1, :].min(), X_scaled_train[1, :].max(), 50)
        # Create test grid (StudyTime is held at mean, GoOut varies)
        test_grid_2 = np.array([np.full_like(x2_range_scaled, x1_scaled_mean), x2_range_scaled])
        
        # Predict and inverse transform
        predictions_2_scaled = self.predict(test_grid_2)
        predictions_2_orig = self.scaler_y.inverse_transform(predictions_2_scaled)
        x2_range_orig = self.scaler_X.inverse_transform(test_grid_2.T)[:, 1] # Get original go out time
        
        # Plot the best-fit line
        ax2.plot(x2_range_orig, predictions_2_orig.flatten(), color='#FF5252', linewidth=3, label='NN Best-Fit Line')
        
        ax2.set_xlabel('Go Out Time (Hours)', labelpad=10)
        ax2.set_ylabel('Final Grade (G3)', labelpad=10)
        ax2.set_title('Grade vs. Go Out Time\n(holding Study Time at average)')
        ax2.grid(True, color='#444444', linestyle='--', alpha=0.5)
        ax2.legend()
        
        # --- Save to buffer (Same as before) ---
        plt.tight_layout()
        buffer = BytesIO()
        plt.savefig(buffer, format='png', facecolor='#121212', bbox_inches='tight')
        buffer.seek(0)
        surface_img = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        
        return surface_img

    def train(self, learning_rate=0.01, epochs=100, callback=None):
        if self.parameters is None:
            self.initialize_parameters()
        
        m = self.X_train.shape[0]
        X = self.X_train.T  # (n_features, n_samples)
        Y = self.y_train.T  # (1, n_samples)
        
        self.training_history = { 'loss': [], 'r2_score': [], 'weights': [], 'biases': [], 'prediction_surfaces': [] }
        
        # Initial state callback
        if callback:
            weights, biases = {}, {}
            for key, value in self.parameters.items():
                if key.startswith('W'): weights[key] = value.tolist()
                elif key.startswith('b'): biases[key] = value.tolist()
            
            surface_img = self.generate_prediction_surface(X, Y.T) # Use new 2D plot function
            self.training_history['prediction_surfaces'].append({'epoch': 0, 'image': surface_img})
            
            initial_status = {
                'epoch': 0, 'total_epochs': epochs, 'loss': 0.0, 'r2_score': 0.0,
                'current_weights': weights, 'current_biases': biases,
                'prediction_surface': self.training_history['prediction_surfaces'][-1]
            }
            callback(initial_status)
        
        for epoch in range(epochs):
            epoch_loss = 0
            
            for i in range(m):
                X_i = X[:, i:i+1]
                y_i = Y[0, i] # y_i is a scalar
                
                y_hat, cache = self.L_layer_forward(X_i)
                y_hat_value = y_hat[0, 0] # y_hat_value is a scalar
                
                loss = self.compute_cost_mse(y_i, y_hat_value) # Pass scalars
                epoch_loss += loss
                
                # --- MODIFIED: Pass cache['Z1'] for ReLU backprop ---
                self.update_parameters_regression(
                    y_i, y_hat_value, cache['Z1'], X_i, learning_rate
                )
            
            avg_loss = epoch_loss / m
            
            # Calculate R2 score on training set
            predictions_scaled = self.predict(X)
            r2 = self.calculate_r2(Y.T, predictions_scaled)
            
            self.training_history['loss'].append(float(avg_loss))
            self.training_history['r2_score'].append(float(r2))
            
            weights, biases = {}, {}
            for key, value in self.parameters.items():
                if key.startswith('W'): weights[key] = value.tolist()
                elif key.startswith('b'): biases[key] = value.tolist()
            
            self.training_history['weights'].append(weights)
            self.training_history['biases'].append(biases)
            
            if epoch % 10 == 0 or epoch == epochs - 1:
                surface_img = self.generate_prediction_surface(X, Y.T) # Use new 2D plot function
                self.training_history['prediction_surfaces'].append({'epoch': epoch, 'image': surface_img})
            
            if callback and (epoch % 2 == 0 or epoch == epochs - 1):
                status = {
                    'epoch': epoch + 1, 'total_epochs': epochs,
                    'loss': float(avg_loss), 'r2_score': float(r2),
                    'current_weights': weights, 'current_biases': biases,
                    'prediction_surface': self.training_history['prediction_surfaces'][-1]
                }
                callback(status)
                
        return self.training_history
    
    def evaluate(self):
        X_test_T = self.X_test.T
        
        predictions_scaled = self.predict(X_test_T)
        r2 = self.calculate_r2(self.y_test, predictions_scaled)
        
        # Calculate loss (MSE) on test set (using scaled values)
        # This needs to handle arrays, so we can't use the single-sample compute_cost_mse
        test_loss = (1 / (2 * self.y_test.shape[0])) * np.sum(np.square(predictions_scaled - self.y_test))
        
        # Calculate Mean Absolute Error (MAE)
        y_test_orig = self.scaler_y.inverse_transform(self.y_test)
        predictions_orig = self.scaler_y.inverse_transform(predictions_scaled)
        mae = np.mean(np.abs(y_test_orig - predictions_orig))
        
        results = {
            'r2_score': float(r2),
            'loss_mse': float(test_loss),
            'mean_absolute_error': float(mae)
        }
        return results
    
    def predict_single(self, studytime, goout):
        if self.scaler_X is None or self.scaler_y is None:
            raise ValueError("Scalers are not initialized. Please train or load a model.")
            
        input_data = np.array([[studytime, goout]])
        input_scaled = self.scaler_X.transform(input_data)
        
        X = input_scaled.T
        
        A3_scaled, _ = self.L_layer_forward(X)
        prediction_scaled = A3_scaled[0, 0]
        
        # Inverse transform the prediction
        prediction_orig = self.scaler_y.inverse_transform([[prediction_scaled]])[0][0]
        
        return {
            'prediction': float(prediction_orig),
            'prediction_label': f'Predicted Grade: {prediction_orig:.1f}',
            'input': { 'studytime_hours': float(studytime), 'goout_hours': float(goout) },
            'scaled_input': { 'studytime_hours': float(input_scaled[0, 0]), 'goout_hours': float(input_scaled[0, 1]) }
        }
    
    def save_model(self, filepath='model_regression.json'):
        model_data = {
            'parameters': {},
            'layer_dimensions': self.layer_dimensions,
            'scaler_X': { 'mean': self.scaler_X.mean_.tolist(), 'scale': self.scaler_X.scale_.tolist() },
            'scaler_y': { 'mean': self.scaler_y.mean_.tolist(), 'scale': self.scaler_y.scale_.tolist() }
        }
        for key, value in self.parameters.items():
            model_data['parameters'][key] = value.tolist()
        
        with open(filepath, 'w') as f:
            json.dump(model_data, f)
        return filepath
    
    def load_model(self, filepath='model_regression.json'):
        with open(filepath, 'r') as f:
            model_data = json.load(f)
        
        self.layer_dimensions = model_data['layer_dimensions']
        self.parameters = {}
        for key, value in model_data['parameters'].items():
            self.parameters[key] = np.array(value)
        
        self.scaler_X = StandardScaler()
        self.scaler_X.mean_ = np.array(model_data['scaler_X']['mean'])
        self.scaler_X.scale_ = np.array(model_data['scaler_X']['scale'])
        
        self.scaler_y = StandardScaler()
        self.scaler_y.mean_ = np.array(model_data['scaler_y']['mean'])
        self.scaler_y.scale_ = np.array(model_data['scaler_y']['scale'])
        
        return True