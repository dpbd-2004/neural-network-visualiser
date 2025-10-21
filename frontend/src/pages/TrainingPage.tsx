/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
// Import DefaultTheme along with useTheme
import styled, { useTheme, DefaultTheme } from 'styled-components';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

import { NeuralNetworkVisualizer } from '../components/NeuralNetworkVisualizer'; // Ensure path is correct
import { TrainingStatus, TrainingFormData } from '../types'; // Ensure path is correct
import { startTraining, getTrainingStatus, saveModel, getModelState, getSessions, replaySession } from '../services/api'; // Ensure path is correct

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// --- Styled Components (Direct theme access - NO ?. or fallbacks) ---
const PageContainer = styled.div`
  padding: 30px; max-width: 1200px; margin: 0 auto; position: relative;
  background-color: ${({ theme }) => theme.background}; // Direct access
  color: ${({ theme }) => theme.text}; // Direct access
`;

const PageTitle = styled.h1`
  font-size: 2.7rem; text-align: center; margin-bottom: 40px;
  color: ${({ theme }) => theme.colors.primary}; // Direct access
  position: relative; letter-spacing: 1px; text-shadow: 0 0 20px rgba(77, 140, 255, 0.4); font-weight: 800;
  &::after {
    content: ''; position: absolute; bottom: -15px; left: 0; width: 120px; height: 3px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.highlight}); // Direct access
    border-radius: 3px; box-shadow: 0 0 10px rgba(77, 140, 255, 0.6);
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem; margin-bottom: 22px; color: ${({ theme }) => theme.text};
  border-bottom: 2px solid ${({ theme }) => theme.border}; padding-bottom: 12px; display: flex;
  align-items: center; letter-spacing: 0.5px; text-shadow: 0 0 10px rgba(77, 140, 255, 0.3);
  &::before {
    content: '⚡'; margin-right: 12px; font-size: 1.5rem; color: ${({ theme }) => theme.highlight};
    text-shadow: 0 0 15px rgba(155, 122, 255, 0.5);
  }
`;

const SectionContainer = styled.div` margin-bottom: 40px; `;

const FormCard = styled.div`
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow};
  margin-bottom: 25px; position: relative;
  &::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}40, transparent); }
`;

const FormRow = styled.div` margin-bottom: 20px; `;
const FormLabel = styled.label` font-size: 1rem; font-weight: 500; margin-bottom: 8px; display: block; color: ${({ theme }) => theme.text}; `;
const FormInput = styled.input`
  width: 100%; padding: 10px 12px; border-radius: 8px; border: 2px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.cardBackground}; color: ${({ theme }) => theme.text}; font-size: 1rem; transition: all 0.2s ease;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}40`}; }
  &::placeholder { color: ${({ theme }) => theme.neutralText}; }
