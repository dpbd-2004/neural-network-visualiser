import React, { useRef, useEffect } from 'react';
import { Parameters } from '../types';

// Define the properties (props) that this component will accept
interface NeuralNetworkVisualizerProps {
  parameters: Parameters | null; // The weights and biases from the backend
}

const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({ parameters }) => {
  // useRef is a React hook that gives us direct access to an HTML element,
  // in this case, the <canvas>.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // useEffect is a hook that runs code after the component has rendered.
  // We use it here to perform the drawing on the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if the canvas is not ready yet

    const context = canvas.getContext('2d');
    if (!context) return; // Exit if we can't get the drawing context

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 400;

    // Clear the canvas before each redraw
    context.clearRect(0, 0, canvas.width, canvas.height);

    // --- Drawing Logic ---

    const layers = [
      { name: 'Input', count: 2, neurons: ['CGPA', 'IQ'] },
      { name: 'Hidden', count: 2, neurons: ['H1', 'H2'] },
      { name: 'Output', count: 1, neurons: ['Placed?'] }
    ];
    const nodeRadius = 20;
    const layerSpacing = 300;

    // Draw Nodes (Neurons)
    layers.forEach((layer, layerIndex) => {
      const x = 150 + layerIndex * layerSpacing;
      for (let i = 0; i < layer.count; i++) {
        const y = 100 + i * 100;
        
        // Draw the circle for the neuron
        context.beginPath();
        context.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        context.fillStyle = 'white';
        context.fill();
        context.strokeStyle = '#333';
        context.stroke();
        
        // Draw the label for the neuron
        context.fillStyle = '#333';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(layer.neurons[i], x, y);
      }
    });

    // Draw Connections (Weights) - STATIC for now
    // This is a simplified version. We will make this dynamic later.
    for (let i = 0; i < 2; i++) { // From 2 input neurons
      for (let j = 0; j < 2; j++) { // To 2 hidden neurons
          context.beginPath();
          context.moveTo(150, 100 + i * 100); // Start point (input layer)
          context.lineTo(450, 100 + j * 100); // End point (hidden layer)
          context.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Light gray for now
          context.lineWidth = 1;
          context.stroke();
      }
    }
    for (let i = 0; i < 2; i++) { // From 2 hidden neurons
        context.beginPath();
        context.moveTo(450, 100 + i * 100); // Start point (hidden layer)
        context.lineTo(750, 100); // End point (output layer)
        context.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Light gray for now
        context.lineWidth = 1;
        context.stroke();
    }

  }, [parameters]); // The [parameters] array means this useEffect will re-run whenever 'parameters' change

  // The component returns a canvas element. The ref connects it to our canvasRef.
  return <canvas ref={canvasRef} />;
};

export default NeuralNetworkVisualizer;