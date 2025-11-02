// frontend/src/pages/PredictionPage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import { predict, getModelState } from '../services/api'; // <-- Import getModelState
import { PredictionFormData, PredictionResult } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import NeuralNetworkVisualizer from '../components/NeuralNetworkVisualizer'; // <-- Import Visualizer

// --- Styled Components (No changes, same as before) ---

const PageContainer = styled.div`
  padding: 25px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 35px;
  color: ${props => props.theme.text};
  position: relative;
  letter-spacing: 1.5px;
  text-shadow: 0 0 20px ${props => props.theme.colors.primary}90;
  font-weight: 800;
  transition: text-shadow 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 3px;
    background: ${props => props.theme.primaryGradient};
    border-radius: 3px;
    box-shadow: 0 0 10px ${props => props.theme.colors.primary}c0;
    transition: all 0.3s ease;
  }
`;

const BaseCard = styled.div`
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px ${props => props.theme.colors.primary}10;
  border: 1px solid ${props => props.theme.colors.primary}40;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, ${props => props.theme.colors.primary}70, transparent);
    transition: all 0.3s ease;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 25px;
  color: ${props => props.theme.text};
  position: relative;
  display: inline-block;
  text-shadow: 0 0 10px ${props => props.theme.colors.primary}70;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, ${props => props.theme.colors.primary}, transparent);
    border-radius: 2px;
    transition: all 0.3s ease;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 1rem;
  color: ${props => props.theme.neutralText};
  margin-bottom: 8px;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 12px 15px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.primary}40;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 15px ${props => props.theme.colors.primary}50;
  }
`;

const Button = styled.button`
  padding: 14px 20px;
  border-radius: 8px;
  border: none;
  background: ${props => props.theme.primaryGradient};
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  box-shadow: 0 5px 15px ${props => props.theme.colors.primary}30;
  margin-top: 10px;
  
  &:hover {
    box-shadow: 0 8px 25px ${props => props.theme.colors.primary}60;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #555;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: ${props => props.theme.colors.danger}15;
  border: 1px solid ${props => props.theme.colors.danger};
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
`;

const ResultContainer = styled(BaseCard)`
  margin-top: 30px;
  text-align: center;
`;

const ResultLabel = styled.h2<{ $color: string }>`
  font-size: 2.2rem;
  font-weight: 800;
  color: ${props => props.$color};
  text-shadow: 0 0 20px ${props => props.$color}80;
  margin-bottom: 20px;
  letter-spacing: 1px;
  transition: all 0.3s ease;
`;

const ResultProbability = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.neutralText};
  margin-bottom: 25px;
  
  span {
    font-weight: bold;
    color: ${props => props.theme.text};
  }
`;

const ResultDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  text-align: left;
  font-size: 0.9rem;
  color: ${props => props.theme.neutralText};
  
  span {
    font-weight: 600;
    color: ${props => props.theme.text};
    margin-right: 5px;
    text-transform: capitalize;
  }
`;

// --- NEW Visualizer container ---
const VisualizerContainer = styled(BaseCard)`
  margin-top: 30px;
`;


// --- Dynamic Form Component ---
const PredictionForm: React.FC<{
  mode: 'classification' | 'regression',
  onSubmit: (data: PredictionFormData) => void,
  loading: boolean
}> = ({ mode, onSubmit, loading }) => {
  
  const isClassification = mode === 'classification';
  
  // Define form fields based on mode
  const fields = isClassification ?
    [
      { name: 'cgpa', label: 'CGPA (1.0 - 10.0)', rules: { required: true, min: 1.0, max: 10.0 }, step: 0.1 },
      { name: 'iq', label: 'IQ (1 - 200)', rules: { required: true, min: 1, max: 200 }, step: 1 }
    ] :
    [
      { name: 'studytime_hours', label: 'Study Time (Hours)', rules: { required: true, min: 0, max: 24 }, step: 0.5 },
      { name: 'goout_hours', label: 'Go Out Time (Hours)', rules: { required: true, min: 0, max: 40 }, step: 0.5 }
    ];
  
  const defaultValues = isClassification ? { cgpa: 8.0, iq: 100 } : { studytime_hours: 5, goout_hours: 10 };

  const { control, handleSubmit, formState: { errors } } = useForm<PredictionFormData>({
    defaultValues: defaultValues,
    key: mode // <-- Add key to force re-render on mode change
  });

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {fields.map(field => (
        <FormGroup key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Controller
            name={field.name}
            control={control}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                type="number"
                step={field.step}
                id={field.name}
                disabled={loading}
                onChange={(e) => controllerField.onChange(parseFloat(e.target.value))} // Ensure value is number
              />
            )}
          />
          {errors[field.name] && <ErrorMessage>{`${field.name} is required (${field.rules.min} - ${field.rules.max}).`}</ErrorMessage>}
        </FormGroup>
      ))}
      <Button type="submit" disabled={loading}>
        {loading ? 'Predicting...' : (isClassification ? 'Predict Placement' : 'Predict Grade')}
      </Button>
    </Form>
  );
};

