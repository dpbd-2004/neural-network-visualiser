// frontend/src/components/NeuralNetworkVisualizer.tsx
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme, ModelMode } from '../contexts/ThemeContext'; // <-- Import our theme and mode

// --- Types ---
type NeuronType = 'input' | 'hidden' | 'output';

interface Neuron {
  id: string;
  type: NeuronType;
  bias: number | null;
  x: number;
  y: number;
}

interface Connection {
  sourceId: string;
  targetId: string;
  weight: number;
  id: string;
}

interface NetworkArchitecture {
  layers: Neuron[][];
  connections: Connection[];
}

interface NeuralNetworkVisualizerProps {
  weights: Record<string, number[][]>;
  biases: Record<string, number[][]>;
  mode: ModelMode; // <-- Added mode prop
  epoch?: number;
}

// --- Styled Components (from bhaskar-nie, adapted for our theme) ---

const VisualizerContainer = styled.div`
  width: 100%;
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px ${props => props.theme.darkShadow};
  transition: all 0.3s ease;
`;

const VisualizationTitle = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 20px;
  color: ${props => props.theme.text}; // Use theme text
  text-align: center;
  font-weight: 600;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.theme.background}; // Use theme background
  box-shadow: inset 0 0 10px ${props => props.theme.darkShadow};
  
  canvas {
    width: 100%;
    display: block;
    margin: 0 auto;
    min-height: 350px;
  }