`;

const SubmitButton = styled.button`
  background: linear-gradient(to right, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  color: ${({ theme }) => theme.lightText}; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem;
  font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow};
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px ${({ theme }) => `${theme.colors.primary}60`}; }
  &:active { transform: translateY(1px); }
  &:disabled { background: ${({ theme }) => theme.border}; color: ${({ theme }) => theme.neutralText}; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const SecondaryButton = styled.button`
    background: transparent; color: ${({ theme }) => theme.colors.primary}; border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    margin-top: 10px; margin-left: 10px;
    &:hover { background-color: ${({ theme }) => `${theme.colors.primary}15`}; transform: translateY(-2px); box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow}; }
    &:active { transform: translateY(1px); }
    &:disabled { border-color: ${({ theme }) => theme.border}; color: ${({ theme }) => theme.neutralText}; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const StatusCard = styled.div`
  background-color: ${({ theme }) => theme.cardBackground}; border-radius: 16px; padding: 25px;
  box-shadow: 0 8px 20px ${({ theme }) => theme.darkShadow}; margin-bottom: 20px; border: 1px solid ${({ theme }) => theme.border};
`;
const StatusTitle = styled.h3`
  font-size: 1.2rem; color: ${({ theme }) => theme.text}; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
  &::before { content: "⚙️"; font-size: 1.1rem; }
`;
const StatusGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 15px; `;
const StatusItem = styled.div` text-align: center; padding: 15px; background: ${({ theme }) => `${theme.cardBackground}99`}; border-radius: 12px; border: 1px solid ${({ theme }) => theme.border}; box-shadow: 0 4px 8px ${({ theme }) => theme.darkShadow}; `;
const StatusLabel = styled.div` font-size: 0.85rem; color: ${({ theme }) => theme.neutralText}; margin-bottom: 6px; `;
const StatusValue = styled.div` font-size: 1.2rem; font-weight: 600; color: ${({ theme }) => theme.text}; `;
const ProgressBar = styled.div` width: 100%; height: 10px; background: ${({ theme }) => `${theme.cardBackground}90`}; border-radius: 6px; margin: 20px 0 5px; overflow: hidden; position: relative; border: 1px solid ${({ theme }) => theme.border}; `;
const ProgressFill = styled.div<{ progress: number }>`
  height: 100%; width: ${props => props.progress}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.highlight});
  border-radius: 5px; transition: width 0.3s ease; position: relative;
  &::after { /* shimmer */ content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%); animation: shimmer 1.5s infinite; @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } }
`;
const ChartCard = styled.div`
  background: ${({ theme }) => `${theme.cardBackground}cc`};
  border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%; position: relative;
  &::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent); }
`;
const ChartHeading = styled.h3`
  margin-bottom: 20px; font-size: 1.2rem; font-weight: 600; text-align: center;
  color: ${({ theme }) => theme.highlight}; position: relative;
  &::after { content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 100px; height: 3px; background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent); border-radius: 3px; }
`;
const ChartsContainer = styled.div` display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px; width: 100%; `;
const ChartContainer = styled.div`
  background: rgba(10, 20, 40, 0.4); border-radius: 12px; padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); position: relative; flex: 1; min-width: 300px;
  min-height: 300px; display: flex; flex-direction: column;
  &::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent); }
`;
const ChartTitle = styled.h3` font-size: 1.1rem; margin-bottom: 15px; text-align: center; color: ${({ theme }) => theme.highlight}; opacity: 0.9; font-weight: 700; `;
const NetworkVisualizationCard = styled(ChartCard)` max-height: 650px; overflow: auto; `;
const ParametersTracker = styled(ChartCard)` /* Reuse style */ `;
const ParametersTitle = styled.h3`
  font-size: 1.4rem; color: ${({ theme }) => theme.text}; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
  &::before { content: "⚙️"; font-size: 1.3rem; }
`;
const ParametersGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; `;
const ParameterCard = styled.div<{ value: number | undefined }>`
    background-color: ${({ theme, value }) => {
        if (value === undefined) return `${theme.border}30`; // Direct access
        return value >= 0 ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 100, 100, 0.1)';
    }};
    padding: 12px 16px; border-radius: 8px;
    border: 1px solid ${({ theme, value }) => {
        if (value === undefined) return `${theme.border}50`; // Direct access
        return value >= 0 ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 100, 100, 0.3)';
    }};
    display: flex; flex-direction: column; transition: all 0.3s ease;
    &:hover {
        transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        border-color: ${({ theme, value }) => {
            if (value === undefined) return `${theme.border}80`; // Direct access
            return value >= 0 ? 'rgba(0, 230, 118, 0.6)' : 'rgba(255, 100, 100, 0.6)';
        }};
    }
