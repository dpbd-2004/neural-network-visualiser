/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
// Removed useNavigate as it wasn't used after copying
import styled, { useTheme, DefaultTheme } from 'styled-components';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
// Removed unused MUI imports for simplicity, keep if needed elsewhere
// import { Typography, Stack as MuiStack, Button as MuiButton, ButtonGroup as MuiButtonGroup } from '@mui/material';
// import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
// import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { NeuralNetworkVisualizer } from '../components/NeuralNetworkVisualizer';
import {
  // Correctly import types from your updated types/index.ts
  TrainingStatus,
  TrainingFormData,
  // Parameters // This might not be needed if TrainingStatus includes weights/biases
} from '../types';
import {
  // Correctly import functions from your updated services/api.ts
  startTraining,
  getTrainingStatus,
  saveModel,
  getModelState,
  getSessions, // Keep if you plan to implement session features
  replaySession // Keep if you plan to implement session features
} from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// --- Styled Components (Copied from bhaskar-nie, ensure they match your project's theme structure) ---
// PageContainer, PageTitle, SectionTitle, SectionContainer, FormContainer, TrainingForm,
// FormGroup, FormLabel, FormInput, FormRow, SubmitButton, ButtonContainer, Button,
// StatusContainer, StatusRow, StatusCard, StatusTitle, StatusGrid, StatusItem, StatusLabel, StatusValue,
// ProgressBar, ProgressFill, ChartContainer, EpochControls, EpochButton, EpochIndicator,
// BoundaryTitle, ChartCard, DecisionBoundaryContainer, DecisionBoundaryImage,
// MainLayout, VisualizerSection, StatsSection, ChartsSection, ChartHeading, NoticeContainer,
// NetworkStats, StatsTitle, StatsTable, ChartControls, ControlButton, CurrentEpoch, ToggleButton,
// EpochDisplay, ControlsContainer, ControlsCard, ControlsHeader, ControlsGroup, EpochNavigator,
// ButtonGroup, Divider, Container, GridContainer, WeightsToggleContainer, WeightsToggleLabel,
// EpochsToggleContainer, EpochsToggleLabel, FormCard, NetworkVisualizationCard, ToggleSwitch,
// ToggleInput, ToggleSlider, SessionsContainer, SessionsTitle, SessionsGrid, SessionCard,
// SessionCardHeader, SessionDate, SessionId, SessionCardBody, SessionParameter, SessionParamLabel,
// SessionParamValue, SessionCardFooter, SessionButton, ParametersTracker, ParametersTitle,
// ParametersGrid, ParameterCard, ParameterName, ParameterValue, ChartsContainer, ChartTitle,
// SecondaryButton
// --- (Ensure all styled components from bhaskar-nie/TrainingPage.tsx are pasted here) ---
// --- Styled components (Copied for completeness - VERIFY THESE MATCH YOUR PROJECT) ---
const PageContainer = styled.div`
  padding: 30px; max-width: 1200px; margin: 0 auto; position: relative;
  background-color: ${({ theme }) => theme.background}; color: ${({ theme }) => theme.text};
`;
const PageTitle = styled.h1`
  font-size: 2.7rem; text-align: center; margin-bottom: 40px; color: ${({ theme }) => theme.colors?.primary || '#fff'}; // Default color
  position: relative; letter-spacing: 1px; text-shadow: 0 0 20px rgba(77, 140, 255, 0.4); font-weight: 800;
  &::after {
    content: ''; position: absolute; bottom: -15px; left: 0; width: 120px; height: 3px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors?.primary || '#4D8CFF'}, ${({ theme }) => theme.highlight || '#82B1FF'});
    border-radius: 3px; box-shadow: 0 0 10px rgba(77, 140, 255, 0.6);
  }
`;
const SectionTitle = styled.h2`
  font-size: 1.8rem; margin-bottom: 22px; color: ${({ theme }) => theme.text || '#fff'};
  border-bottom: 2px solid ${({ theme }) => theme.border}; padding-bottom: 12px; display: flex;
  align-items: center; letter-spacing: 0.5px; text-shadow: 0 0 10px rgba(77, 140, 255, 0.3);
  &::before {
    content: '⚡'; margin-right: 12px; font-size: 1.5rem; color: ${({ theme }) => theme.highlight || '#82B1FF'};
    text-shadow: 0 0 15px rgba(155, 122, 255, 0.5);
  }
`;
// ... (Include ALL other styled components from the bhaskar-nie version here) ...
// --- Add MANY other styled components definitions from bhaskar-nie here ---
const SectionContainer = styled.div` margin-bottom: 40px; `;
const FormContainer = styled.div` display: flex; flex-direction: column; gap: 20px; `;
const TrainingForm = styled.form` display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; `;
const FormGroup = styled.div` display: flex; flex-direction: column; `;
const FormLabel = styled.label` font-size: 1rem; font-weight: 500; margin-bottom: 8px; display: block; color: ${({ theme }) => theme.text}; `;
const FormInput = styled.input`
  width: 100%; padding: 10px 12px; border-radius: 8px; border: 2px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.cardBackground}; color: ${({ theme }) => theme.text}; font-size: 1rem; transition: all 0.2s ease;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors?.primary}; box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors?.primary}40`}; }
  &::placeholder { color: ${({ theme }) => theme.neutralText}; }
