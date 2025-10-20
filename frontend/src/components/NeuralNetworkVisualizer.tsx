import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
// THREE.js functionality has been removed to fix TypeScript errors

// Types
type NeuronType = 'input' | 'hidden' | 'output';

interface Neuron {
  id: string;
  type: NeuronType;
  value: number;
  bias: number | null;
  layerIndex: number;
  neuronIndex: number;
  x: number;
  y: number;
  outgoingConnections: Connection[];
}

interface Layer {
  id: string;
  neurons: Neuron[];
}

interface Connection {
  sourceId: string;
  targetId: string;
  weight: number;
  id: string;
  to?: Neuron;
}

interface NetworkArchitecture {
  layers: Layer[];
  connections: Connection[];
}

// Define proper TypeScript interfaces
interface NeuronProps {
  x: number;
  y: number;
  type: string; // 'input', 'hidden', or 'output'
  bias: number | null;
  id: string;
}

interface ConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

// Define the proper types for weights and biases
interface NeuralNetworkVisualizerProps {
  weights: Record<string, number[][]>;
  biases: Record<string, number[][]>;
  width: number;
  height: number;
  epoch?: number;
  showWeightsOnArrows?: boolean;
  inputValues?: number[];
}

// Update neuron styles for more professional appearance
const NeuronRadius = 25;
const ConnectionWidth = 2.5;
const GlowRadius = 12;

// Adding smooth animation effects for a more modern look
const NeuronAnimation = `
  @keyframes neuronPulse {
    0% { filter: drop-shadow(0 0 3px rgba(77, 140, 255, 0.3)); }
    50% { filter: drop-shadow(0 0 8px rgba(77, 140, 255, 0.6)); }
    100% { filter: drop-shadow(0 0 3px rgba(77, 140, 255, 0.3)); }
  }
`;

// Enhanced styled components
const VisualizerContainer = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px ${({ theme }) => theme.darkShadow};
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 30px ${({ theme }) => `${theme.colors.primary}30`};
  }
`;

const VisualizationTitle = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  font-weight: 600;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const NetworkInfo = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
`;

const InfoPill = styled.div`
  background: linear-gradient(to right, ${({ theme }) => `${theme.colors.primary}15`}, ${({ theme }) => `${theme.colors.secondary}15`});
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  border: 1px solid ${({ theme }) => `${theme.colors.primary}30`};
  
  span {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  position: relative;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.background === '#121212' ? '#0a0a0a' : '#f0f5ff'};
  box-shadow: inset 0 0 10px ${({ theme }) => theme.darkShadow};
  
  canvas {
    width: 100%;
    display: block;
    margin: 0 auto;
  }
`;

const NetworkControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin: 15px 0 22px;
  width: 100%;
  background: rgba(10, 25, 50, 0.5);
  padding: 15px;
  border-radius: 12px;
  border: 1px solid rgba(77, 140, 255, 0.15);
