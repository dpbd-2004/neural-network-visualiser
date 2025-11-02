// frontend/src/components/NeuralNetworkVisualizer.tsx
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme

// Types
type NeuronType = 'input' | 'hidden' | 'output';
type ModelMode = 'classification' | 'regression';

interface Neuron {
  id: string;
  type: NeuronType;
  value: number;
  bias: number | null;
  label: string; // Added for input/output labels
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

// Define the proper types for weights and biases
interface NeuralNetworkVisualizerProps {
  weights: Record<string, number[][]>;
  biases: Record<string, number[][]>;
  mode: ModelMode; // Added mode prop
  inputValues?: number[];
}

// --- Enhanced Styling Constants ---
const NeuronRadius = 28;
const ConnectionWidth = 2;
const GlowRadius = 15;
const LabelColor = '#E0E0E0';
const ValueColor = '#FFFFFF';
const FontFace = 'Roboto Mono, monospace';

// Enhanced styled components
const VisualizerContainer = styled.div`
  width: 100%;
  position: relative;
  background-color: ${props => props.theme.background};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px ${props => props.theme.darkShadow}, 
              inset 0 0 20px ${props => props.theme.background}80;
  border: 1px solid ${props => props.theme.colors.primary}40;
  transition: all 0.3s ease;
  overflow: hidden; /* Ensure glow doesn't leak out */
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 300px; /* Give canvas a fixed height */
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.theme.background === '#121212' ? '#0A0A0A' : '#F4F6F8'};
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
  
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const DebugConsole = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 250px;
  max-height: 100px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  padding: 8px;
  font-family: ${FontFace};
  font-size: 0.7rem;
  color: #00FF88;
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  scrollbar-width: thin;
  
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background-color: #00FF88;
    border-radius: 2px;
  }
`;

const ConsoleLine = styled.div`
  margin-bottom: 4px;
  line-height: 1.4;
  white-space: nowrap;
`;

// Helper function to get color based on weight
const getWeightColor = (weight: number, theme: any) => {
  const primary = theme.colors.primary; // Blue/Green tint
  const danger = theme.colors.danger;  // Red tint
  
  if (weight > 0) {
    const intensity = Math.min(Math.abs(weight) * 0.4, 1);
    return `rgba(${hexToRgb(primary)}, ${0.4 + intensity * 0.6})`;
  } else {
    const intensity = Math.min(Math.abs(weight) * 0.4, 1);
    return `rgba(${hexToRgb(danger)}, ${0.4 + intensity * 0.6})`;
  }
};

// Helper to convert hex to rgb string
const hexToRgb = (hex: string) => {
  let c: any = hex.substring(1).match(/.{1,2}/g);
  c = c.map((hex: string) => parseInt(hex, 16));
  return c.join(',');
};


// Main component with canvas-based visualization
const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
  weights,
  biases,
  mode, // <-- Destructure mode
  inputValues = [0, 0],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme(); // <-- Get theme context
  const [consoleMessages, setConsoleMessages] = useState<string[]>([
    'Network Visualizer Initialized',
    `Mode: ${mode}`,
  ]);

  const hasValidWeights = weights && typeof weights === 'object' && 'W1' in weights && 'W2' in weights;
  const hasValidBiases = biases && typeof biases === 'object' && 'b1' in biases && 'b2' in biases;

  const addConsoleMessage = (message: string) => {
    setConsoleMessages(prev => [...prev.slice(-5), message]);
  };
  
  useEffect(() => {
    addConsoleMessage(`Mode set to: ${mode}`)
  }, [mode]);


  // --- Network Building Functions ---

