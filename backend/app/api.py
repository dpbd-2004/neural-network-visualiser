from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import threading
import time
import logging
from werkzeug.utils import secure_filename

# --- Imports for Chatbot ---
from dotenv import load_dotenv
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# --- Imports for Models ---
from .neural_network import NeuralNetwork
from .regression_network import RegressionNetwork

# --- Configure logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Load Environment Variables (for chatbot) ---
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

if not hf_token:
    logger.warning("Hugging Face API token not found. Chatbot functionality will be limited.")
    chat_model = None
else:
    try:
        llm = HuggingFaceEndpoint(
            repo_id="mistralai/Mistral-7B-Instruct-v0.2",
            task="text-generation",
            max_new_tokens=512,
            temperature=0.7,
            repetition_penalty=1.1,
            huggingfacehub_api_token=hf_token
        )
        chat_model = ChatHuggingFace(llm=llm)
        logger.info("Hugging Face Chat Model initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Hugging Face model: {e}")
        chat_model = None

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- Initialize BOTH models ---
nn_classification = NeuralNetwork()
nn_regression = RegressionNetwork()
df_classification = None
df_regression = None

# --- Create separate training status dictionaries ---
training_status_classification = { 'is_training': False }
training_status_regression = { 'is_training': False }

# Global Training thread (can only run one at a time)
training_thread = None 

# --- Helper Functions ---
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(backend_dir, 'static', 'models'), exist_ok=True)
os.makedirs(os.path.join(backend_dir, 'static', 'sessions'), exist_ok=True)

def get_static_folder_path(subfolder):
    """Gets the absolute path to a static subfolder."""
    return os.path.join(backend_dir, 'static', subfolder)

def get_model_and_status(mode):
    """Returns the correct model instance and status dict based on the mode."""
    if mode == 'regression':
        return nn_regression, training_status_regression, 'regression'
    else:
        # Default to classification
        return nn_classification, training_status_classification, 'classification'

def training_callback(status, mode):
    """Global callback for training threads to update status."""
    global training_status_classification, training_status_regression
    
    status_obj = training_status_regression if mode == 'regression' else training_status_classification
    
    # Update the status object
    status_obj.update(status)
    if status.get('total_epochs', 0) > 0:
      status_obj['progress_percentage'] = (status['epoch'] / status['total_epochs']) * 100
    
    # Save partial session file for real-time updates (if needed)
    session_id = status_obj.get('session_id')
    if session_id:
        sessions_path = get_static_folder_path('sessions')
        filepath = os.path.join(sessions_path, f'{session_id}_partial.json')
        try:
            with open(filepath, 'w') as f:
                json.dump(status_obj, f)
        except Exception as e:
            logger.error(f"Error writing partial session file {filepath}: {e}")

# --- API Endpoints (Mode-Aware) ---

