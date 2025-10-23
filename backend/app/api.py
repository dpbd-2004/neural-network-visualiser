from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import threading
import time
import logging
from werkzeug.utils import secure_filename

from .neural_network import NeuralNetwork

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize global variables
nn = NeuralNetwork()
df = None
training_thread = None
training_status = {
    'is_training': False,
    'epoch': 0,
    'total_epochs': 0,
    'loss': 0,
    'accuracy': 0,
    'progress_percentage': 0,
    'current_weights': {},
    'current_biases': {},
    'decision_boundary': None
}

# Ensure necessary directories exist
os.makedirs('backend/static/models', exist_ok=True)
os.makedirs('backend/static/sessions', exist_ok=True)

# Callback function for training
def training_callback(status):
    global training_status
    training_status.update(status)
    training_status['progress_percentage'] = (status['epoch'] / status['total_epochs']) * 100
    
    # Save current status to a session file
    session_id = training_status.get('session_id')
    if session_id:
        with open(f'backend/static/sessions/{session_id}_partial.json', 'w') as f:
            json.dump(training_status, f)

@app.route('/api/eda', methods=['GET'])
def get_eda():
    global df, nn
    
    try:
        # Load and preprocess data if not already done
        if df is None:
            df = nn.load_and_preprocess_data()
        
        # Get EDA stats and plots
        stats, plots = nn.get_eda_stats(df)
        
        return jsonify({
            'success': True,
            'data': {
                'stats': stats,
                'plots': plots
            }
        })
    except Exception as e:
        logger.error(f"Error in EDA endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error processing data: {str(e)}"
        }), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    global training_thread, training_status, nn, df
    
    # Check if already training
    if training_status['is_training']:
        return jsonify({
            'success': False,
            'message': 'A training session is already in progress'
        })
    
    # Get hyperparameters from request
    data = request.json
    learning_rate = float(data.get('learning_rate', 0.01))
    epochs = int(data.get('epochs', 100))
    
    # Generate a unique session ID
    session_id = str(int(time.time()))
    
    # Load and preprocess data if not already done
    if df is None:
        df = nn.load_and_preprocess_data()
    
    # Initialize parameters - architecture is fixed at [2, 2, 1]
    nn.initialize_parameters()
    
    # Convert parameters to JSON-serializable format
    initial_weights = {}
    initial_biases = {}
    for key, value in nn.parameters.items():
        if key.startswith('W'):
            initial_weights[key] = value.tolist()
        elif key.startswith('b'):
            initial_biases[key] = value.tolist()
    
    # Update training status
    training_status = {
        'is_training': True,
        'epoch': 0,
        'total_epochs': epochs,
        'loss': 0,
        'accuracy': 0,
        'progress_percentage': 0,
        'session_id': session_id,
        'hyperparameters': {
            'learning_rate': learning_rate,
            'epochs': epochs,
        },
        'current_weights': initial_weights,
        'current_biases': initial_biases,
        'decision_boundary': None
    }
    
    # Start training in a separate thread
    def train_thread():
        try:
            history = nn.train(
                learning_rate=learning_rate, 
                epochs=epochs,
                callback=training_callback
            )
            
            # When training completes
            training_status['is_training'] = False
            training_status['progress_percentage'] = 100
            
            # Save final model
            model_path = nn.save_model(f'backend/static/models/model_{session_id}.json')
            
            # Save complete training session
            with open(f'backend/static/sessions/{session_id}.json', 'w') as f:
                session_data = {
                    'session_id': session_id,
                    'hyperparameters': training_status['hyperparameters'],
                    'history': history
                }
                json.dump(session_data, f)
                
            logger.info(f"Training completed and saved: session {session_id}")
        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            training_status['is_training'] = False
            training_status['error'] = str(e)
    
    training_thread = threading.Thread(target=train_thread)
    training_thread.daemon = True
    training_thread.start()
    
    return jsonify({
        'success': True,
        'message': 'Training started',
        'session_id': session_id
    })

