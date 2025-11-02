// frontend/src/components/ParametersDisplay.tsx
import React from 'react';
import styled from 'styled-components';

interface ParametersDisplayProps {
  weights: Record<string, number[][]>;
  biases: Record<string, number[][]>;
}

const ParamsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ParamBlock = styled.div`
  background-color: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 15px;
`;

const ParamTitle = styled.h4`
  color: ${props => props.theme.text};
  font-size: 1.1rem;
  margin-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 8px;
`;

const ParamList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
`;

const ParamItem = styled.li`
  display: flex;
  justify-content: space-between;
  color: ${props => props.theme.neutralText};
  margin-bottom: 5px;
  
  span:first-child {
    color: ${props => props.theme.text};
    margin-right: 10px;
  }
`;

const ParametersDisplay: React.FC<ParametersDisplayProps> = ({ weights, biases }) => {
  if (!weights.W1 || !biases.b1 || !weights.W2 || !biases.b2) {
    return <p>Parameters not loaded.</p>;
  }

  return (
    <ParamsGrid>
      <ParamBlock>
        <ParamTitle>Weights (W)</ParamTitle>
        <ParamList>
          <ParamItem><span>W1 [0,0] (i1→h1):</span> {weights.W1[0][0].toFixed(4)}</ParamItem>
          <ParamItem><span>W1 [0,1] (i2→h1):</span> {weights.W1[0][1].toFixed(4)}</ParamItem>
          <ParamItem><span>W1 [1,0] (i1→h2):</span> {weights.W1[1][0].toFixed(4)}</ParamItem>
          <ParamItem><span>W1 [1,1] (i2→h2):</span> {weights.W1[1][1].toFixed(4)}</ParamItem>
          <ParamItem><span>W2 [0,0] (h1→o1):</span> {weights.W2[0][0].toFixed(4)}</ParamItem>
          <ParamItem><span>W2 [1,0] (h2→o1):</span> {weights.W2[1][0].toFixed(4)}</ParamItem>
        </ParamList>
      </ParamBlock>
      <ParamBlock>
        <ParamTitle>Biases (b)</ParamTitle>
        <ParamList>
          <ParamItem><span>b1 [0,0] (h1):</span> {biases.b1[0][0].toFixed(4)}</ParamItem>
          <ParamItem><span>b1 [1,0] (h2):</span> {biases.b1[1][0].toFixed(4)}</ParamItem>
          <ParamItem><span>b2 [0,0] (o1):</span> {biases.b2[0][0].toFixed(4)}</ParamItem>
        </ParamList>
      </ParamBlock>
    </ParamsGrid>
  );
};

export default ParametersDisplay;