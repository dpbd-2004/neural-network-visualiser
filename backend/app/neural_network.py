import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import seaborn as sns
import json
import os
from io import BytesIO
import base64
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from scipy.ndimage import gaussian_filter

class NeuralNetwork:
    def __init__(self):
        self.parameters = None
        self.scaler = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        # Fixed architecture: 2 input, 2 hidden, 1 output as per original implementation
        self.layer_dimensions = [2, 2, 1]
        self.training_history = {
            'loss': [],
            'accuracy': [],
            'weights': [],
            'biases': [],
            'decision_boundaries': []
        }
        
    def load_and_preprocess_data(self, filepath=None):
        # If filepath is not provided, use the local directory
        if filepath is None:
            # Get the current file's directory (which is backend/app)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Look for the dataset in the same directory
            filepath = os.path.join(current_dir, 'placement-dataset.csv')
            
        # Log the path being used
        print(f"Loading data from: {filepath}")
            
        # Load the dataset
        df = pd.read_csv(filepath)
        
        # Preprocess data
        X = df[['cgpa', 'iq']].values
        y = df['placement'].values

        # Scale the features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Split into training and testing sets
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42)
        
        return df
    
    def get_eda_stats(self, df):
        # Calculate basic statistics
        stats = {
            'total_samples': len(df),
            'placement_rate': df['placement'].mean() * 100,
            'train_test_split': '80/20',
            'features': {
                'cgpa': {
                    'mean': df['cgpa'].mean(),
                    'median': df['cgpa'].median(),
                    'min': df['cgpa'].min(),
                    'max': df['cgpa'].max()
                },
                'iq': {
                    'mean': df['iq'].mean(),
                    'median': df['iq'].median(),
                    'min': df['iq'].min(),
                    'max': df['iq'].max()
                }
            }
        }
        
        # Generate plots
        plots = {}
        
        # CGPA histogram
        plt.figure(figsize=(10, 6))
        sns.histplot(df['cgpa'], bins=10, kde=True)
        plt.title('CGPA Distribution')
        plt.xlabel('CGPA')
        plt.ylabel('Frequency')
        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        plots['cgpa_hist'] = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        # IQ histogram
        plt.figure(figsize=(10, 6))
        sns.histplot(df['iq'], bins=15, kde=True)
        plt.title('IQ Distribution')
        plt.xlabel('IQ Score')
        plt.ylabel('Frequency')
        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        plots['iq_hist'] = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        # Scatter plot
        plt.figure(figsize=(10, 6))
        sns.scatterplot(x='cgpa', y='iq', hue='placement', data=df, palette=['red', 'green'])
        plt.title('Placement based on CGPA and IQ')
        plt.xlabel('CGPA')
        plt.ylabel('IQ Score')
        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        plots['scatter_plot'] = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        return stats, plots
    
    def initialize_parameters(self):
        # Initialize with fixed architecture as per original implementation
        np.random.seed(3)
        parameters = {}
        
        # Use the EXACT same initialization as in backpropagartion_scratch_classification.py
        # Initialize W1 with shape (input_size, hidden_size) and W2 with shape (hidden_size, output_size)
        # This differs from our previous implementation but matches the original code
        parameters['W1'] = np.random.randn(2, 2) * 0.01
        parameters['b1'] = np.zeros((2, 1))
        parameters['W2'] = np.random.randn(2, 1) * 0.01
        parameters['b2'] = np.zeros((1, 1))
        
        # Print parameter shapes for debugging
        print(f"W1 shape: {parameters['W1'].shape}")
        print(f"b1 shape: {parameters['b1'].shape}")
        print(f"W2 shape: {parameters['W2'].shape}")
        print(f"b2 shape: {parameters['b2'].shape}")
        
        self.parameters = parameters
        return parameters
    
    def sigmoid(self, Z):
        return 1 / (1 + np.exp(-Z))
    
    def L_layer_forward(self, X):
        """
        Forward propagation using the specific implementation from the original code.
        X: input sample (2x1)
        """
        A1 = X  # Initial activation is the input
        
        # Layer 1 (input → hidden)
        W1 = self.parameters['W1']
        b1 = self.parameters['b1']
        Z1 = np.dot(W1.T, A1) + b1  # Z1 = W1^T * X + b1
        A2 = self.sigmoid(Z1)       # A2 = sigmoid(Z1)
        
        # Layer 2 (hidden → output)
        W2 = self.parameters['W2']
        b2 = self.parameters['b2']
        Z2 = np.dot(W2.T, A2) + b2  # Z2 = W2^T * A2 + b2
        A3 = self.sigmoid(Z2)       # A3 = sigmoid(Z2)
        
        cache = {
            'A1': A1,
            'Z1': Z1,
            'A2': A2,
            'Z2': Z2,
            'A3': A3
        }
        
        return A3, cache
    
    def compute_cost(self, y, y_hat):
        """
        Compute binary cross-entropy loss.
        y: true label (0 or 1)
        y_hat: predicted probability
        """
        epsilon = 1e-15  # Small value to avoid log(0)
        y_hat = np.clip(y_hat, epsilon, 1 - epsilon)  # Clip to avoid numerical issues
        loss = -y * np.log(y_hat) - (1 - y) * np.log(1 - y_hat)
        return loss
    
    def update_parameters(self, parameters, y, y_hat, A1, X, learning_rate=0.01):
        """
        Using the exact formulas from the original implementation in backpropagartion_scratch_classification.py
        """
        # Output layer (layer 2) updates
        # Gradient of loss w.r.t output
        dZ2 = y_hat - y

        # Update output layer weights and bias using original implementation
        parameters['W2'][0][0] -= learning_rate * dZ2 * A1[0][0]
        parameters['W2'][1][0] -= learning_rate * dZ2 * A1[1][0]
        parameters['b2'][0][0] -= learning_rate * dZ2

        # Hidden layer (layer 1) updates - follow original implementation exactly
        # For neuron 1 in hidden layer
        grad_hidden1 = dZ2 * parameters['W2'][0][0] * A1[0][0] * (1 - A1[0][0])
        parameters['W1'][0][0] -= learning_rate * grad_hidden1 * X[0][0]
        parameters['W1'][0][1] -= learning_rate * grad_hidden1 * X[1][0]
        parameters['b1'][0][0] -= learning_rate * grad_hidden1

        # For neuron 2 in hidden layer
        grad_hidden2 = dZ2 * parameters['W2'][1][0] * A1[1][0] * (1 - A1[1][0])
        parameters['W1'][1][0] -= learning_rate * grad_hidden2 * X[0][0]
        parameters['W1'][1][1] -= learning_rate * grad_hidden2 * X[1][0]
        parameters['b1'][1][0] -= learning_rate * grad_hidden2

        return parameters
    
    def predict(self, X):
        """
        Make predictions for multiple samples.
        X: input features with shape (n_features, n_samples)
        """
        m = X.shape[1]
        predictions = np.zeros((1, m))
        
        for i in range(m):
            x_i = X[:, i:i+1]  # Get one sample
            A3, _ = self.L_layer_forward(x_i)
            predictions[0, i] = 1 if A3[0, 0] >= 0.5 else 0
        
        return predictions
    
    def calculate_accuracy(self, predictions, Y):
        return np.mean(predictions[0] == Y)
    
    def generate_decision_boundary(self, X, Y):
        # Create a meshgrid
        h = 0.01  # Smaller step size for smoother boundary
        x_min, x_max = X[0, :].min() - 1, X[0, :].max() + 1
        y_min, y_max = X[1, :].min() - 1, X[1, :].max() + 1
        xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))
        
        # Reshape and make predictions
        Z = np.zeros((yy.shape[0], xx.shape[1]))
        
        # For a cleaner boundary, we'll use a vectorized approach and smoothing
        grid_points = np.vstack([xx.ravel(), yy.ravel()])
        
        # Make predictions for all points at once
        predictions = np.zeros(grid_points.shape[1])
        
        # Process in batches to avoid memory issues
        batch_size = 10000
        for i in range(0, grid_points.shape[1], batch_size):
            end_idx = min(i + batch_size, grid_points.shape[1])
            batch = grid_points[:, i:end_idx]
            predictions[i:end_idx] = self.predict(batch)[0, :]
        
        # Reshape predictions back to grid
        Z = predictions.reshape(xx.shape)
        
        # Apply slight smoothing for a smoother boundary using Gaussian filter
        Z = gaussian_filter(Z, sigma=0.5)
        
        # Generate plot with modern tech styling
        plt.figure(figsize=(10, 8), facecolor='black')
        plt.rcParams.update({
            'axes.facecolor': 'black',
            'axes.edgecolor': 'white',
            'axes.labelcolor': 'white',
            'xtick.color': 'white',
            'ytick.color': 'white',
            'text.color': 'white',
            'figure.facecolor': 'black',
            'grid.color': '#444444'
        })
        
        # Use a tech-themed colormap
        cmap = plt.cm.RdBu
        contour = plt.contourf(xx, yy, Z, alpha=0.7, cmap=cmap, levels=np.linspace(0, 1, 20))
        
        # Add contour lines for a clearer boundary
        boundary_contour = plt.contour(xx, yy, Z, levels=[0.5], colors='white', linewidths=2)
        
        # Plot training points with glowing effect
        pos_samples = np.where(Y == 1)[0]
        neg_samples = np.where(Y == 0)[0]
        
        # Create scatter plots with better visibility
        plt.scatter(X[0, pos_samples], X[1, pos_samples], c='#00ff88', 
                    label='Placed', edgecolors='white', s=70, alpha=0.8, linewidth=1.5)
        plt.scatter(X[0, neg_samples], X[1, neg_samples], c='#ff5566', 
                    label='Not Placed', edgecolors='white', s=70, alpha=0.8, linewidth=1.5)
        
        # Add a light grid
        plt.grid(True, linestyle='--', alpha=0.3)
        
        plt.title('Decision Boundary', fontsize=16, fontweight='bold')
        plt.xlabel('Normalized CGPA', fontsize=12)
        plt.ylabel('Normalized IQ', fontsize=12)
        plt.legend(frameon=True, facecolor='black', edgecolor='white')
        
        # Tighten layout and add padding
        plt.tight_layout(pad=2.0)
        
        # Save figure with high DPI for better quality
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        boundary_img = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close()
        
        return boundary_img
    
    def train(self, learning_rate=0.01, epochs=100, callback=None):
        """
        Train the neural network using the specific implementation from original code.
        """
        # Initialize parameters if not already initialized
        if self.parameters is None:
            self.initialize_parameters()
        else:
            print("Using existing parameters:")
            for key, value in self.parameters.items():
                print(f"{key} shape: {value.shape}")
        
        m = self.X_train.shape[0]
        X = self.X_train.T  # Transpose to (n_features, n_samples)
        Y = self.y_train  # Shape: (n_samples,)
        
        # Reset training history
        self.training_history = {
            'loss': [],
            'accuracy': [],
            'weights': [],
            'biases': [],
            'decision_boundaries': []
        }
        
        epoch_loss = 0
        epoch_acc = 0
        
        # Generate initial decision boundary and immediately send status
        if callback:
            # Print initial parameter values for debugging
            print("Initial parameters before training:")
            for key, value in self.parameters.items():
                print(f"{key}:\n{value}")
            
            # Save parameters for initial state
            weights = {}
            biases = {}
            for key, value in self.parameters.items():
                if key.startswith('W'):
                    weights[key] = value.tolist()
                elif key.startswith('b'):
                    biases[key] = value.tolist()
            
            # Generate initial decision boundary
            boundary_img = self.generate_decision_boundary(X, Y)
            self.training_history['decision_boundaries'].append({
                'epoch': 0,
                'image': boundary_img
            })
            
            # Send initial status
            initial_status = {
                'epoch': 0,
                'total_epochs': epochs,
                'loss': 0.0,
                'accuracy': 0.0,
                'current_weights': weights,
                'current_biases': biases,
                'decision_boundary': self.training_history['decision_boundaries'][-1]
            }
            print("Sending initial status with weights:", weights)
            callback(initial_status)
        
        for epoch in range(epochs):
            epoch_loss = 0
            
            # Train on each example individually (as in the original implementation)
            for i in range(m):
                # Get current example
                X_i = X[:, i:i+1]  # Shape: (n_features, 1)
                y_i = Y[i]  # Single label
                
                # Forward propagation
                y_hat, cache = self.L_layer_forward(X_i)
                y_hat_value = y_hat[0][0]  # Get scalar value
                
                # Compute loss
                loss = self.compute_cost(y_i, y_hat_value)
                epoch_loss += loss
                
                # Update parameters
                self.parameters = self.update_parameters(
                    self.parameters, y_i, y_hat_value, cache['A2'], X_i, learning_rate
                )
            
            # Average loss for this epoch
            avg_loss = epoch_loss / m
            
            # Calculate accuracy on training set
            predictions = self.predict(X)
            accuracy = self.calculate_accuracy(predictions, Y)
            
            # Save history
            self.training_history['loss'].append(float(avg_loss))
            self.training_history['accuracy'].append(float(accuracy))
            
            # Save parameters
            weights = {}
            biases = {}
            for key, value in self.parameters.items():
                if key.startswith('W'):
                    weights[key] = value.tolist()
                elif key.startswith('b'):
                    biases[key] = value.tolist()
            
            self.training_history['weights'].append(weights)
            self.training_history['biases'].append(biases)
            
            # Generate decision boundary
            if epoch % 10 == 0 or epoch == epochs - 1:  # Only generate every 10 epochs to save computation
                boundary_img = self.generate_decision_boundary(X, Y)
                self.training_history['decision_boundaries'].append({
                    'epoch': epoch,
                    'image': boundary_img
                })
            
            # Callback with current progress
            if callback and (epoch % 2 == 0 or epoch == epochs - 1):
                status = {
                    'epoch': epoch + 1,
                    'total_epochs': epochs,
                    'loss': float(avg_loss),
                    'accuracy': float(accuracy),
                    'current_weights': weights,
                    'current_biases': biases,
                    'decision_boundary': self.training_history['decision_boundaries'][-1] if len(self.training_history['decision_boundaries']) > 0 else None
                }
                callback(status)
                
        return self.training_history
    
    def evaluate(self):
        X_test = self.X_test.T
        Y_test = self.y_test
        
        # Make predictions
        predictions = self.predict(X_test)
        
        # Calculate accuracy
        accuracy = self.calculate_accuracy(predictions, Y_test)
        
        # Calculate confusion matrix
        Y_flat = Y_test
        pred_flat = predictions.flatten()
        
        TP = np.sum((pred_flat == 1) & (Y_flat == 1))
        TN = np.sum((pred_flat == 0) & (Y_flat == 0))
        FP = np.sum((pred_flat == 1) & (Y_flat == 0))
        FN = np.sum((pred_flat == 0) & (Y_flat == 1))
        
        # Calculate metrics
        precision = TP / (TP + FP) if (TP + FP) > 0 else 0
        recall = TP / (TP + FN) if (TP + FN) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        results = {
            'accuracy': float(accuracy),
            'confusion_matrix': {
                'true_positives': int(TP),
                'true_negatives': int(TN),
                'false_positives': int(FP),
                'false_negatives': int(FN)
            },
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1)
        }
        
        return results
    
    def predict_single(self, cgpa, iq):
        # Scale input using the same scaler used during training
        input_data = np.array([[cgpa, iq]])
        input_scaled = self.scaler.transform(input_data)
        
        # Reshape for forward propagation
        X = input_scaled.T
        
        # Make prediction
        A3, _ = self.L_layer_forward(X)
        prediction = 1 if A3[0, 0] > 0.5 else 0
        probability = float(A3[0, 0])
        
        return {
            'prediction': int(prediction),
            'probability': probability,
            'label': 'PLACED ✅' if prediction == 1 else 'NOT PLACED ❌',
            'input': {
                'cgpa': float(cgpa),
                'iq': float(iq)
            },
            'scaled_input': {
                'cgpa': float(input_scaled[0, 0]),
                'iq': float(input_scaled[0, 1])
            }
        }
    
    def save_model(self, filepath='model.json'):
        model_data = {
            'parameters': {},
            'layer_dimensions': self.layer_dimensions,
            'scaler': {
                'mean': self.scaler.mean_.tolist(),
                'scale': self.scaler.scale_.tolist()
            }
        }
        
        # Convert parameters to list for JSON serialization
        for key, value in self.parameters.items():
            model_data['parameters'][key] = value.tolist()
        
        with open(filepath, 'w') as f:
            json.dump(model_data, f)
            
        return filepath
    
    def load_model(self, filepath='model.json'):
        with open(filepath, 'r') as f:
            model_data = json.load(f)
        
        # Set layer dimensions (should always be [2, 2, 1] for this fixed architecture)
        self.layer_dimensions = model_data['layer_dimensions']
        
        # Load parameters
        self.parameters = {}
        for key, value in model_data['parameters'].items():
            self.parameters[key] = np.array(value)
        
        # Create and setup scaler
        self.scaler = StandardScaler()
        self.scaler.mean_ = np.array(model_data['scaler']['mean'])
        self.scaler.scale_ = np.array(model_data['scaler']['scale'])
        
        return True