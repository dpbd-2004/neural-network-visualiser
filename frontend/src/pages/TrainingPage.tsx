// frontend/src/pages/TrainingPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { startTraining, getTrainingStatus, getModelState } from '../services/api';
import { TrainingFormData, TrainingStatus } from '../types';
import NeuralNetworkVisualizer from '../components/NeuralNetworkVisualizer';
import { useTheme } from '../contexts/ThemeContext';
import ParametersDisplay from '../components/ParametersDisplay'; // <-- Import new component

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// --- Styled Components ---

const PageContainer = styled.div`
  padding: 25px;
  max-width: 1400px;
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

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const BaseCard = styled.div`
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 25px;
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
  margin-bottom: 20px;
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

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 25px;
  background-color: ${props => props.theme.background};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.primary}40;
  overflow: hidden;
  margin-top: 15px;
  transition: border-color 0.3s ease;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background: ${props => props.theme.primaryGradient};
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: 12px;
  box-shadow: 0 0 10px ${props => props.theme.colors.primary}80;
`;

const StatusText = styled.div`
  margin-top: 15px;
  font-size: 0.9rem;
  color: ${props => props.theme.neutralText};
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 10px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${props => props.theme.background};
  padding: 15px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.primary}20;
  transition: border-color 0.3s ease;
`;

const StatValue = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  text-shadow: 0 0 10px ${props => props.theme.colors.primary}80;
  transition: all 0.3s ease;
`;

const StatLabel = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.neutralText};
  margin-top: 5px;
`;

const ChartContainer = styled.div`
  height: 300px;
  padding-bottom: 20px;
`;

const PlotImage = styled.img`
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.primary}40;
  margin-top: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: border-color 0.3s ease;
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

// --- NEW Component for Epoch Stats ---
const EpochStats = styled.div`
  display: flex;
  justify-content: space-around;
  text-align: center;
`;

const EpochStatItem = styled.div`
  color: ${props => props.theme.neutralText};
  font-size: 1rem;
  span {
    display: block;
    font-size: 1.8rem;
    font-weight: 700;
    color: ${props => props.theme.colors.primary};
    margin-bottom: 5px;
    transition: color 0.3s ease;
  }
`;
// --- End New Component ---