  const buildNetworkArchitecture = (
    weights: Record<string, number[][]>,
    biases: Record<string, number[][]>,
    mode: ModelMode
  ): NetworkArchitecture => {
    
    // --- Define labels based on mode ---
    const inputLabels = mode === 'classification' ? ['CGPA', 'IQ'] : ['StudyTime', 'GoOut'];
    const outputLabel = mode === 'classification' ? 'Placement' : 'Grade';

    const architecture: NetworkArchitecture = { layers: [], connections: [] };

    // Create input layer
    const inputNeurons: Neuron[] = [];
    if (weights.W1 && weights.W1[0]) {
      const inputSize = weights.W1.length;
      for (let i = 0; i < inputSize; i++) {
        inputNeurons.push({
          id: `0-${i}`, type: 'input', value: inputValues[i] || 0,
          label: inputLabels[i] || `Input ${i+1}`,
          layerIndex: 0, neuronIndex: i, x: 0, y: 0,
          outgoingConnections: [], bias: null,
        });
      }
    }
    architecture.layers.push({ id: 'input', neurons: inputNeurons });

    // Hidden layer neurons
    if (weights.W1 && biases.b1) {
      const hiddenNeurons: Neuron[] = [];
      for (let i = 0; i < biases.b1.length; i++) {
        hiddenNeurons.push({
          id: `1-${i}`, type: 'hidden', value: 0,
          label: `h${i+1}`,
          layerIndex: 1, neuronIndex: i, x: 0, y: 0,
          outgoingConnections: [], bias: biases.b1[i][0],
        });
      }
      architecture.layers.push({ id: 'hidden', neurons: hiddenNeurons });
    }

    // Output layer neurons
    if (weights.W2 && biases.b2) {
      const outputNeurons: Neuron[] = [];
      for (let i = 0; i < biases.b2.length; i++) {
        outputNeurons.push({
          id: `2-${i}`, type: 'output', value: 0,
          label: outputLabel,
          layerIndex: 2, neuronIndex: i, x: 0, y: 0,
          outgoingConnections: [], bias: biases.b2[i][0],
        });
      }
      architecture.layers.push({ id: 'output', neurons: outputNeurons });
    }

    // Create connections: Input to hidden
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

    // Create connections: Hidden to output
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

  const calculateNeuronPositions = (
    layers: Layer[],
    width: number,
    height: number
  ): void => {
    const horizontalPadding = width * 0.15;
    const verticalPadding = height * 0.15;
    const availableWidth = width - 2 * horizontalPadding;
    const availableHeight = height - 2 * verticalPadding;
    
    const layerSpacing = availableWidth / (layers.length - 1);
    
    layers.forEach((layer, layerIndex) => {
      const neurons = layer.neurons;
      const neuronSpacing = availableHeight / Math.max(neurons.length - 1, 1);
      
      neurons.forEach((neuron, neuronIndex) => {
        neuron.x = horizontalPadding + layerIndex * layerSpacing;
        
        const layerHeight = (neurons.length - 1) * neuronSpacing;
        const offsetY = (availableHeight - layerHeight) / 2;
        neuron.y = verticalPadding + offsetY + neuronIndex * neuronSpacing;
        
        // --- Add labels ---
        neuron.label = layer.neurons[neuronIndex].label; 
      });
    });
  };

  
  // --- Canvas Drawing Functions (Modified for Style) ---

  const drawNetwork = (
    network: NetworkArchitecture,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections
    network.layers.forEach(layer => {
      layer.neurons.forEach(neuron => {
        neuron.outgoingConnections.forEach(connection => {
          if (connection.to) {
            drawArrow(ctx, neuron.x, neuron.y, connection.to.x, connection.to.y, connection.weight);
          }
        });
      });
    });
    
    // Draw neurons
    network.layers.forEach((layer) => {
      layer.neurons.forEach((neuron) => {
        drawNeuron(ctx, neuron.x, neuron.y, neuron.type, neuron.label, neuron.bias);
      });
    });
  };

  const drawNeuron = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: NeuronType,
    label: string,
    bias?: number | null
  ) => {
    let color = theme.colors.primary;
    if (type === 'hidden') color = theme.colors.secondary;
    if (type === 'output') color = '#FFA500'; // Orange for output

    // 1. Draw Glow
    ctx.shadowBlur = GlowRadius;
    ctx.shadowColor = `${color}80`;
    
    // 2. Draw Neuron Body
    ctx.beginPath();
    ctx.arc(x, y, NeuronRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 3. Draw Inner Stroke (for definition)
    ctx.shadowBlur = 0; // Turn off glow for stroke
    ctx.strokeStyle = `${color}90`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Draw Text (Bias or Label)
    ctx.font = `bold 11px ${FontFace}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ValueColor;
    
    if (bias !== null && bias !== undefined) {
      ctx.fillText(`b: ${bias.toFixed(2)}`, x, y);
    }

    // 5. Draw Label (Input/Output)
    ctx.font = `500 12px ${FontFace}`;
    ctx.fillStyle = LabelColor;
    if (type === 'input') {
      ctx.textAlign = 'right';
      ctx.fillText(label, x - NeuronRadius - 15, y);
    } else if (type === 'output') {
      ctx.textAlign = 'left';
      ctx.fillText(label, x + NeuronRadius + 15, y);
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    weight: number
  ) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const fromRadius = NeuronRadius + 2;
    const toRadius = NeuronRadius + 2;
    
    const adjustedFromX = fromX + fromRadius * Math.cos(angle);
    const adjustedFromY = fromY + fromRadius * Math.sin(angle);
    const adjustedToX = toX - toRadius * Math.cos(angle);
    const adjustedToY = toY - toRadius * Math.sin(angle);
    
    const color = getWeightColor(weight, theme);
    const lineWidth = Math.max(1, Math.min(Math.abs(weight) * 2, 6));

    // 1. Draw connection line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(adjustedFromX, adjustedFromY);
    ctx.lineTo(adjustedToX, adjustedToY);
    ctx.stroke();
    
    // 2. Draw Arrowhead
    const headLength = 10;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(adjustedToX, adjustedToY);
    ctx.lineTo(
      adjustedToX - headLength * Math.cos(angle - Math.PI / 6),
      adjustedToY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      adjustedToX - headLength * Math.cos(angle + Math.PI / 6),
      adjustedToY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // 3. Draw Weight Value
    const midX = (adjustedFromX + adjustedToX) / 2;
    const midY = (adjustedFromY + adjustedToY) / 2 - 8; // Offset text up
    
    ctx.font = `bold 12px ${FontFace}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text background
    const weightText = weight.toFixed(2);
    const textWidth = ctx.measureText(weightText).width;
    ctx.fillStyle = theme.background === '#121212' ? 'rgba(10, 10, 10, 0.7)' : 'rgba(250, 250, 250, 0.7)';
    ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);
    
    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(weightText, midX, midY);
  };
  