@app.route('/api/eda', methods=['GET'])
def get_eda():
    """Fetches EDA stats and plots for the specified mode."""
    global df_classification, df_regression
    mode = request.args.get('mode', 'classification')
    nn_model, _, _ = get_model_and_status(mode)
    
    try:
        if mode == 'regression':
            if df_regression is None:
                dataset_path = os.path.join(os.path.dirname(__file__), 'student_studytime_goout_G3_actual_hours.csv')
                df_regression = nn_model.load_and_preprocess_data(filepath=dataset_path)
            stats, plots = nn_model.get_eda_stats(df_regression)
        else:
            if df_classification is None:
                dataset_path = os.path.join(os.path.dirname(__file__), 'placement-dataset.csv')
                df_classification = nn_model.load_and_preprocess_data(filepath=dataset_path)
            stats, plots = nn_model.get_eda_stats(df_classification)
        
        return jsonify({'success': True, 'data': {'stats': stats, 'plots': plots}})
    except Exception as e:
        logger.error(f"Error in EDA endpoint ({mode}): {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': f"Error processing data: {str(e)}"}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Starts a new training thread for the specified mode."""
    global training_thread
    global df_classification, df_regression
    
    data = request.json
    mode = data.get('mode', 'classification')
    nn_model, status_obj, mode_str = get_model_and_status(mode)
    
    # Check if any training is active
    if training_status_classification['is_training'] or training_status_regression['is_training']:
        return jsonify({'success': False, 'message': 'A training session is already in progress'})
    
    learning_rate = float(data.get('learning_rate', 0.01))
    epochs = int(data.get('epochs', 100))
    session_id = f"{str(int(time.time()))}_{mode_str}" # Mode-specific session ID
    
    # Load data if not already done
    try:
        if mode == 'regression':
            if df_regression is None:
                dataset_path = os.path.join(os.path.dirname(__file__), 'student_studytime_goout_G3_actual_hours.csv')
                df_regression = nn_model.load_and_preprocess_data(filepath=dataset_path)
        else:
            if df_classification is None:
                dataset_path = os.path.join(os.path.dirname(__file__), 'placement-dataset.csv')
                df_classification = nn_model.load_and_preprocess_data(filepath=dataset_path)
    except Exception as e:
        logger.error(f"Error loading data for training ({mode}): {e}")
        return jsonify({'success': False, 'message': f'Error loading dataset: {e}'}), 500

    nn_model.initialize_parameters()
    
    initial_weights, initial_biases = {}, {}
    for key, value in nn_model.parameters.items():
        if key.startswith('W'): initial_weights[key] = value.tolist()
        elif key.startswith('b'): initial_biases[key] = value.tolist()
    
    # Reset status object
    status_obj.clear()
    status_obj.update({
        'is_training': True, 'epoch': 0, 'total_epochs': epochs, 'loss': 0,
        'progress_percentage': 0, 'session_id': session_id,
        'hyperparameters': {'learning_rate': learning_rate, 'epochs': epochs},
        'current_weights': initial_weights, 'current_biases': initial_biases,
        'decision_boundary': None, 'prediction_surface': None
    })
    if mode == 'regression':
        status_obj['r2_score'] = 0
    else:
        status_obj['accuracy'] = 0

    def train_thread_target():
        models_path = get_static_folder_path('models')
        sessions_path = get_static_folder_path('sessions')
        
        # Local reference to the status object for this thread
        thread_status_obj = status_obj 
        
        try:
            history = nn_model.train(
                learning_rate=learning_rate, 
                epochs=epochs,
                callback=lambda status: training_callback(status, mode)
            )
            
            thread_status_obj['is_training'] = False
            thread_status_obj['progress_percentage'] = 100
            
            model_path = nn_model.save_model(os.path.join(models_path, f'model_{session_id}.json'))
            
            with open(os.path.join(sessions_path, f'{session_id}.json'), 'w') as f:
                session_data = {
                    'session_id': session_id,
                    'hyperparameters': thread_status_obj['hyperparameters'],
                    'history': history,
                    'mode': mode # Save mode with session
                }
                json.dump(session_data, f)
                
            logger.info(f"Training completed and saved: session {session_id}")
            
            partial_filepath = os.path.join(sessions_path, f'{session_id}_partial.json')
            if os.path.exists(partial_filepath):
                 os.remove(partial_filepath)
                 
        except Exception as e:
            logger.error(f"Error during training ({mode}): {str(e)}")
            thread_status_obj['is_training'] = False
            thread_status_obj['error'] = str(e)
            import traceback
            logger.error(traceback.format_exc())
    
    training_thread = threading.Thread(target=train_thread_target)
    training_thread.daemon = True
    training_thread.start()
    
    return jsonify({'success': True, 'message': 'Training started', 'session_id': session_id})

@app.route('/api/train/status', methods=['GET'])
def get_training_status():
    """Gets the training status for the specified mode."""
    mode = request.args.get('mode', 'classification')
    _, status_obj, _ = get_model_and_status(mode)
    
    return jsonify({'success': True, 'data': status_obj})

@app.route('/api/predict', methods=['POST'])
def predict():
    """Makes a prediction using the specified mode's trained model."""
    data = request.json
    mode = data.get('mode', 'classification')
    nn_model, _, _ = get_model_and_status(mode)
    
    # Check for model readiness
    if nn_model.parameters is None or (mode == 'classification' and nn_model.scaler is None) or (mode == 'regression' and (nn_model.scaler_X is None or nn_model.scaler_y is None)):
        return jsonify({'success': False, 'message': 'Model not trained yet. Please train a model on the "Training" page first.'}), 400
    
    try:
        if mode == 'regression':
            studytime = float(data.get('studytime_hours', 0))
            goout = float(data.get('goout_hours', 0))
            result = nn_model.predict_single(studytime, goout)
        else:
            cgpa = float(data.get('cgpa', 0))
            iq = float(data.get('iq', 0))
            result = nn_model.predict_single(cgpa, iq)
        
        return jsonify({'success': True, 'data': result})
    except Exception as e:
         logger.error(f"Error during prediction ({mode}): {e}")
         return jsonify({'success': False, 'message': f'Prediction error: {e}'}), 500

@app.route('/api/evaluate', methods=['GET'])
def evaluate():
    """Evaluates the model on the test set for the specified mode."""
    mode = request.args.get('mode', 'classification')
    nn_model, _, _ = get_model_and_status(mode)
    
    if nn_model.parameters is None:
        return jsonify({'success': False, 'message': 'Model not trained yet'}), 400
    
    try:
        results = nn_model.evaluate()
        return jsonify({'success': True, 'data': results})
    except Exception as e:
         logger.error(f"Error during evaluation ({mode}): {e}")
         return jsonify({'success': False, 'message': f'Evaluation error: {e}'}), 500

@app.route('/api/model/state', methods=['GET'])
def get_model_state():
    """Gets the initial state (weights/biases/plots) for the specified mode."""
    mode = request.args.get('mode', 'classification')
    nn_model, status_obj, _ = get_model_and_status(mode)

    if nn_model.parameters is None:
        nn_model.initialize_parameters()
    
    weights, biases = {}, {}
    for key, value in nn_model.parameters.items():
        if key.startswith('W'): weights[key] = value.tolist()
        elif key.startswith('b'): biases[key] = value.tolist()
    
    boundary = status_obj.get('decision_boundary')
    surface = status_obj.get('prediction_surface')
    
    return jsonify({
        'success': True,
        'data': {
            'weights': weights,
            'biases': biases,
            'decision_boundary': boundary,
            'prediction_surface': surface
        }
    })

@app.route('/api/save-model', methods=['GET'])
def save_model():
    """Saves the currently trained model for the specified mode."""
    mode = request.args.get('mode', 'classification')
    nn_model, status_obj, mode_str = get_model_and_status(mode)
    
    if nn_model.parameters is None:
        return jsonify({'success': False, 'message': 'Model not trained yet'}), 400
    
    try:
        session_id = status_obj.get('session_id', f"{int(time.time())}_{mode_str}")
        filename = f"model_{session_id}.json"
        models_path = get_static_folder_path('models')
        filepath = nn_model.save_model(os.path.join(models_path, filename))
        
        return jsonify({
            'success': True,
            'data': {
                'filename': filename,
                'download_url': f'/static/models/{filename}'
            }
        })
    except Exception as e:
        logger.error(f"Error saving model ({mode}): {e}")
        return jsonify({'success': False, 'message': f'Error saving model: {e}'}), 500

@app.route('/api/load-model', methods=['POST'])
def load_model():
    """Loads a model file, auto-detecting its mode (class/reg)."""
    global nn_classification, nn_regression
    
    if 'model_file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['model_file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    try:
        # Read file content to inspect
        model_data = json.load(file)
        
        # Auto-detect mode
        if 'scaler' in model_data:
            mode = 'classification'
            nn_model = nn_classification
        elif 'scaler_X' in model_data and 'scaler_y' in model_data:
            mode = 'regression'
            nn_model = nn_regression
        else:
            raise ValueError("Unknown model format. File must contain 'scaler' or 'scaler_X'/'scaler_y'.")
        
        # Save the file
        filename = secure_filename(file.filename)
        models_path = get_static_folder_path('models')
        filepath = os.path.join(models_path, filename)
        
        with open(filepath, 'w') as f:
            json.dump(model_data, f)
        
        success = nn_model.load_model(filepath)
        if not success:
            raise ValueError("Model loading function failed.")
        
        # Manually clear the status of the *other* model if it was training
        if mode == 'classification':
            training_status_regression.clear(); training_status_regression['is_training'] = False
        else:
            training_status_classification.clear(); training_status_classification['is_training'] = False

        return jsonify({
            'success': True,
            'message': f'{mode.capitalize()} model loaded successfully. Switch to the {mode} tab to use it.',
            'mode': mode
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error loading model: {str(e)}'}), 500

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """Lists all saved training sessions."""
    sessions = []
    sessions_dir = get_static_folder_path('sessions')
    
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
                            'timestamp': session_id.split('_')[0], # Get time from ID
                            'mode': session_data.get('mode', 'classification') # Get mode
                        })
                except Exception as e:
                    logger.error(f"Error reading session file {filename}: {str(e)}")
    
    # Sort by timestamp (newest first)
    sessions.sort(key=lambda x: int(x['timestamp']) if x['timestamp'].isdigit() else 0, reverse=True)
    
    return jsonify({'success': True, 'data': sessions})

@app.route('/api/replay-session/<session_id>', methods=['GET'])
def replay_session(session_id):
    """Fetches the data for a specific session ID."""
    session_path = os.path.join(get_static_folder_path('sessions'), f'{secure_filename(session_id)}.json')
    
    if not os.path.exists(session_path):
        return jsonify({'success': False, 'message': 'Session not found'}), 404
    
    try:
        with open(session_path, 'r') as f:
            session_data = json.load(f)
        return jsonify({'success': True, 'data': session_data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error loading session: {str(e)}'}), 500

# --- Chatbot Endpoint (Mode-Independent) ---
@app.route('/api/chat', methods=['POST'])
def chat():
    """Handles chatbot queries."""
    if not chat_model:
        logger.error("Chat model not initialized. Check Hugging Face token and setup.")
        return jsonify({'success': False, 'message': 'Chatbot is not available due to initialization error.'}), 503

    data = request.json
    user_message = data.get('message')
    if not user_message:
        return jsonify({'success': False, 'message': 'No message provided'}), 400

    try:
        template = """
        You are a helpful AI assistant knowledgeable about neural networks and deep learning, designed to answer questions within the context of the 'Neural Network Visualizer' web application.
        The application allows users to train two types of models from scratch:
        1. A binary classification model to predict student placement based on CGPA and IQ.
        2. A regression model to predict a student's final grade based on study time and social time.
        Keep your answers concise and informative.

        User: {user_input}
        AI Assistant:"""
        prompt = PromptTemplate.from_template(template)
        chain = prompt | chat_model | StrOutputParser()
        ai_response = chain.invoke({"user_input": user_message})
        
        return jsonify({'success': True, 'reply': ai_response})
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Error getting response from AI: {e}'}), 500

# This file is imported by run.py, so this check is not strictly needed
if __name__ == '__main__':
    app.run(debug=True)