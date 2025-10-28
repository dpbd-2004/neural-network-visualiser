# Neural Network Visualizer

An interactive web application that visualizes the training and behavior of a neural network built from scratch using only NumPy. This educational tool helps you understand the inner workings of neural networks by providing real-time visualization of the training process.

### Key Visualizations

*(Note: You will need to add your own screenshots/GIFs in these sections.)*

## Exploratory Data Analysis - Knowing our Dataset
![EDA](ACTION_PLACEHOLDER_FOR_IMAGE_URL)

## Training Process
![Training](ACTION_PLACEHOLDER_FOR_IMAGE_URL)
![Training](ACTION_PLACEHOLDER_FOR_IMAGE_URL)

## Prediction Testing
![Prediction](ACTION_PLACEHOLDER_FOR_IMAGE_URL)

## AI-Powered Chatbot
![Chatbot](ACTION_PLACEHOLDER_FOR_IMAGE_URL)

## 🧠 Neural Network Architecture

This project implements a feedforward neural network with the following architecture:

Input Layer (2 neurons) → Hidden Layer (2 neurons) → Output Layer (1 neuron)


### Technical Details

- **Network Structure**: 2-2-1 feedforward neural network (2 input neurons, 2 hidden neurons, 1 output neuron)
- **Total Parameters**: 9 trainable parameters
  - Weights: 6 parameters (4 between input and hidden, 2 between hidden and output)
  - Biases: 3 parameters (2 for hidden neurons, 1 for output neuron)
- **Activation Function**: Sigmoid for all neurons
- **Loss Function**: **Mean Squared Error (MSE)**
- **Optimization**: Gradient Descent with customizable learning rate
- **Implementation**: Built from scratch using pure NumPy with no deep learning frameworks.

### Mathematical Foundation

The network performs the following computations:

1.  **Forward Propagation**:
    -   $Z = W \cdot X + b$ (linear transformation)
    -   $A = \sigma(Z)$ (sigmoid activation, where $\sigma(x) = 1/(1+e^{-x})$)

2.  **Loss Calculation**:
    -   Mean Squared Error (MSE): $L = \frac{1}{N} \sum (y - \hat{y})^2$

3.  **Backpropagation**:
    -   Compute gradients for each parameter ($\partial L / \partial W$, $\partial L / \partial b$) using the chain rule, starting from the MSE loss.
    -   Update parameters: $\theta = \theta - \alpha \cdot \partial L / \partial \theta$ (where $\alpha$ is the learning rate)

## 🔍 Overview

This application provides an end-to-end experience for:

-   **Data Exploration**: Interactive visualization of the placement dataset
-   **Model Training**: Configure and train a neural network with real-time visualization
-   **Model Testing**: Test the trained model with custom inputs
-   **Decision Boundary Visualization**: See how the model classifies the feature space
-   **AI-Powered Help**: An integrated chatbot (powered by **Hugging Face Hub**) to answer questions about the project and neural networks

All neural network computations are implemented from scratch using only NumPy, making the inner workings transparent and educational.

## 🏛️ Project Structure
```
├── backend/ # Flask backend │ ├── app/ # Application code │ │ ├── api.py # API endpoints │ │ └── neural_network.py # Neural network implementation │ │ └── placement-dataset.csv │ ├── static/ # Saved models & sessions │ ├── .env # For API keys (you must create this) │ ├── requirements.txt # Python dependencies │ └── run.py # Flask run script ├── frontend/ # React frontend │ ├── public/ │ ├── src/ │ │ ├── components/ # React components │ │ │ ├── NeuralNetworkVisualizer.tsx │ │ │ └── ChatbotWidget.tsx # AI Chatbot component │ │ ├── pages/ # Page components │ │ ├── services/ # API services │ │ └── types/ # TypeScript type definitions │ ├── package.json │ └── tsconfig.json ├── .gitignore └── README.md # This file
```

## 📊 Dataset

The application uses a placement dataset (`placement-dataset.csv`) containing:
-   `cgpa`: Cumulative Grade Point Average of students
-   `iq`: IQ scores of students
-   `placement`: Target variable (1 = placed, 0 = not placed)

The dataset must be present in the `backend/app/` directory.

## ✨ Features

### 1. Dataset Analysis
-   Interactive scatter plots and histograms
-   Statistical summaries and correlations
-   Train/test split visualization

### 2. Neural Network Training
-   Configurable learning rate and epochs
-   Real-time visualization of:
    -   Network weights (displayed on arrows, color-coded)
    -   Neuron biases (displayed inside neurons)
    -   Loss and accuracy charts
    -   Decision boundary evolution

### 3. Prediction Testing
-   Test with custom CGPA and IQ inputs
-   Visualize data flow through the network
-   Probability score with confidence indicator

### 4. AI-Powered Chatbot
-   Integrated chatbot (powered by **Hugging Face Hub**) to answer questions
-   Provides explanations on the neural network, the dataset, and the project's functionality.

## 🚀 Getting Started

### Prerequisites
-   Python 3.7+
-   Node.js 14+
-   npm or yarn
-   A **Hugging Face API Token** (for the chatbot feature)

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```

2.  Set up the backend:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

3.  **Configure API Token**:
    Create a `.env` file in the `backend/` directory. The `api.py` script uses `load_dotenv()` to read this file. Add your Hugging Face API token to it like this:
    ```
    HUGGINGFACEHUB_API_TOKEN='your_hf_token_here'
    ```

4.  Set up the frontend:
    ```bash
    cd frontend
    npm install
    ```

5.  Ensure the dataset is in place:
    -   Confirm that `placement-dataset.csv` is located inside the `backend/app/` directory.

### Running the Application

1.  Start the backend (in a separate terminal):
    ```bash
    cd backend
    python run.py
    ```
    The backend will run on `http://localhost:5000`.

2.  Start the frontend (in a separate terminal):
    ```bash
    cd frontend
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

3.  Open your browser and navigate to `http://localhost:3000`
