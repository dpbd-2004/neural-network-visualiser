import React, { useState } from "react";
import styled from "styled-components";
import { Parameters } from "../types";
import NeuralNetworkVisualizer from "../components/NeuralNetworkVisualizer";

//--- Styled Components (with updates for disabled state and status text) ---
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  font-family: sans-serif;
  color: #333;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 800px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  margin-top: 1rem;
  font-style: italic;
  color: #666;
  height: 20px; // Reserve space to prevent layout shift
`;

//--- React Component ---

const TrainingPage: React.FC = () => {
  // State for UI controls
  const [epochs, setEpochs] = useState(1000);
  const [learningRate, setLearningRate] = useState(0.01);

  // State for the network's data
  const [parameters, setParameters] = useState<Parameters | null>(null);
  const [loss, setLoss] = useState<number | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  // --- THIS IS THE CORRECTED FUNCTION ---
  const handleStartTraining = async () => {
    setIsTraining(true);
    setLoss(null);
    setParameters(null);

    const url = "http://127.0.0.1:5000/train";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epochs, learning_rate: learningRate }),
      });

      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedData = ""; // Buffer for incomplete data

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Add the new chunk to our buffer
        receivedData += decoder.decode(value, { stream: true });

        // Process all complete JSON objects in the buffer
        const chunks = receivedData.split("\n");

        // The last element might be an incomplete chunk, so we keep it for the next iteration.
        receivedData = chunks.pop() || "";

        for (const chunk of chunks) {
          if (chunk.trim() === "") continue;
          try {
            const data = JSON.parse(chunk);
            // This is where the state is updated for each step
            setParameters(data.parameters);
            setLoss(data.loss);
          } catch (e) {
            console.warn("Failed to parse JSON chunk:", chunk);
          }
        }
      }
    } catch (error) {
      console.error("Error during training:", error);
      alert("Failed to connect to the backend. Is the Python server running?");
    } finally {
      setIsTraining(false);
    }
  };

  const handleReset = () => {
    setParameters(null);
    setLoss(null);
    setIsTraining(false);
  };

  return (
    <PageContainer>
      <h1>Neural Network Training</h1>
      <ControlsContainer>
        <ControlGroup>
          <label htmlFor="epochs">Epochs: {epochs}</label>
          <input
            type="range"
            id="epochs"
            min="100"
            max="10000"
            step="100"
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
            disabled={isTraining}
          />
        </ControlGroup>
        <ControlGroup>
          <label htmlFor="learningRate">Learning Rate: {learningRate}</label>
          <input
            type="range"
            id="learningRate"
            min="0.001"
            max="0.1"
            step="0.001"
            value={learningRate}
            onChange={(e) => setLearningRate(Number(e.target.value))}
            disabled={isTraining}
          />
        </ControlGroup>
        <ButtonGroup>
          <Button onClick={handleStartTraining} disabled={isTraining}>
            {isTraining ? "Training..." : "Start Training"}
          </Button>
          <Button
            onClick={handleReset}
            style={{ backgroundColor: "#6c757d" }}
            disabled={isTraining}
          >
            Reset
          </Button>
        </ButtonGroup>
      </ControlsContainer>

      <NeuralNetworkVisualizer parameters={parameters} />

      <StatusText>
        {isTraining && "Training in progress..."}
        {loss !== null && !isTraining && `Final Loss: ${loss.toFixed(4)}`}
      </StatusText>
    </PageContainer>
  );
};

export default TrainingPage;

// import React from 'react';

// const TrainingPage: React.FC = () => {
//   return (
//     <div>
//       <h1>Neural Network Training</h1>
//       <p>This is where the training controls and visualization will go.</p>
//     </div>
//   );
// };

// export default TrainingPage;
