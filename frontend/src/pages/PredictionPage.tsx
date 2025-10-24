import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { predict, getTrainingStatus } from '../services/api';
import type { PredictionResult, TrainingStatus } from '../types';
import { NeuralNetworkVisualizer } from '../components/NeuralNetworkVisualizer';

// Updated styles for PredictionPage
const PageContainer = styled.div`
  padding: 25px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  background-color: #050a15;
  color: #e0e6ff;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 35px;
  color: #ffffff;
  position: relative;
  letter-spacing: 1.5px;
  text-shadow: 0 0 20px rgba(0, 195, 255, 0.6);
  font-weight: 800;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 3px;
    background: linear-gradient(90deg, #0077ff, #00f7ff, #8300ff);
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(0, 195, 255, 0.8);
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 30px;
`;

const FormContainer = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 100, 255, 0.1);
  margin-bottom: 30px;
  border: 1px solid rgba(0, 150, 255, 0.25);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(0, 195, 255, 0.5), transparent);
  }
`;

const PredictionForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 8px;
  color: #e0e6ff;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 15px;
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
  background-color: rgba(5, 15, 30, 0.7);
  color: #e0e6ff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(0, 50, 150, 0.1) inset;
  
  &:focus {
    border-color: #00c3ff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 195, 255, 0.25), 0 0 15px rgba(0, 100, 255, 0.2) inset;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button<{ disabled?: boolean }>`
  padding: 12px 25px;
  background: linear-gradient(135deg, #0052d4, #4364f7, #6fb1fc);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  text-shadow: 0 0 10px rgba(0, 100, 255, 0.5);
  
  &::before {
    content: "🔍";
    font-size: 1.2rem;
  }

  &:hover {
    background: linear-gradient(135deg, #0077ff, #00c3ff);
    transform: ${props => props.disabled ? 'none' : 'translateY(-3px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 6px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 120, 255, 0.3)'};
    
    &::before {
      left: 100%;
    }
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultContainer = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 28px;
  margin-top: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 100, 255, 0.1);
  border: 1px solid rgba(0, 150, 255, 0.25);
  position: relative;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: #e0e6ff;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(0, 195, 255, 0.5);
    
    &::before {
      content: '🎯';
      font-size: 1.5rem;
    }
  }
`;

const PredictionResult = styled.div<{ prediction: number }>`
  font-size: 1.8rem;
  margin: 25px 0;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  background-color: ${props => props.prediction === 1 ? 'rgba(0, 200, 100, 0.2)' : 'rgba(255, 50, 50, 0.2)'};
  border: 2px solid ${props => props.prediction === 1 ? 'rgba(0, 200, 100, 0.5)' : 'rgba(255, 50, 50, 0.5)'};
  color: ${props => props.prediction === 1 ? '#4caf50' : '#f44336'};
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  
  span {
    font-size: 3rem;
    margin-bottom: 10px;
  }
`;

const VisualizationContainer = styled.div`
  margin-top: 30px;
  width: 100%;
  
  h3 {
    font-size: 1.5rem;
    text-align: center;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #e0e6ff;
    text-shadow: 0 0 10px rgba(0, 150, 255, 0.3);
    
    &::before {
      content: "🧠";
      font-size: 1.3rem;
    }
  }
`;

const ProbabilityContainer = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ProbabilityLabel = styled.div`
  font-weight: 500;
  margin-bottom: 10px;
  color: #c0c6ee;
`;

const ProbabilityBar = styled.div`
  width: 100%;
  height: 25px;
  background-color: rgba(5, 15, 30, 0.7);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.2);
  margin-bottom: 5px;
`;

const ProbabilityFill = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(90deg, #0077ff, #00c3ff);
  border-radius: 12px;
  transition: width 0.5s ease-out;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: wave 2s infinite linear;
  }
  
  @keyframes wave {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const InputDetails = styled.div`
  margin-top: 20px;
  background-color: rgba(5, 15, 30, 0.7);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(0, 150, 255, 0.2);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  
  label {
    font-size: 0.9rem;
    color: #a0a6ce;
    margin-bottom: 5px;
  }
  
  span {
    font-family: 'Roboto Mono', monospace;
    color: #e0e6ff;
    font-size: 1.1rem;
  }
`;

const NoticeContainer = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-left: 4px solid #00c3ff;
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #e0e6ff;
  
  &::before {
    content: "💡";
    font-size: 1.5rem;
    margin-right: 10px;
  }
`;