const TrainingPage: React.FC = () => {
  const { modelMode, theme } = useTheme(); // <-- Get mode and theme
  const isClassification = modelMode === 'classification';

  const { control, handleSubmit, formState: { errors }, watch } = useForm<TrainingFormData>({
    defaultValues: {
      learning_rate: 0.01,
      epochs: 100,
    },
  });

  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [metricHistory, setMetricHistory] = useState<number[]>([]); // For Accuracy or R2
  const [plotImage, setPlotImage] = useState<string | null>(null);
  const [networkParams, setNetworkParams] = useState<{ weights: any, biases: any } | null>(null);
  
  // Use 'watch' to get live value from form for the total epochs display
  const watchedEpochs = watch('epochs');
  const [totalEpochs, setTotalEpochs] = useState(watchedEpochs);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to clear all state
  const resetAllState = () => {
    setTrainingStatus(null);
    setIsTraining(false);
    setError(null);
    setLossHistory([]);
    setMetricHistory([]);
    setPlotImage(null);
    setNetworkParams(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Function to fetch initial model state
  const fetchInitialState = async () => {
    resetAllState(); // Clear state before fetching
    try {
      const state = await getModelState(modelMode); // <-- Pass mode
      setNetworkParams({
        weights: state.weights,
        biases: state.biases,
      });
      if (isClassification && state.decision_boundary) {
        setPlotImage(state.decision_boundary.image);
      } else if (!isClassification && state.prediction_surface) {
        setPlotImage(state.prediction_surface.image);
      }
    } catch (err) {
      console.error("Failed to fetch initial model state:", err);
      setError("Failed to connect to the backend.");
    }
  };

  // Fetch initial state on component mount AND when mode changes
  useEffect(() => {
    fetchInitialState();
  }, [modelMode]);
  
  // Update total epochs when form value changes
  useEffect(() => {
    setTotalEpochs(watchedEpochs);
  }, [watchedEpochs]);


  // Polling function
  const pollStatus = async () => {
    try {
      const status = await getTrainingStatus(modelMode); // <-- Pass mode
      setTrainingStatus(status);
      setError(status.error || null);

      if (status.loss) setLossHistory(prev => [...prev, status.loss]);
      
      if (isClassification && status.accuracy) {
        setMetricHistory(prev => [...prev, status.accuracy as number]);
      } else if (!isClassification && status.r2_score) {
        setMetricHistory(prev => [...prev, status.r2_score as number]);
      }

      if (status.current_weights && status.current_biases) {
        setNetworkParams({
          weights: status.current_weights,
          biases: status.current_biases,
        });
      }
      
      const newPlot = isClassification ? status.decision_boundary : status.prediction_surface;
      if (newPlot && typeof newPlot === 'object') {
        setPlotImage(newPlot.image);
      }

      if (!status.is_training) {
        setIsTraining(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      setError('Failed to get training status.');
      setIsTraining(false);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  };

  // Form submission handler
  const onSubmit = async (data: TrainingFormData) => {
    // Reset state for new training run
    resetAllState();
    setIsTraining(true);
    setTotalEpochs(data.epochs); // <-- Set total epochs
    
    setTrainingStatus({
      is_training: true, epoch: 0, total_epochs: data.epochs,
      loss: 0, progress_percentage: 0,
      accuracy: 0, r2_score: 0
    });

    try {
      await startTraining(data, modelMode); // <-- Pass mode
      pollIntervalRef.current = setInterval(pollStatus, 1000);
    } catch (err) {
      console.error('Failed to start training:', err);
      setError((err as Error).message || 'Failed to start training.');
      setIsTraining(false);
    }
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Data for charts
  const metricLabel = isClassification ? 'Accuracy' : 'R-squared (R2)';
  const chartData = {
    labels: Array.from({ length: lossHistory.length }, (_, i) => i + 1),
    datasets: [
      {
        label: isClassification ? 'Loss (Cross-Entropy)' : 'Loss (MSE)',
        data: lossHistory,
        borderColor: theme.colors.danger,
        backgroundColor: `${theme.colors.danger}30`,
        fill: true,
        tension: 0.2
      },
      {
        label: metricLabel,
        data: metricHistory,
        borderColor: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}30`,
        fill: true,
        tension: 0.2
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: theme.text, fontSize: 14 } },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.7)', titleColor: '#e0e6ff', bodyColor: '#e0e6ff' },
    },
    scales: {
      x: { ticks: { color: theme.neutralText }, grid: { color: theme.border } },
      y: { ticks: { color: theme.neutralText }, grid: { color: theme.border } },
    },
  };

  return (
    <PageContainer>
      <PageTitle>
        Train Your {isClassification ? 'Classification' : 'Regression'} Network
      </PageTitle>
      
      <MainGrid>
        <LeftColumn>
          <BaseCard>
            <CardTitle>Hyperparameters</CardTitle>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label htmlFor="learning_rate">Learning Rate (α)</Label>
                <Controller
                  name="learning_rate"
                  control={control}
                  rules={{ required: true, min: 0.0001, max: 1 }}
                  render={({ field }) => (
                    <Input {...field} type="number" step="0.001" id="learning_rate" disabled={isTraining} />
                  )}
                />
                {errors.learning_rate && <ErrorMessage>Learning rate is required (0.0001 - 1).</ErrorMessage>}
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="epochs">Epochs</Label>
                <Controller
                  name="epochs"
                  control={control}
                  rules={{ required: true, min: 1, max: 10000 }}
                  render={({ field }) => (
                    <Input {...field} type="number" id="epochs" disabled={isTraining} />
                  )}
                />
                {errors.epochs && <ErrorMessage>Epochs are required (1 - 10000).</ErrorMessage>}
              </FormGroup>
              <Button type="submit" disabled={isTraining}>
                {isTraining ? 'Training...' : 'Start Training'}
              </Button>
            </Form>
          </BaseCard>
          
          <BaseCard>
            <CardTitle>Training Status</CardTitle>
            {trainingStatus ? (
              <>
                <ProgressBarContainer>
                  <ProgressBar progress={trainingStatus.progress_percentage || 0} />
                </ProgressBarContainer>
                <StatusText>
                  Epoch: {trainingStatus.epoch} / {trainingStatus.total_epochs}
                </StatusText>
                <StatsGrid>
                  <StatItem>
                    <StatValue>{trainingStatus.loss.toFixed(4)}</StatValue>
                    <StatLabel>Loss</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>
                      {isClassification ? 
                        `${((trainingStatus.accuracy || 0) * 100).toFixed(1)}%` : 
                        `${(trainingStatus.r2_score || 0).toFixed(3)}`}
                    </StatValue>
                    <StatLabel>{metricLabel}</StatLabel>
                  </StatItem>
                </StatsGrid>
              </>
            ) : (
              <StatusText>Not training. Configure and start a session.</StatusText>
            )}
            {!isTraining && trainingStatus && (trainingStatus.progress_percentage === 100) && (
              <StatusText style={{ color: theme.colors.success }}>Training complete!</StatusText>
            )}
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </BaseCard>

          {/* --- ADDED CARD: Neural Network Parameters --- */}
          <BaseCard>
            <CardTitle>Neural Network Parameters</CardTitle>
            <EpochStats>
              <EpochStatItem>
                <span>{trainingStatus?.epoch || 0}</span>
                Current Epoch
              </EpochStatItem>
              <EpochStatItem>
                <span>{totalEpochs}</span>
                Total Epochs
              </EpochStatItem>
            </EpochStats>
          </BaseCard>
        </LeftColumn>
        
        <RightColumn>
          <BaseCard>
            <CardTitle>Network Architecture (2-2-1)</CardTitle>
            {networkParams ? (
              <NeuralNetworkVisualizer
                weights={networkParams.weights}
                biases={networkParams.biases}
                mode={modelMode}
              />
            ) : (
              <StatusText>Loading network state...</StatusText>
            )}
          </BaseCard>
          
          {/* --- ADDED CARD: Weights and Biases --- */}
          {networkParams && (
            <BaseCard>
              <CardTitle>Weights & Biases (Text)</CardTitle>
              <ParametersDisplay
                weights={networkParams.weights}
                biases={networkParams.biases}
              />
            </BaseCard>
          )}

          <BaseCard>
            <CardTitle>Live Metrics</CardTitle>
            <ChartContainer>
              <Line data={chartData} options={chartOptions as any} />
            </ChartContainer>
          </BaseCard>
          
          <BaseCard>
            <CardTitle>{isClassification ? 'Decision Boundary' : 'Best-Fit Lines'}</CardTitle>
            {plotImage ? (
              <PlotImage src={`data:image/png;base64,${plotImage}`} alt="Model Plot" />
            ) : (
              <StatusText>Plot will be generated during training...</StatusText>
            )}
          </BaseCard>
        </RightColumn>
      </MainGrid>
    </PageContainer>
  );
};

export default TrainingPage;