`;
const ParameterName = styled.div` font-family: 'Roboto Mono', monospace; font-size: 0.9rem; margin-bottom: 8px; color: ${({ theme }) => theme.neutralText}; `;
const ParameterValue = styled.div<{ positive: boolean }>` font-family: 'Roboto Mono', monospace; font-size: 1.1rem; font-weight: 600; color: ${({ theme, positive }) => positive ? theme.colors.success : theme.colors.danger}; `;
const DecisionBoundaryContainer = styled(ChartCard)` /* Reuse styles */ text-align: center; background: linear-gradient(to bottom, ${({ theme }) => theme.cardBackground}, rgba(15, 25, 45, 0.95)); border: 1px solid ${({ theme }) => theme.border}; box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow}, 0 0 20px rgba(77, 140, 255, 0.1); /* ... */ `;
const BoundaryTitle = styled.h3` &::before { content: "🧠"; } color: ${({ theme }) => theme.text}; margin-bottom: 15px; font-size: 1.4rem; `;
const DecisionBoundaryImage = styled.img` max-width: 100%; border-radius: 10px; margin-top: 15px; border: 1px solid rgba(0, 150, 255, 0.3); /* ... */ `;
const MainLayout = styled.div` display: grid; grid-template-columns: 1fr; gap: 30px; @media (min-width: 1200px) { grid-template-columns: 1fr 1fr; } `;
const VisualizerSection = styled.div` grid-column: 1 / -1; @media (min-width: 1200px) { grid-column: 1 / 2; grid-row: span 2; } `;
const StatsSection = styled.div` grid-column: 1 / -1; @media (min-width: 1200px) { grid-column: 2 / 3; } `;
const NoticeContainer = styled.div` /* Keep styles */ background-color: rgba(10, 20, 40, 0.8); border-left: 4px solid #00f7ff; padding: 20px; margin: 25px 0; border-radius: 8px; box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 100, 255, 0.1); font-size: 1.1rem; display: flex; align-items: center; color: #e0e6ff; border: 1px solid rgba(0, 150, 255, 0.25); position: relative; overflow: hidden; &::before { content: "💡"; font-size: 1.8rem; margin-right: 15px; } &::after { content: ""; position: absolute; top: 0; right: 0; width: 3px; height: 100%; background: linear-gradient(to bottom, transparent, #00f7ff, transparent); opacity: 0.7; } `;
// --- End of Styled Components ---

