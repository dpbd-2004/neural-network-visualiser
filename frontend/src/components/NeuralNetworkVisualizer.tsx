// frontend/src/components/NeuralNetworkVisualizer.tsx
import React from 'react';
import styled, { css } from 'styled-components';
import { ModelMode } from '../contexts/ThemeContext';

// --- Types ---
interface NeuronProps {
  bias: number;
}

interface WeightProps {
  weight: number;
}

interface VisualizerProps {
  weights: Record<string, number[][]>;
  biases: Record<string, number[][]>;
  mode: ModelMode;
}

// --- Styled Components (Rebuilt to match bhaskar-nie layout) ---

const VisualizerContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 40px 20px;
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
  position: relative;
  min-height: 350px; /* Adjusted height */
  min-width: 500px;  /* Added min-width */
  overflow-x: auto; /* Added scroll */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px ${props => props.theme.colors.primary}10;
  transition: all 0.3s ease;
`;

const Layer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  position: relative;
`;

const LayerTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.neutralText};
  margin-bottom: 25px;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 0 0 10px ${props => props.theme.colors.primary}70;
  transition: all 0.3s ease;
  position: absolute; /* Position title at the top */
  top: -15px;
`;

const Neuron = styled.div<NeuronProps & { isOutput?: boolean }>`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  
  /* --- Static Colors (like original) --- */
  border: 3px solid ${props => (props.bias > 0 ? '#00c3ff' : '#ff5566')};
  box-shadow: 0 0 20px ${props => (props.bias > 0 ? 'rgba(0, 195, 255, 0.5)' : 'rgba(255, 85, 102, 0.5)')};

  /* --- Label Alignment (like original) --- */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  margin: 40px 0; /* Increased margin to fit titles */
  font-weight: bold;
  position: relative;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  /* Output neuron bias color override */
  ${props => props.isOutput && css`
    border-color: ${props.bias > 0 ? '#00c3ff' : '#ff5566'};
    box-shadow: 0 0 20px ${props.bias > 0 ? 'rgba(0, 195, 255, 0.5)' : 'rgba(255, 85, 102, 0.5)'};
  `}
`;

const NeuronLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
`;

const NeuronBias = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.neutralText};
  margin-top: 2px;
`;

const SvgContainer = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  min-width: 500px; /* Ensure SVG is wide enough */
`;

const WeightLine = styled.line<WeightProps>`
  /* --- Static Colors (like original) --- */
  stroke: ${props => (props.weight > 0 ? 'rgba(0, 255, 136, 0.7)' : 'rgba(255, 85, 102, 0.7)')};
  stroke-width: ${props => Math.min(6, Math.max(1, Math.abs(props.weight) * 2))};
  opacity: 0.7;
  transition: all 0.3s ease;
`;

const WeightLabel = styled.text`
  font-size: 11px;
  fill: ${props => props.theme.text};
  text-anchor: middle;
  transition: all 0.3s ease;
`;

// --- Component ---

const NeuralNetworkVisualizer: React.FC<VisualizerProps> = ({ weights, biases, mode }) => {
  if (!weights.W1 || !biases.b1 || !weights.W2 || !biases.b2) {
    return <VisualizerContainer>Loading network state...</VisualizerContainer>;
  }

  const isClassification = mode === 'classification';

  // --- Dynamic Labels ---
  const input1Label = isClassification ? "CGPA" : "Study";
  const input2Label = isClassification ? "IQ" : "Go Out";
  const outputLabel = isClassification ? "Placed" : "Grade";
  const outputNeuronType = isClassification ? "Sigmoid" : "Linear";

  // Extract weights and biases
  const w11 = weights.W1[0][0];
  const w12 = weights.W1[0][1];
  const w21 = weights.W1[1][0];
  const w22 = weights.W1[1][1];
  const w31 = weights.W2[0][0];
  const w32 = weights.W2[1][0];

  const b1 = biases.b1[0][0];
  const b2 = biases.b1[1][0];
  const b3 = biases.b2[0][0];

  // --- THIS IS THE FIX ---
  // Hard-coded positions to match the exact layout of the screenshot
  const pos = {
    i1: { x: 50, y: 110 },  // Top input
    i2: { x: 50, y: 240 },  // Bottom input
    h1: { x: 250, y: 110 }, // Top hidden
    h2: { x: 250, y: 240 }, // Bottom hidden
    o1: { x: 450, y: 175 }, // Centered output (110 + 240) / 2 = 175
  };

  const lines = [
    { x1: pos.i1.x + 35, y1: pos.i1.y, x2: pos.h1.x - 35, y2: pos.h1.y, weight: w11, label: "w1" },
    { x1: pos.i2.x + 35, y1: pos.i2.y, x2: pos.h1.x - 35, y2: pos.h1.y, weight: w12, label: "w2" },
    { x1: pos.i1.x + 35, y1: pos.i1.y, x2: pos.h2.x - 35, y2: pos.h2.y, weight: w21, label: "w3" },
    { x1: pos.i2.x + 35, y1: pos.i2.y, x2: pos.h2.x - 35, y2: pos.h2.y, weight: w22, label: "w4" },
    { x1: pos.h1.x + 35, y1: pos.h1.y, x2: pos.o1.x - 35, y2: pos.o1.y, weight: w31, label: "w5" },
    { x1: pos.h2.x + 35, y1: pos.h2.y, x2: pos.o1.x - 35, y2: pos.o1.y, weight: w32, label: "w6" },
  ];

  return (
    <VisualizerContainer>
      <SvgContainer>
        {lines.map((line) => (
          <g key={line.label}>
            <WeightLine
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              weight={line.weight}
            />
            <WeightLabel
              x={(line.x1 + line.x2) / 2}
              y={(line.y1 + line.y2) / 2 - 5}
            >
              {line.weight.toFixed(2)}
            </WeightLabel>
          </g>
        ))}
      </SvgContainer>

      <Layer>
        <LayerTitle>Input</LayerTitle>
        <Neuron bias={0} style={{ borderColor: '#444', boxShadow: 'none' }}>
          <NeuronLabel>{input1Label}</NeuronLabel>
        </Neuron>
        <Neuron bias={0} style={{ borderColor: '#444', boxShadow: 'none' }}>
          <NeuronLabel>{input2Label}</NeuronLabel>
        </Neuron>
      </Layer>

      <Layer>
        <LayerTitle>Hidden (Sigmoid)</LayerTitle>
        <Neuron bias={b1}>
          <NeuronLabel>H1</NeuronLabel>
          <NeuronBias>b: {b1.toFixed(2)}</NeuronBias>
        </Neuron>
        <Neuron bias={b2}>
          <NeuronLabel>H2</NeuronLabel>
          <NeuronBias>b: {b2.toFixed(2)}</NeuronBias>
        </Neuron>
      </Layer>

      <Layer>
        <LayerTitle>Output ({outputNeuronType})</LayerTitle>
        <Neuron bias={b3} isOutput>
          <NeuronLabel>{outputLabel}</NeuronLabel>
          <NeuronBias>b: {b3.toFixed(2)}</NeuronBias>
        </Neuron>
      </Layer>
    </VisualizerContainer>
  );
};

export default NeuralNetworkVisualizer;