`;

const ControlButton = styled.button<{ isActive?: boolean }>`
  background: ${props => props.isActive 
    ? 'linear-gradient(to right, rgba(77, 140, 255, 0.3), rgba(155, 122, 255, 0.3))' 
    : 'rgba(10, 25, 50, 0.7)'};
  border: 1px solid ${props => props.isActive 
    ? 'rgba(77, 140, 255, 0.5)' 
    : 'rgba(77, 140, 255, 0.2)'};
  border-radius: 8px;
  padding: 10px 16px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.isActive 
      ? 'linear-gradient(to right, rgba(77, 140, 255, 0.4), rgba(155, 122, 255, 0.4))' 
      : 'rgba(20, 40, 70, 0.8)'};
    border-color: rgba(77, 140, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const WeightsToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(10, 25, 50, 0.7);
  padding: 8px 16px;
  border-radius: 24px;
  border: 1px solid rgba(77, 140, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(77, 140, 255, 0.4);
    transform: translateY(-2px);
  }
`;

const ToggleLabel = styled.label`
  font-size: 0.9rem;
  color: #b3c6e5;
  cursor: pointer;
`;

const ToggleCheckbox = styled.input`
  appearance: none;
  width: 40px;
  height: 20px;
  background: rgba(15, 30, 60, 0.6);
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(77, 140, 255, 0.2);
  
  &::before {
    content: "";
    position: absolute;
    top: 1px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #b3c6e5;
    transition: all 0.3s;
  }
  
  &:checked {
    background: rgba(77, 140, 255, 0.5);
    border-color: rgba(77, 140, 255, 0.5);
    
    &::before {
      left: 22px;
      background: #ffffff;
    }
  }
`;

const NetworkStatsTabs = styled.div`
  width: 100%;
  margin-top: 25px;
  background: rgba(10, 25, 50, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(77, 140, 255, 0.15);
  overflow: hidden;
`;

const TabsHeader = styled.div`
  display: flex;
  background: rgba(10, 20, 40, 0.7);
  overflow: hidden;
  border-bottom: 1px solid rgba(77, 140, 255, 0.15);
`;

const TabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 14px;
  background: ${props => props.isActive 
    ? 'linear-gradient(to right, rgba(77, 140, 255, 0.2), rgba(155, 122, 255, 0.2))' 
    : 'transparent'};
  border: none;
  color: ${props => props.isActive ? '#ffffff' : '#b3c6e5'};
  font-weight: ${props => props.isActive ? '600' : '500'};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: ${props => props.isActive ? '20%' : '50%'};
    width: ${props => props.isActive ? '60%' : '0'};
    height: 3px;
    background: linear-gradient(to right, rgba(77, 140, 255, 0.8), rgba(155, 122, 255, 0.8));
    border-radius: 3px 3px 0 0;
    transition: all 0.3s;
  }
  
  &:hover {
    background: rgba(77, 140, 255, 0.1);
    
    &::after {
      width: ${props => props.isActive ? '60%' : '30%'};
      left: ${props => props.isActive ? '20%' : '35%'};
    }
  }
`;

const TabContent = styled.div`
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(10, 20, 40, 0.3);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(77, 140, 255, 0.4);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(77, 140, 255, 0.6);
  }
`;

const MatrixContainer = styled.div`
  width: 100%;
  background-color: ${({ theme }) => `${theme.cardBackground}`};
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const MatrixTabs = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const MatrixTab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background-color: ${({ active, theme }) => active ? `${theme.colors.primary}20` : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.text};
  border: none;
  cursor: pointer;
  font-weight: ${({ active }) => active ? '600' : '500'};
  border-bottom: 2px solid ${({ active, theme }) => active ? theme.colors.primary : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MatrixGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const MatrixCell = styled.div<{ value: number }>`
  padding: 10px;
  border-radius: 6px;
  background-color: ${({ value, theme }) => {
    const intensity = Math.min(Math.abs(value) * 0.5, 1);
    return value >= 0 
      ? `rgba(76, 217, 100, ${0.1 + intensity * 0.2})` 
      : `rgba(255, 59, 48, ${0.1 + intensity * 0.2})`;
  }};
  font-family: 'Roboto Mono', monospace;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ value, theme }) => {
    const intensity = Math.min(Math.abs(value) * 0.5, 1);
    return value >= 0 
      ? `rgba(76, 217, 100, ${0.3 + intensity * 0.3})` 
      : `rgba(255, 59, 48, ${0.3 + intensity * 0.3})`;
  }};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow};
  }
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background-color: ${({ theme }) => `${theme.cardBackground}`};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
`;

const LegendDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const LegendText = styled.span`
  font-weight: 500;
`;

const DebugConsole = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 280px;
  max-height: 120px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  padding: 8px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.75rem;
  color: #32ff7e;
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #32ff7e;
    border-radius: 2px;
  }
`;

const ConsoleLine = styled.div`
  margin-bottom: 4px;
  line-height: 1.4;
  white-space: nowrap;
`;

// Helper function to format values for display
const formatValue = (value: number) => {
  // Format the number to 3 decimal places and handle -0 case
  return value.toFixed(3) === '-0.000' ? '0.000' : value.toFixed(3);
};

