from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import time
from app.neural_network import NeuralNetwork

app = Flask(__name__)
CORS(app) # This is to prevent CORS errors in the browser

@app.route('/train', methods=['POST'])
def train_model():
    data = request.get_json()
    epochs = int(data.get('epochs', 1000))
    learning_rate = float(data.get('learning_rate', 0.01))

    # --- Data Loading and Preparation ---
    dataset = pd.read_csv('app/placement-dataset.csv')
    X = dataset.iloc[:, 0:2].values.T # Transpose to get (features, examples)
    Y = dataset.iloc[:, -1].values.reshape(1, -1) # Transpose to get (1, examples)
    
    # --- Neural Network Initialization ---
    nn = NeuralNetwork(layers=[2, 2, 1], learning_rate=learning_rate)
    
    session_id = str(int(time.time()))

    # This is the core of the streaming logic
    def generate():
        for i in range(epochs):
            # Perform one step of training
            A, cache = nn.forward(X)
            grads = nn.backward(Y, cache)
            nn.update_parameters(grads)

            # After each step, send the current state to the frontend
            if i % 10 == 0: # Send update every 10 epochs
                loss = nn.compute_loss(A, Y)
                
                # Convert numpy arrays to lists for JSON serialization
                parameters_serializable = {
                    key: value.tolist() for key, value in nn.parameters.items()
                }

                response_data = {
                    'epoch': i,
                    'loss': loss,
                    'parameters': parameters_serializable
                }
                # yield is what makes this a stream. It sends a chunk of data.
                yield json.dumps(response_data) + '\n'
                time.sleep(0.01) # Small delay
    
    # Return a streaming response
    return Response(stream_with_context(generate()), mimetype='application/x-json-stream')
    #return Response(generate(), mimetype='application/json')


@app.route('/predict', methods=['POST'])
def predict():
    # This endpoint is simpler and not used in the main visualization,
    # but it's good practice to have it.
    # We will build this out later if needed.
    return jsonify({"status": "predict endpoint placeholder"})