`;
const FormRow = styled.div` margin-bottom: 20px; `;
const SubmitButton = styled.button`
  background: linear-gradient(to right, ${({ theme }) => theme.colors?.primary || '#4D8CFF'}, ${({ theme }) => theme.colors?.secondary || '#E91E63'});
  color: ${({ theme }) => theme.lightText || '#fff'}; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem;
  font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow};
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px ${({ theme }) => `${theme.colors?.primary}60`}; }
  &:active { transform: translateY(1px); }
  &:disabled { background: ${({ theme }) => theme.border}; cursor: not-allowed; transform: none; box-shadow: none; }
`;
const SecondaryButton = styled.button`
    background: transparent; color: ${({ theme }) => theme.colors?.primary || '#4D8CFF'}; border: 2px solid ${({ theme }) => theme.colors?.primary || '#4D8CFF'};
    border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    margin-top: 10px; margin-left: 10px;
    &:hover { background-color: ${({ theme }) => `${theme.colors?.primary}15`}; transform: translateY(-2px); box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow}; }
    &:active { transform: translateY(1px); }
    &:disabled { border-color: ${({ theme }) => theme.border}; color: ${({ theme }) => theme.neutralText}; cursor: not-allowed; transform: none; box-shadow: none; }
`;
const StatusCard = styled.div`
  background-color: ${({ theme }) => theme.cardBackground}; border-radius: 16px; padding: 25px;
  box-shadow: 0 8px 20px ${({ theme }) => theme.darkShadow}; margin-bottom: 20px; border: 1px solid ${({ theme }) => theme.border};
`;
const StatusTitle = styled.h3`
  font-size: 1.2rem; color: ${({ theme }) => theme.text || '#fff'}; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
  &::before { content: "⚙️"; font-size: 1.1rem; }
