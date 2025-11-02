// frontend/src/components/ParametersDisplay.tsx
import React, { useState } from 'react';
import styled, { css } from 'styled-components';

interface ParametersDisplayProps {
  weights: Record<string, number[][]>;
  biases: Record<string, number[][]>;
}

// --- Styled Components (Enhanced) ---

const MatrixContainer = styled.div`
  width: 100%;
  background-color: ${props => props.theme.background};
  border-radius: 8px;
  padding: 16px;
  border: 1px solid ${props => props.theme.border};
  transition: all 0.3s ease;
`;

const MatrixTabs = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const MatrixTab = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  background-color: transparent;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.neutralText};
  border: none;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 1rem;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px; /* Sits on top of the container's border */
    left: 0;
    width: 100%;
    height: 2px;
    background-color: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
    transition: all 0.2s ease;
  }
`;

const MatrixLabel = styled.h4`
  color: ${props => props.theme.neutralText};
  font-weight: 500;
  margin-bottom: 10px;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const MatrixGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

// --- This is the main styling change ---
const MatrixCell = styled.div<{ $value: number }>`
  padding: 12px;
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: #FFFFFF; /* Always white text for contrast */
  transition: all 0.2s ease;
  
  /* Apply color based on value */
  ${props => {
    const intensity = Math.min(Math.abs(props.$value) * 0.5, 1);
    const color = props.$value >= 0 
      ? props.theme.colors.primary // Green/Blue
      : props.theme.colors.danger;  // Red
    
    // Convert hex to rgb for rgba
    let c: any = color.substring(1).match(/.{1,2}/g);
    c = c.map((hex: string) => parseInt(hex, 16));
    const rgb = c.join(',');

    return css`
      background-color: rgba(${rgb}, ${0.4 + intensity * 0.6});
      border: 1px solid rgba(${rgb}, 1);
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
      box-shadow: 0 4px 10px rgba(${rgb}, 0.2);
    `;
  }}
  
  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 15px ${props => {
      const color = props.$value >= 0 ? props.theme.colors.primary : props.theme.colors.danger;
      let c: any = color.substring(1).match(/.{1,2}/g);
      c = c.map((hex: string) => parseInt(hex, 16));
      return `rgba(${c.join(',')}, 0.4)`;
    }};
  }
`;

// Helper function to format values
const formatValue = (value: number) => {
  return value.toFixed(4);
};

const ParametersDisplay: React.FC<ParametersDisplayProps> = ({ weights, biases }) => {
  const [activeTab, setActiveTab] = useState<'weights' | 'biases'>('weights');

  return (
    <MatrixContainer>
      <MatrixTabs>
        <MatrixTab 
          $active={activeTab === 'weights'} 
          onClick={() => setActiveTab('weights')}
        >
          Weights
        </MatrixTab>
        <MatrixTab 
          $active={activeTab === 'biases'} 
          onClick={() => setActiveTab('biases')}
        >
          Biases
        </MatrixTab>
      </MatrixTabs>
      
      {activeTab === 'weights' && (
        <>
          <MatrixLabel>W1 (Input → Hidden)</MatrixLabel>
          <MatrixGrid>
            {weights.W1 && weights.W1.map((row, rowIdx) => (
              row.map((val, colIdx) => (
                <MatrixCell key={`w1-${rowIdx}-${colIdx}`} $value={val}>
                  w{rowIdx * 2 + colIdx + 1}: {formatValue(val)}
                </MatrixCell>
              ))
            ))}
          </MatrixGrid>
          
          <MatrixLabel>W2 (Hidden → Output)</MatrixLabel>
          <MatrixGrid>
            {weights.W2 && weights.W2.map((row, rowIdx) => (
              row.map((val, colIdx) => (
                <MatrixCell key={`w2-${rowIdx}-${colIdx}`} $value={val}>
                  w{weights.W1[0].length * 2 + rowIdx + 1}: {formatValue(val)}
                </MatrixCell>
              ))
            ))}
          </MatrixGrid>
        </>
      )}
      
      {activeTab === 'biases' && (
        <>
          <MatrixLabel>b1 (Hidden Biases)</MatrixLabel>
          <MatrixGrid>
            {biases.b1 && biases.b1.map((row, rowIdx) => (
              <MatrixCell key={`b1-${rowIdx}`} $value={row[0]}>
                b{rowIdx + 1}: {formatValue(row[0])}
              </MatrixCell>
            ))}
          </MatrixGrid>
          
          <MatrixLabel>b2 (Output Bias)</MatrixLabel>
          <MatrixGrid>
            {biases.b2 && biases.b2.map((row, rowIdx) => (
              <MatrixCell key={`b2-${rowIdx}`} $value={row[0]}>
                b{biases.b1.length + 1}: {formatValue(row[0])}
              </MatrixCell>
            ))}
          </MatrixGrid>
        </>
      )}
    </MatrixContainer>
  );
};

export default ParametersDisplay;