const ErrorContainer = styled.div`
  color: #f44336;
  text-align: center;
  padding: 20px;
  border: 1px solid rgba(255, 50, 50, 0.5);
  border-radius: 8px;
  margin: 20px auto;
  max-width: 600px;
  background-color: rgba(255, 50, 50, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &::before {
    content: "⚠️";
    font-size: 1.5rem;
  }
`;

const ResultHeader = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: #e0e6ff;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(0, 195, 255, 0.5);
  
  &::before {
    content: '🎯';
    font-size: 1.5rem;
  }
`;

const ResultContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PredictionPage: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    cgpa: 6.5,
    iq: 120,
  });

  // Prediction state
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Training status
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [isModelTrained, setIsModelTrained] = useState(false);

  // Check if model is trained
  useEffect(() => {
    const checkTrainingStatus = async () => {
      try {
        const status = await getTrainingStatus();
        setTrainingStatus(status);
        setIsModelTrained(status.progress_percentage === 100);
      } catch (error) {
        console.error('Failed to check training status:', error);
      }
    };

    checkTrainingStatus();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value),
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await predict(formData);
      setPredictionResult(result);
    } catch (error) {
      console.error('Prediction error:', error);
      setError('Failed to make prediction. Please ensure the model has been trained.');
      setPredictionResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Test Your Data</PageTitle>

      <SectionContainer>
        <FormContainer>
          <PredictionForm onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="cgpa">CGPA</Label>
              <Input
                type="number"
                id="cgpa"
                name="cgpa"
                min="0"
                max="10"
                step="0.1"
                value={formData.cgpa}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="iq">IQ Score</Label>
              <Input
                type="number"
                id="iq"
                name="iq"
                min="0"
                max="250"
                step="1"
                value={formData.iq}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </FormGroup>

            <ButtonContainer>
              <Button
                type="submit"
                disabled={isLoading || !isModelTrained}
              >
                {isLoading ? 'Predicting...' : 'Make Prediction'}
              </Button>
            </ButtonContainer>
          </PredictionForm>

          {!isModelTrained && (
            <NoticeContainer>
              Please complete training before testing input data.
            </NoticeContainer>
          )}
        </FormContainer>
      </SectionContainer>

      {error && (
        <ErrorContainer>{error}</ErrorContainer>
      )}

      {predictionResult && (
        <SectionContainer>
          <ResultContainer>
            <ResultHeader>Prediction Result</ResultHeader>
            <ResultContent>
              <PredictionResult prediction={predictionResult.prediction}>
                <span>{predictionResult.prediction === 1 ? '✅' : '❌'}</span>
                {predictionResult.label}
              </PredictionResult>
              
              <ProbabilityContainer>
                <ProbabilityLabel>Prediction Probability</ProbabilityLabel>
                <ProbabilityBar>
                  <ProbabilityFill width={predictionResult.probability * 100}>
                    {(predictionResult.probability * 100).toFixed(1)}%
                  </ProbabilityFill>
                </ProbabilityBar>
              </ProbabilityContainer>
              
              <InputDetails>
                <DetailItem>
                  <label>Input CGPA</label>
                  <span>{predictionResult.input.cgpa.toFixed(1)}</span>
                </DetailItem>
                <DetailItem>
                  <label>Input IQ</label>
                  <span>{predictionResult.input.iq.toFixed(0)}</span>
                </DetailItem>
                <DetailItem>
                  <label>Scaled CGPA</label>
                  <span>{predictionResult.scaled_input.cgpa.toFixed(3)}</span>
                </DetailItem>
                <DetailItem>
                  <label>Scaled IQ</label>
                  <span>{predictionResult.scaled_input.iq.toFixed(3)}</span>
                </DetailItem>
              </InputDetails>

              {trainingStatus?.current_weights && trainingStatus?.current_biases && (
                <VisualizationContainer>
                  <h3>Neural Network State</h3>
                  <NeuralNetworkVisualizer
                    weights={trainingStatus.current_weights}
                    biases={trainingStatus.current_biases}
                    inputValues={[predictionResult.scaled_input.cgpa, predictionResult.scaled_input.iq]}
                    width={700}
                    height={350}
                    epoch={1}
                    showWeightsOnArrows={true}
                  />
                </VisualizationContainer>
              )}
            </ResultContent>
          </ResultContainer>
        </SectionContainer>
      )}
    </PageContainer>
  );
};

export default PredictionPage; 