`;
const StatusGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 15px; `;
const StatusItem = styled.div` text-align: center; padding: 15px; background: ${({ theme }) => `${theme.cardBackground}99`}; border-radius: 12px; border: 1px solid ${({ theme }) => theme.border}; box-shadow: 0 4px 8px ${({ theme }) => theme.darkShadow}; `;
const StatusLabel = styled.div` font-size: 0.85rem; color: ${({ theme }) => theme.neutralText}; margin-bottom: 6px; `;
const StatusValue = styled.div` font-size: 1.2rem; font-weight: 600; color: ${({ theme }) => theme.text || '#fff'}; `;
const ProgressBar = styled.div` width: 100%; height: 10px; background: ${({ theme }) => `${theme.cardBackground}90`}; border-radius: 6px; margin: 20px 0 5px; overflow: hidden; position: relative; border: 1px solid ${({ theme }) => theme.border}; `;
const ProgressFill = styled.div<{ progress: number }>`
  height: 100%; width: ${props => props.progress}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors?.primary || '#4D8CFF'}, ${({ theme }) => theme.highlight || '#82B1FF'});
  border-radius: 5px; transition: width 0.3s ease; position: relative;
  &::after { /* shimmer animation */ }
`;
const ChartCard = styled.div` /* ... */ `;
const ChartHeading = styled.h3` /* ... */ `;
const ChartsContainer = styled.div` /* ... */ `;
const ChartContainer = styled.div` /* ... */ `;
const ChartTitle = styled.h3` /* ... */ `;
const NetworkVisualizationCard = styled.div` /* ... */ `;
const ParametersTracker = styled.div` /* ... */ `;
const ParametersTitle = styled.h3` /* ... */ `;
const ParametersGrid = styled.div` /* ... */ `;
const ParameterCard = styled.div<{ value: number | undefined }>` /* ... */ `;
const ParameterName = styled.div` /* ... */ `;
const ParameterValue = styled.div<{ positive: boolean }>` /* ... */ `;
const DecisionBoundaryContainer = styled.div` /* ... */ `; // Use ChartCard styles or define separately
const BoundaryTitle = styled.h3` &::before { content: "🧠"; } /* ... */ `;
const DecisionBoundaryImage = styled.img` /* ... */ `;
const MainLayout = styled.div` /* ... */ `;
const VisualizerSection = styled.div` /* ... */ `;
const StatsSection = styled.div` /* ... */ `;
const ChartsSection = styled.div` /* ... */ `;
const NoticeContainer = styled.div` /* ... */ `;
const FormCard = styled.div` /* ... */ `;
// --- End of Styled Components ---


// Update the TrainingStatus interface if needed locally (though '../types' is preferred)
// interface ExtendedTrainingStatus extends TrainingStatus {
//   // Add specific fields if they are missing from the imported type
//   // Example: current_epoch?: number; current_loss?: number;
// }

