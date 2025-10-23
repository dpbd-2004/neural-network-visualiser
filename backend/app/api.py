# backend/app/api.py
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import json
import time
import os
import logging

# Ensure correct relative import
from .neural_network import NeuralNetwork # Add the dot before neural_network

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app) # Allow frontend requests

# --- ADD THE EDA ENDPOINT ---
@app.route('/api/eda', methods=['GET'])
def get_eda():
    logger.info("Received request for /api/eda")
    try:
        # Create a temporary NN instance for EDA
        nn_eda = NeuralNetwork(layers=[2, 2, 1]) # Use default layers
        # Load data using the method (returns original df)
        df = nn_eda.load_and_preprocess_data()

        if df is None or df.empty:
             logger.error("Failed to load DataFrame for EDA.")
             return jsonify({'success': False, 'message': 'Failed to load DataFrame for EDA.'}), 500

        # Get stats and plots using the method
        stats, plots = nn_eda.get_eda_stats(df)

        logger.info("EDA data generated successfully.")
        return jsonify({
            'success': True,
            'data': {
                'stats': stats,
                'plots': plots
            }
        })
    except FileNotFoundError as e:
         logger.error(f"EDA Error - Dataset not found: {e}")
         # Provide a helpful message indicating potential file location issues
         return jsonify({
             'success': False,
             'message': f"Dataset file not found. Please ensure 'placement-dataset.csv' is correctly placed (e.g., in 'backend/app/' or project root)."
         }), 500
    except Exception as e:
        logger.error(f"Error in /api/eda endpoint: {str(e)}", exc_info=True) # Log traceback
        return jsonify({
            'success': False,
            'message': f"An error occurred during EDA processing: {str(e)}"
        }), 500

# --- UPDATE /train endpoint ---
@app.route('/train', methods=['POST'])
def train_model():
    data = request.get_json()
    epochs = int(data.get('epochs', 1000))
    learning_rate = float(data.get('learning_rate', 0.01))
    logger.info(f"Received request for /train: epochs={epochs}, lr={learning_rate}")

    try:
        # Create a new NN instance for this training run
        nn_train = NeuralNetwork(layers=[2, 2, 1], learning_rate=learning_rate)

        # !! Use the instance method to load AND preprocess data !!
        # This populates nn_train.X_train, nn_train.y_train etc.
        _ = nn_train.load_and_preprocess_data()

        # Access the preprocessed data stored in the instance
        # Ensure shapes match what forward/backward expect (features x examples)
        X_train_data = nn_train.X_train # Should be (2, num_train_examples)
        Y_train_data = nn_train.y_train # Should be (1, num_train_examples)

        if X_train_data is None or Y_train_data is None:
             logger.error("Training data (X_train or y_train) was not loaded by load_and_preprocess_data.")
             raise ValueError("Training data not loaded correctly.")
        if X_train_data.shape[1] != Y_train_data.shape[1]:
             logger.error(f"Shape mismatch after loading: X={X_train_data.shape}, Y={Y_train_data.shape}")
             raise ValueError("X_train and y_train have mismatched number of examples after loading.")


        logger.info(f"Starting training loop... X_shape={X_train_data.shape}, Y_shape={Y_train_data.shape}")
        session_id = str(int(time.time())) # Keep if needed later

        def generate():
            try:
                # Yield initial state
                initial_params = {k: v.tolist() for k, v in nn_train.parameters.items()}
                initial_loss = None
                try: # Calculate initial loss safely
                    A0, _ = nn_train.forward(X_train_data)
                    initial_loss = nn_train.compute_loss(A0, Y_train_data)
                except Exception as loss_err:
                    logger.warning(f"Could not compute initial loss: {loss_err}")

                yield json.dumps({'epoch': 0, 'loss': initial_loss, 'parameters': initial_params}) + '\n'

                for i in range(1, epochs + 1):
                    # --- Training Step ---
                    A, cache = nn_train.forward(X_train_data)
                    grads = nn_train.backward(Y_train_data, cache)
                    nn_train.update_parameters(grads)

                    # --- Stream Update ---
                    if i % 10 == 0 or i == 1 or i == epochs:
                        loss = nn_train.compute_loss(A, Y_train_data)
                        parameters_serializable = {k: v.tolist() for k, v in nn_train.parameters.items()}
                        response_data = {'epoch': i, 'loss': loss, 'parameters': parameters_serializable}
                        yield json.dumps(response_data) + '\n'
                        time.sleep(0.01)

                logger.info(f"Training stream for session {session_id} completed.")

            except Exception as e_gen:
                 logger.error(f"Error during training stream: {str(e_gen)}", exc_info=True)
                 yield json.dumps({'error': f"Training stream error: {str(e_gen)}"}) + '\n'

        return Response(stream_with_context(generate()), mimetype='application/x-json-stream')

    except FileNotFoundError as e:
         logger.error(f"Training setup Error - Dataset not found: {e}")
         return jsonify({'success': False, 'message': f"Dataset file not found during training setup."}), 500
    except Exception as e:
        logger.error(f"Error setting up /train: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f"Server error setting up training: {str(e)}"}), 500


# --- Keep your /predict endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    # Placeholder - implement later if needed.
    return jsonify({"status": "predict endpoint placeholder"})

# --- Main execution block (if running directly) ---
if __name__ == '__main__':
    # Add host='0.0.0.0' to make it accessible on your network if needed
    # debug=True reloads the server on code changes, useful for development
    app.run(debug=True, host='0.0.0.0', port=5000)