  // --- useEffect for Drawing ---
  useEffect(() => {
    if (!hasValidWeights || !hasValidBiases) {
      addConsoleMessage('Waiting for valid parameters...');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Build and Draw
    const network = buildNetworkArchitecture(weights, biases, mode);
    
    network.layers.forEach(layer => layer.neurons.forEach(n => n.outgoingConnections = []));
    
    network.connections.forEach(connection => {
      let sourceNeuron: Neuron | undefined;
      let targetNeuron: Neuron | undefined;
      
      network.layers.forEach(layer => {
        layer.neurons.forEach(neuron => {
          if (neuron.id === connection.sourceId) sourceNeuron = neuron;
          if (neuron.id === connection.targetId) targetNeuron = neuron;
        });
      });
      
      if (sourceNeuron && targetNeuron) {
        connection.to = targetNeuron;
        sourceNeuron.outgoingConnections.push(connection);
      }
    });
    
    calculateNeuronPositions(network.layers, rect.width, rect.height);
    drawNetwork(network, ctx, rect.width, rect.height);
    
    addConsoleMessage('Network re-drawn.');

  }, [weights, biases, mode, theme]); // Re-draw when mode or theme changes too
  
  
  if (!hasValidWeights || !hasValidBiases) {
    return (
      <VisualizerContainer>
        <CanvasContainer style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: theme.neutralText, textAlign: 'center' }}>
            <h3>Loading Network Parameters...</h3>
            <p>Waiting for training data or initial state.</p>
          </div>
        </CanvasContainer>
      </VisualizerContainer>
    );
  }

  return (
    <VisualizerContainer>
      <CanvasContainer>
        <canvas ref={canvasRef} />
        
        <DebugConsole>
          {consoleMessages.map((msg, index) => (
            <ConsoleLine key={index}>&gt; {msg}</ConsoleLine>
          ))}
        </DebugConsole>
      </CanvasContainer>
    </VisualizerContainer>
  );
};

export default NeuralNetworkVisualizer;