const TrainingPage: React.FC = () => {
  const theme = useTheme() as DefaultTheme; // Get theme
  // Removed useNavigate

  const [formData, setFormData] = useState<TrainingFormData>({ // Use imported type
    learning_rate: 0.01,
    epochs: 100, // Reduced default from bhaskar-nie for quicker testing
  });

  const [isTraining, setIsTraining] = useState(false);
  // *** Use the imported TrainingStatus type and provide a valid initial state ***
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    is_training: false,
    epoch: 0,
    total_epochs: formData.epochs, // Initialize with form data
    loss: 0,
    accuracy: 0,
    progress_percentage: 0,
    current_weights: undefined, // Initialize as undefined or with default structure
    current_biases: undefined,  // Initialize as undefined or with default structure
    decision_boundary: null,
    // Add other fields from the type with default values if necessary
    session_id: undefined,
    hyperparameters: undefined,
    error: undefined,
  });

  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [epochLabels, setEpochLabels] = useState<string[]>([]); // Keep epoch labels state

  const POLLING_INTERVAL = 1000; // 1 second polling

  // Update epoch labels when history changes (Keep this effect)
  useEffect(() => {
    setEpochLabels(Array.from({ length: lossHistory.length }, (_, i) => `${i + 1}`)); // Simpler labels
  }, [lossHistory.length]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [name]: numericValue,
    }));
     // Update total_epochs in status if epochs slider changes
     if (name === 'epochs') {
        setTrainingStatus(prev => ({ ...prev, total_epochs: numericValue }));
    }
  };

  // Start training
  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTraining(true);
    setLossHistory([]); // Reset history
    setAccuracyHistory([]);
    setEpochLabels([]);
    setTrainingStatus(prev => ({ // Reset status but keep total_epochs
        ...prev,
        is_training: true,
        epoch: 0,
        loss: 0,
        accuracy: 0,
        progress_percentage: 0,
        current_weights: undefined, // Clear weights/biases visually
        current_biases: undefined,
        decision_boundary: null,
        total_epochs: formData.epochs // Ensure total_epochs is set from form
    }));


    try {
      // Use the imported API function
      const startResponse = await startTraining(formData);
      console.log('Training started:', startResponse);
      // Optional: Store session_id if needed: setTrainingStatus(prev => ({ ...prev, session_id: startResponse.session_id }));

      // Initial state fetch might be good here if startTraining doesn't return initial state
      // const initialStatus = await getTrainingStatus();
      // setTrainingStatus(initialStatus);

    } catch (error) {
      console.error('Failed to start training:', error);
      alert(`Failed to start training. ${error instanceof Error ? error.message : String(error)}`);
      setIsTraining(false); // Stop trying to poll if start failed
    }
  };

  // Check training status periodically using useEffect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isTraining) {
      intervalId = setInterval(async () => {
        try {
          // Use the imported API function
          const status: TrainingStatus = await getTrainingStatus(); // Explicitly type the result
          console.log("Polling status:", status);

          // Update the main status object
          setTrainingStatus(status);

          // Update history arrays for charts - check if epoch increased
          if (status.epoch > 0 && status.epoch > (lossHistory.length)) {
             setLossHistory(prev => [...prev, status.loss]);
             setAccuracyHistory(prev => [...prev, status.accuracy]);
             // epochLabels state will update automatically via its own useEffect
          }


          // Stop polling if training is complete according to the status object
          if (!status.is_training) {
            setIsTraining(false); // This will stop the interval on next check
            console.log('Training finished according to status.');

             // Fetch final model state one last time to be sure
            try {
                const finalState = await getModelState();
                setTrainingStatus(prev => ({
                    ...prev, // Keep most recent status
                    is_training: false, // Ensure it's false
                    current_weights: finalState.weights,
                    current_biases: finalState.biases,
                    // Ensure decision_boundary is handled correctly
                    decision_boundary: (typeof finalState.decision_boundary === 'string')
                        ? { epoch: prev.epoch, image: finalState.decision_boundary } // Convert if string
                        : finalState.decision_boundary // Use as is if object or null
                }));
                 console.log('Final model state fetched and applied.');
            } catch (finalStateError) {
                console.error("Failed to fetch final model state:", finalStateError);
            }

          }
        } catch (error) {
          console.error('Failed to fetch training status during polling:', error);
          // Optional: Stop training on poll error? Or just log?
          // setIsTraining(false);
          // alert('Error fetching training status. Stopping polling.');
        }
      }, POLLING_INTERVAL);
    } else {
        // Clear interval if isTraining becomes false
        if (intervalId) {
            clearInterval(intervalId);
             console.log('Polling stopped.');
        }
    }


    // Cleanup function for useEffect
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
         console.log('Polling interval cleared on unmount/re-run.');
      }
    };
  }, [isTraining, POLLING_INTERVAL, lossHistory.length]); // Re-run effect if isTraining changes

  // Handle export model
  const handleExportModel = async () => {
    try {
      // Use the imported API function
      const modelData = await saveModel();
      // Trigger download
      const downloadLink = document.createElement('a');
      // Construct absolute URL if download_url is relative
      const url = modelData.download_url.startsWith('/')
          ? `${API_BASE_URL}${modelData.download_url}` // Assuming API_BASE_URL is defined
          : modelData.download_url;
      downloadLink.href = url;
      downloadLink.download = modelData.filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Failed to export model:', error);
      alert(`Failed to export model. ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Fetch initial model state on component mount
  useEffect(() => {
    const fetchInitialModelState = async () => {
      try {
        console.log("Fetching initial model state...");
        // Use the imported API function
        const modelState = await getModelState();
        console.log("Initial model state received:", modelState);

        // Process decision boundary format immediately
         let initialDecisionBoundary = modelState.decision_boundary;
         if (typeof initialDecisionBoundary === 'string') {
             initialDecisionBoundary = { epoch: 0, image: initialDecisionBoundary };
         }

        setTrainingStatus(prev => ({
          ...prev, // Keep existing defaults like is_training: false
          current_weights: modelState.weights,
          current_biases: modelState.biases,
          decision_boundary: initialDecisionBoundary,
          // Don't overwrite epoch, loss etc. from initial state fetch
        }));
      } catch (error) {
        console.error('Failed to fetch initial model state:', error);
        // Handle error - maybe set default weights/biases for visualizer?
         setTrainingStatus(prev => ({
             ...prev,
             // Provide some default structure so visualizer doesn't crash
            current_weights: { W1: [[0,0],[0,0]], W2: [[0],[0]] },
            current_biases: { b1: [[0],[0]], b2: [[0]] },
            error: "Failed to load initial model state"
         }));
      }
    };

    fetchInitialModelState();
  }, []); // Empty dependency array means run only once on mount

    // --- Helper to format numbers ---
    const formatNumber = (num: number | undefined | null, decimals = 4): string => {
        if (num === undefined || num === null) return 'N/A';
        return num.toFixed(decimals);
    };


  // --- Render Functions ---

  // Render Training Status Card
    const renderTrainingStatus = () => {
        // Use properties directly from the TrainingStatus type
        const { epoch, total_epochs, loss, accuracy, progress_percentage } = trainingStatus;

        return (
            <StatusCard>
                <StatusTitle>Training Status</StatusTitle>
                <StatusGrid>
                    <StatusItem>
                        <StatusLabel>Current Epoch</StatusLabel>
                        <StatusValue>{epoch ?? 0}</StatusValue>
                    </StatusItem>
                    <StatusItem>
                        <StatusLabel>Total Epochs</StatusLabel>
                        <StatusValue>{total_epochs ?? formData.epochs}</StatusValue> {/* Fallback */}
                    </StatusItem>
                    <StatusItem>
                        <StatusLabel>Current Loss</StatusLabel>
                        <StatusValue>{formatNumber(loss)}</StatusValue>
                    </StatusItem>
                    <StatusItem>
                        <StatusLabel>Accuracy</StatusLabel>
                        <StatusValue>{accuracy ? `${(accuracy * 100).toFixed(2)}%` : 'N/A'}</StatusValue>
                    </StatusItem>
                </StatusGrid>
                 {total_epochs > 0 && ( // Only show progress if total_epochs is known
                     <div>
                        <ProgressBar>
                            <ProgressFill progress={progress_percentage ?? 0} />
                        </ProgressBar>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme.neutralText, marginTop: '5px' }}>
                            <span>Progress</span>
                            <span>{(progress_percentage ?? 0).toFixed(1)}%</span>
                        </div>
                    </div>
                )}
            </StatusCard>
        );
    };

    // Render Neural Network Visualizer and Parameters Tracker
    const renderNeuralNetwork = () => {
        const { current_weights, current_biases, epoch } = trainingStatus; // Destructure state

        return (
            <>
                <NetworkVisualizationCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
                        <h3 style={{ fontWeight: 'bold', color: theme.highlight || theme.colors?.primary }}> {/* Use theme vars */}
                            Neural Network Architecture
                        </h3>
                    </div>

                    {/* Pass weights and biases correctly */}
                    {current_weights && current_biases ? (
                        <NeuralNetworkVisualizer
                            weights={current_weights}
                            biases={current_biases}
                            width={800} // Adjust size as needed
                            height={450} // Adjust size as needed
                            epoch={epoch}
                            inputValues={[0.5, 0.5]} // Example inputs
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '150px 0', color: theme.neutralText, fontStyle: 'italic' }}>
                            Loading neural network visualization...
                             {!current_weights && <div>(Waiting for weights...)</div>}
                             {!current_biases && <div>(Waiting for biases...)</div>}
                        </div>
                    )}
                </NetworkVisualizationCard>

                {/* Render Parameters Tracker */}
                {renderParametersTracker()}
            </>
        );
    };

    // Render Parameters Tracker section
    const renderParametersTracker = () => {
         const { current_weights, current_biases, epoch } = trainingStatus;
         if (!current_weights || !current_biases) return null; // Don't render if no data

        // Flatten parameters for display (adjust names/descriptions as needed)
        const parametersList = [
            { name: 'W1[0,0]', value: current_weights.W1?.[0]?.[0], desc: 'Input 1 → Hidden 1' },
            { name: 'W1[0,1]', value: current_weights.W1?.[0]?.[1], desc: 'Input 1 → Hidden 2' },
            { name: 'W1[1,0]', value: current_weights.W1?.[1]?.[0], desc: 'Input 2 → Hidden 1' },
            { name: 'W1[1,1]', value: current_weights.W1?.[1]?.[1], desc: 'Input 2 → Hidden 2' },
            { name: 'b1[0]', value: current_biases.b1?.[0]?.[0], desc: 'Hidden 1 Bias' },
            { name: 'b1[1]', value: current_biases.b1?.[1]?.[0], desc: 'Hidden 2 Bias' },
            { name: 'W2[0,0]', value: current_weights.W2?.[0]?.[0], desc: 'Hidden 1 → Output' },
            { name: 'W2[1,0]', value: current_weights.W2?.[1]?.[0], desc: 'Hidden 2 → Output' },
            { name: 'b2[0]', value: current_biases.b2?.[0]?.[0], desc: 'Output Bias' }
        ];

        return (
            <ParametersTracker> {/* Use the correct styled component */}
                <ParametersTitle> {/* Use the correct styled component */}
                    Neural Network Parameters (Epoch: {epoch ?? 0})
                </ParametersTitle>
                <ParametersGrid> {/* Use the correct styled component */}
                    {parametersList.map((param, index) => (
                        <ParameterCard key={index} value={param.value}> {/* Use the correct styled component */}
                            <ParameterName>{param.name} ({param.desc})</ParameterName> {/* Use the correct styled component */}
                            <ParameterValue positive={param.value !== undefined && param.value >= 0}> {/* Use the correct styled component */}
                                {formatNumber(param.value)}
                            </ParameterValue>
                        </ParameterCard>
                    ))}
                </ParametersGrid>
            </ParametersTracker>
        );
    };


  // Render Charts
    const renderCharts = () => {
        if (lossHistory.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px', color: theme.neutralText, fontStyle: 'italic' }}>
                    Start training to see charts.
                </div>
            );
        }

        const chartOptions = { // Keep chart options as before
             responsive: true, maintainAspectRatio: false,
             scales: {
                 y: { beginAtZero: true, ticks: { color: theme.text, font: { weight: 'bold' as const }}, grid: { color: `${theme.text}33` }},
                 x: { ticks: { color: theme.text, font: { weight: 'bold' as const }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { color: `${theme.text}33` }}
             },
             plugins: {
                legend: { labels: { color: theme.text, font: { weight: 'bold' as const }, usePointStyle: true, padding: 15 }},
                tooltip: { /* ... tooltip styles ... */ }
             }
         };

        const labels = epochLabels.length > 0 ? epochLabels : Array.from({ length: lossHistory.length }, (_, i) => `${i + 1}`);

        const lossChartData = {
            labels,
            datasets: [{
                label: 'Loss', data: lossHistory, fill: { target: 'origin', above: `${theme.colors?.danger}20` },
                borderColor: theme.colors?.danger || '#D50000', backgroundColor: theme.colors?.danger || '#D50000',
                tension: 0.3, pointBackgroundColor: theme.colors?.danger || '#D50000', pointBorderColor: theme.cardBackground,
                pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 // Adjusted sizes
            }]
        };

        const accuracyChartData = {
            labels,
            datasets: [{
                label: 'Accuracy', data: accuracyHistory, fill: { target: 'origin', above: `${theme.colors?.success}20` },
                borderColor: theme.colors?.success || '#00C853', backgroundColor: theme.colors?.success || '#00C853',
                tension: 0.3, pointBackgroundColor: theme.colors?.success || '#00C853', pointBorderColor: theme.cardBackground,
                pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 // Adjusted sizes
            }]
        };


        return (
            <ChartsContainer> {/* Use correct styled component */}
                <ChartContainer> {/* Use correct styled component */}
                    <ChartTitle>Loss History</ChartTitle> {/* Use correct styled component */}
                    <div style={{ position: 'relative', flexGrow: 1 }}> {/* Allow chart to fill space */}
                        <Line data={lossChartData} options={chartOptions} />
                    </div>
                </ChartContainer>
                <ChartContainer> {/* Use correct styled component */}
                    <ChartTitle>Accuracy History</ChartTitle> {/* Use correct styled component */}
                     <div style={{ position: 'relative', flexGrow: 1 }}> {/* Allow chart to fill space */}
                        <Line data={accuracyChartData} options={chartOptions} />
                    </div>
                </ChartContainer>
            </ChartsContainer>
        );
    };


  // Render Training Form
    const renderTrainingForm = () => (
        <FormCard> {/* Use correct styled component */}
            <SectionTitle>Configure Training Parameters</SectionTitle>
            <form onSubmit={handleStartTraining}>
                <FormRow>
                    <FormLabel htmlFor="learning_rate">Learning Rate</FormLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FormInput type="range" id="learning_rate" name="learning_rate" min="0.001" max="0.1" step="0.001"
                            value={formData.learning_rate} onChange={handleInputChange} disabled={isTraining} />
                        <span style={{ minWidth: '60px', textAlign: 'center', color: theme.colors?.primary, fontWeight: '600', fontSize: '1rem' }}>
                            {formData.learning_rate}
                        </span>
                    </div>
                </FormRow>
                <FormRow>
                    <FormLabel htmlFor="epochs">Number of Epochs</FormLabel>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FormInput type="range" id="epochs" name="epochs" min="1" max="500" step="1" // Reduced max epochs from bhaskar-nie
                            value={formData.epochs} onChange={handleInputChange} disabled={isTraining} />
                        <span style={{ minWidth: '60px', textAlign: 'center', color: theme.colors?.primary, fontWeight: '600', fontSize: '1rem' }}>
                            {formData.epochs}
                        </span>
                    </div>
                </FormRow>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    <SubmitButton type="submit" disabled={isTraining}>
                        {isTraining ? 'Training...' : 'Start Training'}
                    </SubmitButton>
                    <SecondaryButton type="button" onClick={handleExportModel}
                        // Disable if training or if training hasn't successfully completed
                        disabled={isTraining || !(trainingStatus.progress_percentage === 100 && !trainingStatus.is_training)}
                    >
                        Export Model
                    </SecondaryButton>
                </div>
            </form>
        </FormCard>
    );


  // Render Decision Boundary
    const renderDecisionBoundary = () => {
        const { decision_boundary } = trainingStatus; // Use state variable
        let imageData: string | undefined = undefined;

        if (typeof decision_boundary === 'string') {
            imageData = decision_boundary;
        } else if (decision_boundary && typeof decision_boundary === 'object' && decision_boundary.image) {
            imageData = decision_boundary.image;
        }

        return (
             // Use DecisionBoundaryContainer styled component
            <DecisionBoundaryContainer>
                <BoundaryTitle>Decision Boundary</BoundaryTitle> {/* Use styled component */}
                 {imageData ? (
                     // Use DecisionBoundaryImage styled component
                    <DecisionBoundaryImage src={`data:image/png;base64,${imageData}`} alt="Decision Boundary" />
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.neutralText, fontStyle: 'italic' }}>
                        {isTraining ? 'Boundary updates during training...' : 'Train model to view boundary.'}
                    </div>
                )}
            </DecisionBoundaryContainer>
        );
    };


  // --- Main Return JSX ---
  return (
    <PageContainer>
      <PageTitle>Neural Network Training</PageTitle>

      {renderTrainingForm()}

      <SectionContainer>
        <MainLayout> {/* Use layout component */}
          <VisualizerSection> {/* Use layout component */}
            {renderNeuralNetwork()}
          </VisualizerSection>
          <StatsSection> {/* Use layout component */}
            {renderTrainingStatus()}
            <ChartCard> {/* Wrap charts */}
               <ChartHeading>Training Progress</ChartHeading> {/* Add heading */}
               {renderCharts()}
            </ChartCard>
            {renderDecisionBoundary()}
          </StatsSection>
        </MainLayout>
      </SectionContainer>

       {/* Optional Notice */}
      {!isTraining && trainingStatus.progress_percentage === 0 && (
          <NoticeContainer> {/* Use styled component */}
              Configure parameters and click 'Start Training'.
          </NoticeContainer>
      )}
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
