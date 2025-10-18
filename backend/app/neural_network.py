import numpy as np

class NeuralNetwork:
    def __init__(self, layers=[2, 2, 1], learning_rate=0.01):
        self.layers = layers
        self.learning_rate = learning_rate
        self.parameters = {}
        self.initialize_parameters()

    def initialize_parameters(self):
        for i in range(1, len(self.layers)):
            self.parameters['W' + str(i)] = np.random.randn(self.layers[i], self.layers[i-1]) * 0.01
            self.parameters['b' + str(i)] = np.zeros((self.layers[i], 1))

    def sigmoid(self, Z):
        return 1 / (1 + np.exp(-Z)), Z

    def compute_loss(self, A, Y):
        m = Y.shape[1]
        loss = -1/m * np.sum(Y * np.log(A) + (1 - Y) * np.log(1 - A))
        return np.squeeze(loss)

    def forward(self, X):
        cache = {'A0': X}
        A = X
        for i in range(1, len(self.layers)):
            W = self.parameters['W' + str(i)]
            b = self.parameters['b' + str(i)]
            
            Z = np.dot(W, A) + b
            A, _ = self.sigmoid(Z)
            
            cache['Z' + str(i)] = Z
            cache['A' + str(i)] = A
        return A, cache

    def backward(self, Y, cache):
        grads = {}
        m = Y.shape[1]
        
        L = len(self.layers) - 1
        A_prev = cache['A' + str(L-1)]
        A_curr = cache['A' + str(L)]

        # Output Layer
        dZ = A_curr - Y
        grads['dW' + str(L)] = 1/m * np.dot(dZ, A_prev.T)
        grads['db' + str(L)] = 1/m * np.sum(dZ, axis=1, keepdims=True)

        # Hidden Layer
        for i in range(L - 1, 0, -1):
            A_prev = cache['A' + str(i-1)]
            Z_curr = cache['Z' + str(i)]
            W_next = self.parameters['W' + str(i+1)]
            dZ_next = dZ # From the previous iteration (output layer)

            sigmoid_derivative = np.exp(-Z_curr) / (1 + np.exp(-Z_curr))**2
            dZ = np.dot(W_next.T, dZ_next) * sigmoid_derivative
            
            grads['dW' + str(i)] = 1/m * np.dot(dZ, A_prev.T)
            grads['db' + str(i)] = 1/m * np.sum(dZ, axis=1, keepdims=True)
        
        return grads

    def update_parameters(self, grads):
        for i in range(1, len(self.layers)):
            self.parameters['W' + str(i)] -= self.learning_rate * grads['dW' + str(i)]
            self.parameters['b' + str(i)] -= self.learning_rate * grads['db' + str(i)]