`;

// --- Canvas Drawing Logic ---

const NeuronRadius = 25;

// Static colors (Green/Red for weights, Blue/Red for bias)
const colors = {
  weightPositive: 'rgba(0, 255, 136, 0.7)',
  weightNegative: 'rgba(255, 85, 102, 0.7)',
  biasPositive: '#00c3ff',
  biasNegative: '#ff5566',
  neuronBorder: '#ffffff',
  labelColor: '#ffffff',
  inputNeuron: '#444444', // Neutral input
};

// Build the network architecture from weights and biases
const buildNetworkArchitecture = (
  weights: Record<string, number[][]>,
  biases: Record<string, number[][]>,
  mode: ModelMode
): NetworkArchitecture => {
  const layers: Neuron[][] = [];
  const connections: Connection[] = [];

  const inputLabels = mode === 'classification' ? ['CGPA', 'IQ'] : ['Study', 'Go Out'];
  const outputLabel = mode === 'classification' ? 'Placed' : 'Grade';

  // --- Create Neurons ---
  // Input Layer
  const inputNeurons: Neuron[] = [
    { id: 'i1', type: 'input', bias: 0, x: 0, y: 0, },
    { id: 'i2', type: 'input', bias: 0, x: 0, y: 0, }
  ];
  layers.push(inputNeurons);

  // Hidden Layer
  const hiddenNeurons: Neuron[] = [
    { id: 'h1', type: 'hidden', bias: biases.b1[0][0], x: 0, y: 0, },
    { id: 'h2', type: 'hidden', bias: biases.b1[1][0], x: 0, y: 0, }
  ];
  layers.push(hiddenNeurons);

  // Output Layer
  const outputNeurons: Neuron[] = [
    { id: 'o1', type: 'output', bias: biases.b2[0][0], x: 0, y: 0, }
  ];
  layers.push(outputNeurons);

  // --- Create Connections ---
  // Input to Hidden (W1)
  // w11 (i1 -> h1)
  connections.push({ id: 'w1', sourceId: 'i1', targetId: 'h1', weight: weights.W1[0][0] });
  // w12 (i2 -> h1)
  connections.push({ id: 'w2', sourceId: 'i2', targetId: 'h1', weight: weights.W1[0][1] });
  // w21 (i1 -> h2)
  connections.push({ id: 'w3', sourceId: 'i1', targetId: 'h2', weight: weights.W1[1][0] });
  // w22 (i2 -> h2)
  connections.push({ id: 'w4', sourceId: 'i2', targetId: 'h2', weight: weights.W1[1][1] });

  // Hidden to Output (W2)
  // w31 (h1 -> o1)
  connections.push({ id: 'w5', sourceId: 'h1', targetId: 'o1', weight: weights.W2[0][0] });
  // w32 (h2 -> o1)
  connections.push({ id: 'w6', sourceId: 'h2', targetId: 'o1', weight: weights.W2[1][0] });

  return { layers, connections };
};

// Calculate positions
const calculateNeuronPositions = (layers: Neuron[][], width: number, height: number): void => {
  const layerSpacing = (width - 100) / (layers.length - 1);
  layers.forEach((layer, layerIndex) => {
    const layerX = 50 + layerIndex * layerSpacing;
    const neuronSpacing = height / (layer.length + 1);
    layer.forEach((neuron, neuronIndex) => {
      neuron.x = layerX;
      neuron.y = (neuronIndex + 1) * neuronSpacing;
    });
  });
};

// Draw Neuron
const drawNeuron = (ctx: CanvasRenderingContext2D, neuron: Neuron, label: string) => {
  ctx.beginPath();
  ctx.arc(neuron.x, neuron.y, NeuronRadius, 0, 2 * Math.PI);
  
  // Fill (theme aware)
  ctx.fillStyle = ctx.canvas.dataset.themeBackground || '#121212';
  ctx.fill();

  // Border
  if (neuron.type === 'input') {
    ctx.strokeStyle = colors.inputNeuron;
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = neuron.bias! > 0 ? colors.biasPositive : colors.biasNegative;
    ctx.lineWidth = 3;
    // Shadow
    ctx.shadowColor = neuron.bias! > 0 ? colors.biasPositive : colors.biasNegative;
    ctx.shadowBlur = 15;
  }
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset shadow

  // Text Label
  ctx.fillStyle = ctx.canvas.dataset.themeText || '#f5f5f5';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, neuron.x, neuron.y - 8);
  
  // Bias Label (if not input)
  if (neuron.type !== 'input') {
    ctx.font = '11px "Roboto Mono", monospace';
    ctx.fillStyle = ctx.canvas.dataset.themeNeutralText || '#bdbdbd';
    ctx.fillText(`b: ${neuron.bias!.toFixed(2)}`, neuron.x, neuron.y + 10);
  }
};

// Draw Connection
const drawConnection = (
  ctx: CanvasRenderingContext2D,
  from: Neuron,
  to: Neuron,
  weight: number
) => {
  const weightColor = weight > 0 ? colors.weightPositive : colors.weightNegative;
  ctx.strokeStyle = weightColor;
  ctx.lineWidth = Math.min(6, Math.max(1, Math.abs(weight) * 2));
  ctx.globalAlpha = 0.7;

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  
  // Reset alpha
  ctx.globalAlpha = 1.0;

  // Draw Weight Label
  ctx.save();
  ctx.translate((from.x + to.x) / 2, (from.y + to.y) / 2);
  ctx.fillStyle = ctx.canvas.dataset.themeText || '#f5f5f5';
  ctx.font = '11px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(weight.toFixed(2), 0, -5);
  ctx.restore();
};

// --- Main Component ---
export const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
  weights,
  biases,
  mode,
  epoch = 0 // epoch is not used in this version but kept for compatibility
}) => {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme(); // Get theme from context

  // Add validation
  const hasValidWeights = weights && typeof weights === 'object' && 'W1' in weights && 'W2' in weights;
  const hasValidBiases = biases && typeof biases === 'object' && 'b1' in biases && 'b2' in biases;

  useEffect(() => {
    if (!hasValidWeights || !hasValidBiases) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // --- Pass theme colors to canvas for drawing ---
    canvas.dataset.themeBackground = theme.background;
    canvas.dataset.themeText = theme.text;
    canvas.dataset.themeNeutralText = theme.neutralText;

    // --- High DPI Scaling ---
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = 350; // Fixed height
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    ctx.scale(dpr, dpr);
    // --- End Scaling ---

    const network = buildNetworkArchitecture(weights, biases, mode);
    calculateNeuronPositions(network.layers, canvasWidth, canvasHeight);

    // --- Draw Loop ---
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Draw Connections (behind neurons)
    const neuronMap = new Map<string, Neuron>();
    network.layers.flat().forEach(n => neuronMap.set(n.id, n));
    
    network.connections.forEach(conn => {
      const from = neuronMap.get(conn.sourceId);
      const to = neuronMap.get(conn.targetId);
      if (from && to) {
        drawConnection(ctx, from, to, conn.weight);
      }
    });

    // 2. Draw Neurons (on top)
    const labels = {
      classification: { i1: 'CGPA', i2: 'IQ', h1: 'H1', h2: 'H2', o1: 'Placed' },
      regression: { i1: 'Study', i2: 'Go Out', h1: 'H1', h2: 'H2', o1: 'Grade' }
    };
    const currentLabels = labels[mode];
    
    network.layers.flat().forEach(neuron => {
      drawNeuron(ctx, neuron, currentLabels[neuron.id as keyof typeof currentLabels]);
    });
    
  // Re-draw when any of these change
  }, [weights, biases, mode, theme, hasValidWeights, hasValidBiases]);

  if (!hasValidWeights || !hasValidBiases) {
    return (
      <VisualizerContainer>
        <p>Error: Invalid weights or biases data.</p>
      </VisualizerContainer>
    );
  }

  return (
    <VisualizerContainer>
      <CanvasContainer>
        {/* We use 800x350 as the *base* resolution, but it will scale */}
        <canvas ref={canvasRef} width={800} height={350} />
      </CanvasContainer>
    </VisualizerContainer>
  );
};

export default NeuralNetworkVisualizer;