@app.route('/api/train/status', methods=['GET'])
def get_training_status():
    global training_status
    
    return jsonify({
        'success': True,
        'data': training_status
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    global nn
    
    # Check if model is trained
    if nn.parameters is None:
        return jsonify({
            'success': False,
            'message': 'Model not trained yet'
        })
    
    # Get input data
    data = request.json
    cgpa = float(data.get('cgpa', 0))
    iq = float(data.get('iq', 0))
    
    # Make prediction
    result = nn.predict_single(cgpa, iq)
    
    return jsonify({
        'success': True,
        'data': result
    })

@app.route('/api/evaluate', methods=['GET'])
def evaluate():
    global nn
    
    # Check if model is trained
    if nn.parameters is None:
        return jsonify({
            'success': False,
            'message': 'Model not trained yet'
        })
    
    # Evaluate on test set
    results = nn.evaluate()
    
    return jsonify({
        'success': True,
        'data': results
    })

@app.route('/api/save-model', methods=['GET'])
def save_model():
    global nn
    
    # Check if model is trained
    if nn.parameters is None:
        return jsonify({
            'success': False,
            'message': 'Model not trained yet'
        })
    
    # Save model
    filename = f"model_{int(time.time())}.json"
    filepath = nn.save_model(f'backend/static/models/{filename}')
    
    return jsonify({
        'success': True,
        'data': {
            'filename': filename,
            'download_url': f'/static/models/{filename}'
        }
    })

@app.route('/api/load-model', methods=['POST'])
def load_model():
    global nn
    
    if 'model_file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No file provided'
        })
    
    file = request.files['model_file']
    if file.filename == '':
        return jsonify({
            'success': False,
            'message': 'No file selected'
        })
    
    filename = secure_filename(file.filename)
    filepath = os.path.join('backend/static/models', filename)
    file.save(filepath)
    
    try:
        success = nn.load_model(filepath)
        return jsonify({
            'success': success,
            'message': 'Model loaded successfully' if success else 'Failed to load model'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error loading model: {str(e)}'
        })

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    sessions = []
    sessions_dir = 'backend/static/sessions'
    
    if os.path.exists(sessions_dir):
        for filename in os.listdir(sessions_dir):
            if filename.endswith('.json') and not filename.endswith('_partial.json'):
                session_id = filename.split('.')[0]
                try:
                    with open(os.path.join(sessions_dir, filename), 'r') as f:
                        session_data = json.load(f)
                        sessions.append({
                            'session_id': session_id,
                            'hyperparameters': session_data.get('hyperparameters', {}),
                            'timestamp': session_data.get('timestamp', session_id)
                        })
                except Exception as e:
                    logger.error(f"Error reading session file {filename}: {str(e)}")
    
    return jsonify({
        'success': True,
        'data': sessions
    })

@app.route('/api/replay-session/<session_id>', methods=['GET'])
def replay_session(session_id):
    session_path = f'backend/static/sessions/{session_id}.json'
    
    if not os.path.exists(session_path):
        return jsonify({
            'success': False,
            'message': 'Session not found'
        })
    
    try:
        with open(session_path, 'r') as f:
            session_data = json.load(f)
            
        return jsonify({
            'success': True,
            'data': session_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error loading session: {str(e)}'
        })

@app.route('/api/model/state', methods=['GET'])
def get_model_state():
    global nn, training_status
    
    # Initialize parameters if not already done
    if nn.parameters is None:
        nn.initialize_parameters()
    
    # Convert parameters to JSON-serializable format
    weights = {}
    biases = {}
    for key, value in nn.parameters.items():
        if key.startswith('W'):
            weights[key] = value.tolist()
        elif key.startswith('b'):
            biases[key] = value.tolist()
    
    # Include decision boundary if available
    decision_boundary = training_status.get('decision_boundary')
    
    return jsonify({
        'success': True,
        'data': {
            'weights': weights,
            'biases': biases,
            'decision_boundary': decision_boundary
        }
    })

if __name__ == '__main__':
    app.run(debug=True)