// Main component with canvas-based visualization
export const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
  weights,
  biases,
  inputValues = [0, 0],
  width = 800,
  height = 600,
  showWeightsOnArrows = false,
  epoch = 0
}) => {
  console.log("NeuralNetworkVisualizer props:", { weights, biases, inputValues, width, height, showWeightsOnArrows, epoch });
  
  // Define all hooks at the top level, unconditionally
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'weights' | 'biases'>('weights');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  const particles = useRef<Array<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    progress: number;
    speed: number;
  }>>([]);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([
    'Initializing neural network visualization...',
    'Structure: 2-2-1 feedforward network',
    'Parameters loaded: 9 trainable parameters detected',
    'Canvas rendering initialized...'
  ]);
  
  // Add validation after all hooks are declared
  const hasValidWeights = weights && typeof weights === 'object' && 'W1' in weights && 'W2' in weights;
  const hasValidBiases = biases && typeof biases === 'object' && 'b1' in biases && 'b2' in biases;
  
  // Generate network stats
  const networkStats = {
    layers: weights && weights.W1 ? (weights.W2 ? 3 : 2) : 1,
    inputNeurons: weights && weights.W1 ? weights.W1.length : 0,
    hiddenNeurons: weights && weights.W1 && weights.W1[0] ? weights.W1[0].length : 0,
    outputNeurons: weights && weights.W2 && weights.W2[0] ? weights.W2[0].length : 0,
    totalWeights: (
      (weights && weights.W1 ? weights.W1.reduce((sum, row) => sum + row.length, 0) : 0) +
      (weights && weights.W2 ? weights.W2.reduce((sum, row) => sum + row.length, 0) : 0)
    ),
    totalBiases: (
      (biases && biases.b1 ? biases.b1.length : 0) +
      (biases && biases.b2 ? biases.b2.length : 0)
    )
  };

  // Add console message function
  const addConsoleMessage = (message: string) => {
    setConsoleMessages(prev => [...prev.slice(-9), message]);
  };
  
  // Function to get the weight color based on weight value
  const getWeightColor = (weight: number) => {
    // Enhanced color scheme for weights
    if (weight > 0) {
      const intensity = Math.min(Math.abs(weight) * 0.5, 1);
      return `rgba(76, 217, 100, ${0.5 + intensity * 0.5})`;
    } else {
      const intensity = Math.min(Math.abs(weight) * 0.5, 1);
      return `rgba(255, 59, 48, ${0.5 + intensity * 0.5})`;
    }
  };

  // Function to get the neuron color based on type and bias
  const getNeuronColor = (type: string, bias: number | null) => {
    switch (type) {
      case 'input':
        return 'rgba(10, 132, 255, 0.9)'; // Bright blue for input neurons
      case 'hidden':
        // Color hidden neurons based on bias if available
        if (bias !== null) {
          return bias >= 0 
            ? `rgba(191, 90, 242, ${0.7 + Math.min(Math.abs(bias) * 0.2, 0.3)})` // Purple for positive bias
            : `rgba(142, 68, 173, ${0.7 + Math.min(Math.abs(bias) * 0.2, 0.3)})`; // Darker purple for negative bias
        }
        return 'rgba(191, 90, 242, 0.8)'; // Default purple for hidden neurons
      case 'output':
        // Color output neurons based on bias if available
        if (bias !== null) {
          return bias >= 0 
            ? `rgba(255, 159, 10, ${0.7 + Math.min(Math.abs(bias) * 0.2, 0.3)})` // Orange for positive bias
            : `rgba(215, 126, 0, ${0.7 + Math.min(Math.abs(bias) * 0.2, 0.3)})`; // Darker orange for negative bias
        }
        return 'rgba(255, 159, 10, 0.8)'; // Default orange for output neurons
      default:
        return 'rgba(128, 128, 128, 0.8)'; // Gray for unknown types
    }
  };

  // Build the network architecture from weights and biases
  const buildNetworkArchitecture = (weights: Record<string, number[][]>, biases: Record<string, number[][]>): NetworkArchitecture => {
    // Convert Record to arrays for processing
    const weightLayers: number[][][] = [];
    const biasLayers: number[][] = [];
    
    // Handle weights for W1 and W2 layers
    if (weights.W1) weightLayers.push(weights.W1);
    if (weights.W2) weightLayers.push(weights.W2);
    
    // Handle biases for b1 and b2 layers
    if (biases.b1) biasLayers.push(biases.b1.map(row => row[0]));
    if (biases.b2) biasLayers.push(biases.b2.map(row => row[0]));
    
    const architecture: NetworkArchitecture = {
      layers: [],
      connections: [],
    };

    // Create input layer
    const inputNeurons: Neuron[] = [];
    // Assuming W1 exists and has the correct structure
    if (weights.W1 && weights.W1[0]) {
      const inputSize = weights.W1.length;
      for (let i = 0; i < inputSize; i++) {
        inputNeurons.push({
          id: `0-${i}`,
          type: 'input',
          value: inputValues[i] || 0,
          layerIndex: 0,
          neuronIndex: i,
          x: 0,
          y: 0,
          outgoingConnections: [],
          bias: null,
        });
      }
    }
    
    // Create the input layer
    const inputLayer: Layer = {
      id: 'input',
      neurons: inputNeurons
    };
    architecture.layers.push(inputLayer);

    // Hidden layer neurons
    if (weights.W1 && biases.b1) {
      const hiddenNeurons: Neuron[] = [];
      for (let i = 0; i < biases.b1.length; i++) {
        hiddenNeurons.push({
          id: `1-${i}`,
          type: 'hidden',
          value: 0, // This would be calculated during forward pass
          layerIndex: 1,
          neuronIndex: i,
          x: 0,
          y: 0,
          outgoingConnections: [],
          bias: biases.b1[i][0],
        });
      }
      
      const hiddenLayer: Layer = {
        id: 'hidden',
        neurons: hiddenNeurons
      };
      architecture.layers.push(hiddenLayer);
    }

    // Output layer neurons
    if (weights.W2 && biases.b2) {
      const outputNeurons: Neuron[] = [];
      for (let i = 0; i < biases.b2.length; i++) {
        outputNeurons.push({
          id: `2-${i}`,
          type: 'output',
          value: 0, // This would be calculated during forward pass
          layerIndex: 2,
          neuronIndex: i,
          x: 0,
          y: 0,
          outgoingConnections: [],
          bias: biases.b2[i][0],
        });
      }
      
      const outputLayer: Layer = {
        id: 'output',
        neurons: outputNeurons
      };
      architecture.layers.push(outputLayer);
    }

    // Create connections
    // Input to hidden connections
    if (weights.W1) {
      for (let inputIdx = 0; inputIdx < weights.W1.length; inputIdx++) {
        for (let hiddenIdx = 0; hiddenIdx < weights.W1[0].length; hiddenIdx++) {
          architecture.connections.push({
            id: `0-${inputIdx}-1-${hiddenIdx}`,
            sourceId: `0-${inputIdx}`,
            targetId: `1-${hiddenIdx}`,
            weight: weights.W1[inputIdx][hiddenIdx],
          });
        }
      }
    }

    // Hidden to output connections
    if (weights.W2) {
      for (let hiddenIdx = 0; hiddenIdx < weights.W2.length; hiddenIdx++) {
        for (let outputIdx = 0; outputIdx < weights.W2[0].length; outputIdx++) {
          architecture.connections.push({
            id: `1-${hiddenIdx}-2-${outputIdx}`,
            sourceId: `1-${hiddenIdx}`,
            targetId: `2-${outputIdx}`,
            weight: weights.W2[hiddenIdx][outputIdx],
          });
        }
      }
    }

    return architecture;
  };

  // Enhanced neuron positioning for better visualization
  const calculateNeuronPositions = (
    layers: Layer[],
    width: number,
    height: number
  ): void => {
    const horizontalPadding = width * 0.15;
    const verticalPadding = height * 0.15;
    const availableWidth = width - 2 * horizontalPadding;
    const availableHeight = height - 2 * verticalPadding;
    
    // Horizontal spacing between layers
    const layerSpacing = availableWidth / (layers.length - 1);
    
    layers.forEach((layer, layerIndex) => {
      const neurons = layer.neurons;
      // Get max neurons in any layer for scaling
      const maxNeuronsInAnyLayer = Math.max(...layers.map(l => l.neurons.length));
      
      // Vertical spacing should be proportional to the number of neurons
      const neuronSpacing = availableHeight / Math.max(neurons.length - 1, 1);
      
      neurons.forEach((neuron, neuronIndex) => {
        // Calculate x position based on layer index
        neuron.x = horizontalPadding + layerIndex * layerSpacing;
        
        // Calculate y position - center the neurons vertically
        const layerHeight = (neurons.length - 1) * neuronSpacing;
        const offsetY = (availableHeight - layerHeight) / 2;
        neuron.y = verticalPadding + offsetY + neuronIndex * neuronSpacing;
      });
    });
  };

  // Enhanced network drawing for better visualization
  const drawNetwork = (
    network: NetworkArchitecture,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    showWeightsOnArrows: boolean
  ): void => {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw subtle grid for better visual guidance
    drawGrid(ctx, width, height);
    
    // Draw connections first (so they appear behind the neurons)
    network.layers.forEach(layer => {
      layer.neurons.forEach(neuron => {
        neuron.outgoingConnections.forEach(connection => {
          const toNeuron = connection.to;
          if (toNeuron) {
            drawArrow(
              ctx,
              neuron.x,
              neuron.y,
              toNeuron.x,
              toNeuron.y,
              connection.weight,
              true
            );
          }
        });
      });
    });
    
    // Draw neurons
    network.layers.forEach((layer, layerIndex) => {
      layer.neurons.forEach((neuron, neuronIndex) => {
        let neuronType: NeuronType;
        let value: number | undefined;
        
        if (layerIndex === 0) {
          neuronType = 'input';
          // Use the input value if available
          value = neuron.value;
        } else if (layerIndex === network.layers.length - 1) {
          neuronType = 'output';
          // Use the output value if available
          value = neuron.value;
        } else {
          neuronType = 'hidden';
        }
        
        drawNeuron(ctx, neuron.x, neuron.y, neuronType, value, neuron.bias);
      });
    });
  };

  // Add subtle grid to the canvas for better visual guidance
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    const gridSize = 25;
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(77, 140, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  };

  // Enhanced neuron drawing function with better aesthetics
  const drawNeuron = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: NeuronType,
    value?: number,
    bias?: number | null
  ) => {
    // Draw neuron glow
    const gradientGlow = ctx.createRadialGradient(x, y, 0, x, y, NeuronRadius * 1.8);
    
    switch (type) {
      case 'input':
        gradientGlow.addColorStop(0, 'rgba(0, 230, 118, 0.7)');
        gradientGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
        break;
      case 'hidden':
        gradientGlow.addColorStop(0, 'rgba(77, 140, 255, 0.7)');
        gradientGlow.addColorStop(1, 'rgba(77, 140, 255, 0)');
        break;
      case 'output':
        gradientGlow.addColorStop(0, 'rgba(255, 100, 100, 0.7)');
        gradientGlow.addColorStop(1, 'rgba(255, 100, 100, 0)');
        break;
    }
    
    ctx.beginPath();
    ctx.fillStyle = gradientGlow;
    ctx.arc(x, y, NeuronRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw neuron body with gradient
    const gradientBody = ctx.createRadialGradient(x - NeuronRadius/3, y - NeuronRadius/3, 0, x, y, NeuronRadius);
    
    switch (type) {
      case 'input':
        gradientBody.addColorStop(0, '#00e976');
        gradientBody.addColorStop(0.8, '#00b760');
        gradientBody.addColorStop(1, '#009c50');
        break;
      case 'hidden':
        gradientBody.addColorStop(0, '#4d8cff');
        gradientBody.addColorStop(0.8, '#2c6ce0');
        gradientBody.addColorStop(1, '#1e5bb0');
        break;
      case 'output':
        gradientBody.addColorStop(0, '#ff6464');
        gradientBody.addColorStop(0.8, '#e04c4c');
        gradientBody.addColorStop(1, '#c53a3a');
        break;
    }
    
    ctx.beginPath();
    ctx.fillStyle = gradientBody;
    ctx.arc(x, y, NeuronRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw neuron border
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.arc(x, y, NeuronRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw neuron highlight
    ctx.beginPath();
    ctx.arc(x - NeuronRadius/3, y - NeuronRadius/3, NeuronRadius/4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Display input value if present (for input neurons)
    if (type === 'input' && value !== undefined) {
      ctx.font = 'bold 12px Roboto Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(value.toFixed(2), x, y);
      ctx.shadowBlur = 0;
    }
    
    // Always display bias for hidden and output neurons
    if ((type === 'hidden' || type === 'output') && bias !== null && bias !== undefined) {
      ctx.font = 'bold 12px Roboto Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`b: ${bias.toFixed(2)}`, x, y);
      ctx.shadowBlur = 0;
    }
  };

  // Enhanced arrow drawing with better aesthetics
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    weight: number,
    showWeight: boolean
  ) => {
    // Adjust arrow to start and end at neuron borders
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const fromRadius = NeuronRadius + 2;
    const toRadius = NeuronRadius + 2;
    
    const adjustedFromX = fromX + fromRadius * Math.cos(angle);
    const adjustedFromY = fromY + fromRadius * Math.sin(angle);
    const adjustedToX = toX - toRadius * Math.cos(angle);
    const adjustedToY = toY - toRadius * Math.sin(angle);
    
    // Set color based on weight (red for negative, green for positive)
    const absWeight = Math.abs(weight);
    const opacity = Math.min(0.2 + absWeight * 0.8, 1); // Scale opacity based on weight
    const lineWidth = Math.max(ConnectionWidth, ConnectionWidth * absWeight * 1.5);
    
    const colorValue = Math.min(255, Math.floor(absWeight * 255));
    let color;
    
    if (weight >= 0) {
      // Blue to cyan gradient for positive weights
      color = `rgba(77, ${140 + colorValue/2}, 255, ${opacity})`;
    } else {
      // Red to orange gradient for negative weights
      color = `rgba(255, ${100 - colorValue/3}, ${100 - colorValue/2}, ${opacity})`;
    }
    
    // Draw connection line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(adjustedFromX, adjustedFromY);
    ctx.lineTo(adjustedToX, adjustedToY);
    ctx.stroke();
    
    // Draw arrowhead
    const arrowLength = 12;
    const arrowWidth = 8;
    
    const dx = adjustedToX - adjustedFromX;
    const dy = adjustedToY - adjustedFromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const xTemp = dx / length;
    const yTemp = dy / length;
    
    const xDirection = xTemp * arrowLength;
    const yDirection = yTemp * arrowLength;
    const xWidth = -yTemp * arrowWidth;
    const yWidth = xTemp * arrowWidth;
    
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(adjustedToX, adjustedToY);
    ctx.lineTo(adjustedToX - xDirection + xWidth, adjustedToY - yDirection + yWidth);
    ctx.lineTo(adjustedToX - xDirection - xWidth, adjustedToY - yDirection - yWidth);
    ctx.closePath();
    ctx.fill();
    
    // Show weight value if enabled
    if (showWeight) {
      // Position the text at the midpoint of the arrow with a slight offset
      const midX = (adjustedFromX + adjustedToX) / 2;
      const midY = (adjustedFromY + adjustedToY) / 2 - 5;
      
      ctx.font = 'bold 12px Roboto Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add a subtle background for better readability
      const weightText = weight.toFixed(2);
      const textWidth = ctx.measureText(weightText).width;
      ctx.fillStyle = 'rgba(10, 17, 34, 0.7)';
      ctx.fillRect(midX - textWidth/2 - 4, midY - 8, textWidth + 8, 16);
      
      // Draw the text
      ctx.fillStyle = weight >= 0 ? '#4dc3ff' : '#ff6464';
      ctx.fillText(weightText, midX, midY);
    }
  };

  // Update useEffect with responsive canvas handling - moved outside of any conditionals
  useEffect(() => {
    if (!hasValidWeights || !hasValidBiases) {
      return; // Early return if data is invalid
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the canvas size taking into account device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the context to ensure correct drawing operations
    ctx.scale(dpr, dpr);
    
    // Set the CSS size of the canvas
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Build network architecture
    const network = buildNetworkArchitecture(weights, biases);
    
    // Process connections to make them accessible from neurons
    network.layers.forEach(layer => {
      layer.neurons.forEach(neuron => {
        neuron.outgoingConnections = [];
      });
    });
    
    // Connect neurons based on the connections
    network.connections.forEach(connection => {
      const sourceId = connection.sourceId;
      const targetId = connection.targetId;
      
      // Find the source and target neurons
      let sourceNeuron: Neuron | undefined;
      let targetNeuron: Neuron | undefined;
      
      network.layers.forEach(layer => {
        layer.neurons.forEach(neuron => {
          if (neuron.id === sourceId) {
            sourceNeuron = neuron;
          }
          if (neuron.id === targetId) {
            targetNeuron = neuron;
          }
        });
      });
      
      // Add the connection
      if (sourceNeuron && targetNeuron) {
        connection.to = targetNeuron;
        sourceNeuron.outgoingConnections.push(connection);
      }
    });
    
    // Calculate neuron positions
    calculateNeuronPositions(network.layers, rect.width, rect.height);
    
    // Draw the network
    drawNetwork(network, ctx, rect.width, rect.height, showWeightsOnArrows);
    
    // Add responsive resize handling
    const handleResize = () => {
      const newRect = canvas.getBoundingClientRect();
      
      // Update canvas dimensions
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      
      // Reset the scale
      ctx.scale(dpr, dpr);
      
      // Recalculate positions and redraw
      calculateNeuronPositions(network.layers, newRect.width, newRect.height);
      drawNetwork(network, ctx, newRect.width, newRect.height, showWeightsOnArrows);
    };
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [weights, biases, inputValues, width, height, showWeightsOnArrows, epoch, hasValidWeights, hasValidBiases]);
  
  // Toggle animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    
    if (!isAnimating) {
      startAnimation();
      addConsoleMessage('Data flow animation started');
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      particles.current = [];
      addConsoleMessage('Data flow animation stopped');
      
      // Get the canvas and context
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Build network architecture
      const network = buildNetworkArchitecture(weights, biases);
      
      // Process connections for the network
      network.layers.forEach(layer => {
        layer.neurons.forEach(neuron => {
          neuron.outgoingConnections = [];
        });
      });
      
      // Connect neurons based on the connections
      network.connections.forEach(connection => {
        const sourceId = connection.sourceId;
        const targetId = connection.targetId;
        
        // Find the source and target neurons
        let sourceNeuron: Neuron | undefined;
        let targetNeuron: Neuron | undefined;
        
        network.layers.forEach(layer => {
          layer.neurons.forEach(neuron => {
            if (neuron.id === sourceId) {
              sourceNeuron = neuron;
            }
            if (neuron.id === targetId) {
              targetNeuron = neuron;
            }
          });
        });
        
        // Add the connection
        if (sourceNeuron && targetNeuron) {
          connection.to = targetNeuron;
          sourceNeuron.outgoingConnections.push(connection);
        }
      });
      
      // Calculate neuron positions
      calculateNeuronPositions(network.layers, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      
      // Redraw network without particles
      drawNetwork(network, ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio, showWeightsOnArrows);
    }
  };
  
  // Start animation loop
  const startAnimation = () => {
    if (!isAnimating) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Build network architecture
    const network = buildNetworkArchitecture(weights, biases);
    
    // Process connections for the network
    network.layers.forEach(layer => {
      layer.neurons.forEach(neuron => {
        neuron.outgoingConnections = [];
      });
    });
    
    // Connect neurons based on the connections
    network.connections.forEach(connection => {
      const sourceId = connection.sourceId;
      const targetId = connection.targetId;
      
      // Find the source and target neurons
      let sourceNeuron: Neuron | undefined;
      let targetNeuron: Neuron | undefined;
      
      network.layers.forEach(layer => {
        layer.neurons.forEach(neuron => {
          if (neuron.id === sourceId) {
            sourceNeuron = neuron;
          }
          if (neuron.id === targetId) {
            targetNeuron = neuron;
          }
        });
      });
      
      // Add the connection
      if (sourceNeuron && targetNeuron) {
        connection.to = targetNeuron;
        sourceNeuron.outgoingConnections.push(connection);
      }
    });
    
    // Calculate positions
    calculateNeuronPositions(network.layers, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    
    const animate = () => {
      if (!isAnimating) return;
      
      // Draw the network
      drawNetwork(network, ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio, showWeightsOnArrows);
      
      // Update particles
      updateParticles();
      
      // Draw particles
      drawParticles(ctx);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Periodically add new particles
    const createNewParticles = () => {
      if (!isAnimating) return;
      
      // Get all layer neurons
      const inputNeurons: Neuron[] = [];
      const hiddenNeurons: Neuron[] = [];
      const outputNeurons: Neuron[] = [];
      
      network.layers.forEach((layer, layerIndex) => {
        layer.neurons.forEach(neuron => {
          if (layerIndex === 0) {
            inputNeurons.push(neuron);
          } else if (layerIndex === network.layers.length - 1) {
            outputNeurons.push(neuron);
          } else {
            hiddenNeurons.push(neuron);
          }
        });
      });
      
      // Create particles from input to hidden
      inputNeurons.forEach(input => {
        hiddenNeurons.forEach(hidden => {
          if (Math.random() < 0.2) { // 20% chance to create a particle
            particles.current.push({
              x: input.x,
              y: input.y,
              targetX: hidden.x,
              targetY: hidden.y,
              progress: 0,
              speed: 0.01 + Math.random() * 0.02
            });
          }
        });
      });
      
      // Create particles from hidden to output
      hiddenNeurons.forEach(hidden => {
        outputNeurons.forEach(output => {
          if (Math.random() < 0.2) { // 20% chance to create a particle
            particles.current.push({
              x: hidden.x,
              y: hidden.y,
              targetX: output.x,
              targetY: output.y,
              progress: 0,
              speed: 0.01 + Math.random() * 0.02
            });
          }
        });
      });
      
      // Schedule next creation
      setTimeout(createNewParticles, 500); // Create new particles every 500ms
    };
    
    createNewParticles();
  };
  
  // Update particles
  const updateParticles = () => {
    particles.current = particles.current.filter(p => {
      // Update progress
      p.progress += p.speed;
      
      // Remove completed particles
      return p.progress < 1;
    });
  };
  
  // Draw particles
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particles.current.forEach(p => {
      // Calculate current position
      const x = p.x + (p.targetX - p.x) * p.progress;
      const y = p.y + (p.targetY - p.y) * p.progress;
      
      // Draw particle
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw glow
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Move the early return after all hooks and useEffect declarations
  if (!hasValidWeights || !hasValidBiases) {
    console.error("Invalid weights or biases format:", { weights, biases });
    return (
      <div style={{ 
        width: width, 
        height: height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: '10px',
        color: 'red',
        textAlign: 'center'
      }}>
        <h3>Error: Invalid weights or biases format</h3>
        <div>
          <p>The neural network visualizer requires properly formatted weights and biases.</p>
          <p>Missing: {!hasValidWeights ? 'Weights' : ''} {!hasValidBiases ? 'Biases' : ''}</p>
        </div>
        <pre style={{ fontSize: '10px', textAlign: 'left', maxWidth: '100%', overflow: 'auto' }}>
          {JSON.stringify({ weights, biases }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <VisualizerContainer>
      <VisualizationTitle>Neural Network Architecture (2-2-1)</VisualizationTitle>
      
      <NetworkInfo>
        <InfoPill>Total Parameters: <span>{networkStats.totalWeights + networkStats.totalBiases}</span></InfoPill>
        <InfoPill>Neurons: <span>{networkStats.inputNeurons + networkStats.hiddenNeurons + networkStats.outputNeurons}</span></InfoPill>
        <InfoPill>Current Epoch: <span>{epoch}</span></InfoPill>
      </NetworkInfo>
      
      <CanvasContainer>
        <canvas ref={canvasRef} width={width} height={height} />
        
        <DebugConsole>
          {consoleMessages.map((msg, index) => (
            <ConsoleLine key={index}>&gt; {msg}</ConsoleLine>
          ))}
        </DebugConsole>
      </CanvasContainer>
      
      <MatrixContainer>
        <MatrixTabs>
          <MatrixTab 
            active={activeTab === 'weights'} 
            onClick={() => setActiveTab('weights')}
          >
            Weights
          </MatrixTab>
          <MatrixTab 
            active={activeTab === 'biases'} 
            onClick={() => setActiveTab('biases')}
          >
            Biases
          </MatrixTab>
        </MatrixTabs>
        
        {activeTab === 'weights' && (
          <>
            <MatrixGrid>
              {weights.W1 && weights.W1.map((row, rowIdx) => (
                row.map((val, colIdx) => (
                  <MatrixCell key={`w1-${rowIdx}-${colIdx}`} value={val}>
                    W1[{rowIdx},{colIdx}]: {formatValue(val)}
                  </MatrixCell>
                ))
              ))}
            </MatrixGrid>
            
            <MatrixGrid>
              {weights.W2 && weights.W2.map((row, rowIdx) => (
                row.map((val, colIdx) => (
                  <MatrixCell key={`w2-${rowIdx}-${colIdx}`} value={val}>
                    W2[{rowIdx},{colIdx}]: {formatValue(val)}
                  </MatrixCell>
                ))
              ))}
            </MatrixGrid>
          </>
        )}
        
        {activeTab === 'biases' && (
          <>
            <MatrixGrid>
              {biases.b1 && biases.b1.map((row, rowIdx) => (
                <MatrixCell key={`b1-${rowIdx}`} value={row[0]}>
                  b1[{rowIdx}]: {formatValue(row[0])}
                </MatrixCell>
              ))}
            </MatrixGrid>
            
            <MatrixGrid>
              {biases.b2 && biases.b2.map((row, rowIdx) => (
                <MatrixCell key={`b2-${rowIdx}`} value={row[0]}>
                  b2[{rowIdx}]: {formatValue(row[0])}
                </MatrixCell>
              ))}
            </MatrixGrid>
          </>
        )}
      </MatrixContainer>
      
      <LegendContainer>
        <LegendItem>
          <LegendDot color="rgba(10, 132, 255, 0.9)" />
          <LegendText>Input Neuron</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(191, 90, 242, 0.8)" />
          <LegendText>Hidden Neuron</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(255, 159, 10, 0.8)" />
          <LegendText>Output Neuron</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(76, 217, 100, 0.7)" />
          <LegendText>Positive Weight</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(255, 59, 48, 0.7)" />
          <LegendText>Negative Weight</LegendText>
        </LegendItem>
      </LegendContainer>
    </VisualizerContainer>
  );
}; 