const TrainingPage: React.FC = () => {
    // *** Use useTheme hook to access theme ***
    const theme = useTheme() as DefaultTheme;

    // --- States ---
    const [formData, setFormData] = useState<TrainingFormData>({ learning_rate: 0.01, epochs: 100 });
    const [isTraining, setIsTraining] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
        is_training: false, epoch: 0, total_epochs: formData.epochs, loss: 0, accuracy: 0,
        progress_percentage: 0, current_weights: undefined, current_biases: undefined,
        decision_boundary: null, session_id: undefined, hyperparameters: undefined, error: undefined,
    });
    const [lossHistory, setLossHistory] = useState<number[]>([]);
    const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
    const [epochLabels, setEpochLabels] = useState<string[]>([]);
    const POLLING_INTERVAL = 1000;

    // --- Effects ---
    useEffect(() => { /* Update epoch labels */
        setEpochLabels(Array.from({ length: lossHistory.length }, (_, i) => `${i + 1}`));
    }, [lossHistory.length]);

    useEffect(() => { /* Polling logic */
        let intervalId: NodeJS.Timeout | null = null;
        if (isTraining) {
            intervalId = setInterval(async () => {
                try {
                    const status: TrainingStatus = await getTrainingStatus();
                    setTrainingStatus(status);
                    if (status.epoch > 0 && status.epoch > (lossHistory.length)) {
                        setLossHistory(prev => [...prev, status.loss]);
                        setAccuracyHistory(prev => [...prev, status.accuracy]);
                    }
                    if (!status.is_training) {
                        setIsTraining(false);
                        try { /* Fetch final state */
                            const finalState = await getModelState();
                             setTrainingStatus(prev => ({
                                ...prev, is_training: false, current_weights: finalState.weights, current_biases: finalState.biases,
                                decision_boundary: (typeof finalState.decision_boundary === 'string') ? { epoch: prev.epoch, image: finalState.decision_boundary } : finalState.decision_boundary
                            }));
                        } catch (finalStateError) { console.error("Fetch final state error:", finalStateError); }
                    }
                } catch (error) { console.error('Polling error:', error); }
            }, POLLING_INTERVAL);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isTraining, POLLING_INTERVAL, lossHistory.length]);

     useEffect(() => { /* Fetch initial model state */
        const fetchInitialModelState = async () => {
            try {
                const modelState = await getModelState();
                let initialDecisionBoundary = modelState.decision_boundary;
                if (typeof initialDecisionBoundary === 'string') {
                    initialDecisionBoundary = { epoch: 0, image: initialDecisionBoundary };
                }
                setTrainingStatus(prev => ({
                    ...prev, is_training: false, progress_percentage: 0, epoch: 0, loss: 0, accuracy: 0,
                    current_weights: modelState.weights, current_biases: modelState.biases,
                    decision_boundary: initialDecisionBoundary,
                }));
            } catch (error) { console.error('Initial fetch error:', error);
                 setTrainingStatus(prev => ({ // Set defaults on error
                     ...prev, is_training: false, progress_percentage: 0, epoch: 0, loss: 0, accuracy: 0,
                     current_weights: { W1: [[0,0],[0,0]], W2: [[0],[0]] },
                     current_biases: { b1: [[0],[0]], b2: [[0]] },
                     error: "Failed to load initial model state"
                 }));
             }
        };
        fetchInitialModelState();
     }, []); // Run only on mount

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const { name, value } = e.target;
         const numericValue = parseFloat(value);
         setFormData(prev => ({ ...prev, [name]: numericValue, }));
         if (name === 'epochs') {
             setTrainingStatus(prev => ({ ...prev, total_epochs: numericValue }));
         }
     };

    const handleStartTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTraining(true);
         setLossHistory([]); setAccuracyHistory([]); setEpochLabels([]);
         setTrainingStatus(prev => ({
             ...prev, is_training: true, epoch: 0, loss: 0, accuracy: 0, progress_percentage: 0,
             current_weights: prev.current_weights, current_biases: prev.current_biases,
             decision_boundary: prev.decision_boundary, total_epochs: formData.epochs
         }));
        try { await startTraining(formData); }
        catch (error) { console.error('Start training error:', error); setIsTraining(false); /* Alert user */ }
    };

    const handleExportModel = async () => {
         try {
             const modelData = await saveModel();
             const downloadLink = document.createElement('a');
             const API_BASE_URL = 'http://localhost:5000';
             const url = modelData.download_url.startsWith('/') ? `${API_BASE_URL}${modelData.download_url}` : modelData.download_url;
             downloadLink.href = url; downloadLink.download = modelData.filename;
             document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
         } catch (error) { console.error('Export error:', error); /* Alert user */ }
     };


    // --- Helper Format Function ---
    const formatNumber = (num: number | undefined | null, decimals = 4): string => {
        if (num === undefined || num === null) return 'N/A';
        const fixedNum = num.toFixed(decimals);
        return fixedNum === `-${(0).toFixed(decimals)}` ? (0).toFixed(decimals) : fixedNum;
    };


    // --- Render Functions ---
    const renderTrainingStatus = () => {
        const { epoch, total_epochs, loss, accuracy, progress_percentage } = trainingStatus;
        return (
            <StatusCard>
                <StatusTitle>Training Status</StatusTitle>
                <StatusGrid>
                    <StatusItem><StatusLabel>Current Epoch</StatusLabel><StatusValue>{epoch ?? 0}</StatusValue></StatusItem>
                    <StatusItem><StatusLabel>Total Epochs</StatusLabel><StatusValue>{total_epochs ?? formData.epochs}</StatusValue></StatusItem>
                    <StatusItem><StatusLabel>Current Loss</StatusLabel><StatusValue>{formatNumber(loss)}</StatusValue></StatusItem>
                    <StatusItem><StatusLabel>Accuracy</StatusLabel><StatusValue>{accuracy ? `${(accuracy * 100).toFixed(2)}%` : 'N/A'}</StatusValue></StatusItem>
                </StatusGrid>
                {total_epochs > 0 && (
                     <div>
                        <ProgressBar> <ProgressFill progress={progress_percentage ?? 0} /> </ProgressBar>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme.neutralText, marginTop: '5px' }}>
                            <span>Progress</span>
                            <span>{(progress_percentage ?? 0).toFixed(1)}%</span>
                        </div>
                    </div>
                )}
            </StatusCard>
        );
    };

    const renderNeuralNetwork = () => {
        const { current_weights, current_biases, epoch } = trainingStatus;
        return (
            <>
                <NetworkVisualizationCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>
                        <h3 style={{ fontWeight: 'bold', color: theme.highlight }}> {/* Use direct access */}
                            Neural Network Architecture
                        </h3>
                    </div>
                    {current_weights && current_biases ? (
                        <NeuralNetworkVisualizer
                            weights={current_weights} biases={current_biases}
                            width={800} height={450} epoch={epoch} inputValues={[0.5, 0.5]}
                        />
                    ) : (
                         <div style={{ textAlign: 'center', padding: '150px 0', color: theme.neutralText, fontStyle: 'italic' }}>
                            {trainingStatus.error || "Loading neural network..."}
                        </div>
                    )}
                </NetworkVisualizationCard>
                {renderParametersTracker()}
            </>
        );
    };

    const renderParametersTracker = () => {
         const { current_weights, current_biases, epoch } = trainingStatus;
         if (!current_weights || !current_biases) return null;
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
            <ParametersTracker>
                <ParametersTitle> Neural Network Parameters (Epoch: {epoch ?? 0}) </ParametersTitle>
                <ParametersGrid>
                    {parametersList.map((param, index) => (
                        <ParameterCard key={index} value={param.value}>
                            <ParameterName>{param.name} ({param.desc})</ParameterName>
                            <ParameterValue positive={param.value !== undefined && param.value >= 0}>
                                {formatNumber(param.value)}
                            </ParameterValue>
                        </ParameterCard>
                    ))}
                </ParametersGrid>
            </ParametersTracker>
        );
    };

    const renderCharts = () => {
        if (lossHistory.length === 0 && !isTraining) {
             return ( <div style={{ textAlign: 'center', padding: '40px', color: theme.neutralText, fontStyle: 'italic' }}> Start training to see charts. </div> );
        }
        const chartOptions = {
             responsive: true, maintainAspectRatio: false,
             scales: {
                 y: { beginAtZero: false, ticks: { color: theme.text, font: { weight: 'bold' as const }}, grid: { color: `${theme.border}50` }},
                 x: { ticks: { color: theme.text, font: { weight: 'bold' as const }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false }}
             },
             plugins: {
                legend: { labels: { color: theme.text, font: { weight: 'bold' as const }, usePointStyle: true, padding: 15 }},
                tooltip: { backgroundColor: theme.cardBackground, titleColor: theme.colors.primary, bodyColor: theme.text, /* ... */ }
             }
         };
        const labels = epochLabels;
        const lossChartData = { labels, datasets: [{ label: 'Loss', data: lossHistory, borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}40`, pointBackgroundColor: theme.colors.danger, tension: 0.3, pointRadius: 3, borderWidth: 2 }] };
        const accuracyChartData = { labels, datasets: [{ label: 'Accuracy', data: accuracyHistory, borderColor: theme.colors.success, backgroundColor: `${theme.colors.success}40`, pointBackgroundColor: theme.colors.success, tension: 0.3, pointRadius: 3, borderWidth: 2 }] };

        return (
            <ChartsContainer>
                <ChartContainer>
                    <ChartTitle>Loss History</ChartTitle>
                    <div style={{ position: 'relative', flexGrow: 1 }}> <Line data={lossChartData} options={chartOptions} /> </div>
                </ChartContainer>
                <ChartContainer>
                    <ChartTitle>Accuracy History</ChartTitle>
                     <div style={{ position: 'relative', flexGrow: 1 }}> <Line data={accuracyChartData} options={chartOptions} /> </div>
                </ChartContainer>
            </ChartsContainer>
        );
    };

    const renderTrainingForm = () => (
        <FormCard>
            <SectionTitle>Configure Training Parameters</SectionTitle>
            <form onSubmit={handleStartTraining}>
                <FormRow>
                    <FormLabel htmlFor="learning_rate">Learning Rate</FormLabel>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FormInput type="range" id="learning_rate" name="learning_rate" min="0.001" max="0.1" step="0.001"
                            value={formData.learning_rate} onChange={handleInputChange} disabled={isTraining} />
                        <span style={{ minWidth: '60px', textAlign: 'center', color: theme.colors.primary, fontWeight: '600', fontSize: '1rem' }}>
                            {formData.learning_rate}
                        </span>
                    </div>
                </FormRow>
                <FormRow>
                    <FormLabel htmlFor="epochs">Number of Epochs</FormLabel>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FormInput type="range" id="epochs" name="epochs" min="1" max="500" step="1"
                            value={formData.epochs} onChange={handleInputChange} disabled={isTraining} />
                        <span style={{ minWidth: '60px', textAlign: 'center', color: theme.colors.primary, fontWeight: '600', fontSize: '1rem' }}>
                            {formData.epochs}
                        </span>
                    </div>
                </FormRow>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    <SubmitButton type="submit" disabled={isTraining}> {isTraining ? 'Training...' : 'Start Training'} </SubmitButton>
                    <SecondaryButton type="button" onClick={handleExportModel} disabled={isTraining || !(trainingStatus.progress_percentage === 100 && !trainingStatus.is_training)} > Export Model </SecondaryButton>
                </div>
            </form>
        </FormCard>
    );

    const renderDecisionBoundary = () => {
        const { decision_boundary } = trainingStatus;
        let imageData: string | undefined = undefined;
        if (typeof decision_boundary === 'string') { imageData = decision_boundary; }
        else if (decision_boundary && typeof decision_boundary === 'object' && decision_boundary.image) { imageData = decision_boundary.image; }

        return (
            <DecisionBoundaryContainer>
                <BoundaryTitle>Decision Boundary</BoundaryTitle>
                 {imageData ? ( <DecisionBoundaryImage src={`data:image/png;base64,${imageData}`} alt="Decision Boundary" /> )
                  : ( <div style={{ textAlign: 'center', padding: '40px', color: theme.neutralText, fontStyle: 'italic' }}> {isTraining ? 'Boundary updates during training...' : 'Train model to view boundary.'} </div> )}
            </DecisionBoundaryContainer>
        );
    };

    // --- Main Return JSX ---
    return (
        <PageContainer>
            <PageTitle>Neural Network Training</PageTitle>
            {renderTrainingForm()}
            <SectionContainer>
                <MainLayout>
                    <VisualizerSection>
                        {renderNeuralNetwork()}
                    </VisualizerSection>
                    <StatsSection>
                        {renderTrainingStatus()}
                        <ChartCard>
                           <ChartHeading>Training Progress</ChartHeading>
                           {renderCharts()}
                        </ChartCard>
                        {renderDecisionBoundary()}
                    </StatsSection>
                </MainLayout>
            </SectionContainer>
            {!isTraining && trainingStatus.progress_percentage === 0 && (
                <NoticeContainer> Configure parameters and click 'Start Training'. </NoticeContainer>
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