const PredictionPage: React.FC = () => {
  const { modelMode, theme } = useTheme(); // <-- Get mode and theme
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // --- THIS IS THE NEW FEATURE ---
  // State to hold the model's parameters
  const [networkParams, setNetworkParams] = useState<{ weights: any, biases: any } | null>(null);
  // --- END NEW FEATURE ---

  const isClassification = modelMode === 'classification';

  // Clear results when mode changes
  useEffect(() => {
    setResult(null);
    setError(null);
    setNetworkParams(null); // <-- Clear params on mode change
  }, [modelMode]);

  const onSubmit = async (data: PredictionFormData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setNetworkParams(null); // <-- Clear params on new prediction

    try {
      // 1. Make the prediction
      const response = await predict(data, modelMode);
      setResult(response);
      
      // 2. --- THIS IS THE NEW FEATURE ---
      // If prediction is successful, fetch the model state
      try {
        const modelState = await getModelState(modelMode);
        setNetworkParams({
          weights: modelState.weights,
          biases: modelState.biases,
        });
      } catch (modelErr) {
        console.error("Failed to fetch model state:", modelErr);
        // Don't show an error, just fail to show the visualizer
      }
      // --- END NEW FEATURE ---

    } catch (err) {
      setError((err as Error).message || 'Failed to get prediction.');
      if ((err as Error).message.includes('Model not trained')) {
        setError(`Please train the ${modelMode} model on the "Training" page first.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine result color
  let resultColor = theme.colors.primary;
  if (result) {
    if (isClassification) {
      resultColor = result.prediction === 1 ? theme.colors.success : theme.colors.danger;
    } else {
      resultColor = theme.colors.primary; // Always primary red/blue for regression result
    }
  }

  return (
    <PageContainer>
      <PageTitle>Test Your {isClassification ? 'Classification' : 'Regression'} Model</PageTitle>
      
      <BaseCard>
        <CardTitle>Enter Your Data</CardTitle>
        <PredictionForm
          mode={modelMode}
          onSubmit={onSubmit}
          loading={loading}
        />
      </BaseCard>
      
      {error && <ErrorMessage style={{ marginTop: '30px' }}>{error}</ErrorMessage>}
      
      {result && (
        <ResultContainer>
          <CardTitle>Prediction Result</CardTitle>
          <ResultLabel $color={resultColor}>
            {isClassification ? result.label : result.prediction_label}
          </ResultLabel>
          
          {isClassification && result.probability !== undefined && (
            <ResultProbability>
              Confidence Score (Probability): <span>{(result.probability * 100).toFixed(2)}%</span>
            </ResultProbability>
          )}
          
          <ResultDetails>
            {Object.entries(result.input).map(([key, value]) => (
              <div key={key}><span>{key.replace(/_/g, ' ')}:</span> {value}</div>
            ))}
            {Object.entries(result.scaled_input).map(([key, value]) => (
              <div key={`scaled-${key}`}><span>Scaled {key.replace(/_/g, ' ')}:</span> {value.toFixed(4)}</div>
            ))}
          </ResultDetails>
        </ResultContainer>
      )}
      
      {/* --- THIS IS THE NEW FEATURE --- */}
      {/* Render the visualizer if we have a result AND network params */}
      {result && networkParams && (
        <VisualizerContainer>
          <CardTitle>Model State (Final Weights & Biases)</CardTitle>
          <NeuralNetworkVisualizer
            weights={networkParams.weights}
            biases={networkParams.biases}
            mode={modelMode}
          />
        </VisualizerContainer>
      )}
      {/* --- END NEW FEATURE --- */}
      
    </PageContainer>
  );
};

export default PredictionPage;