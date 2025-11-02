// frontend/src/pages/DatasetAnalysisPage.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchEDA } from '../services/api';
import { EDAData, FeatureStats } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// --- Styled Components (Update to use dynamic theme) ---

const PageContainer = styled.div`
  padding: 25px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  background-color: ${props => props.theme.background}; /* Use theme background */
  color: ${props => props.theme.text}; /* Use theme text */
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 35px;
  color: #ffffff;
  position: relative;
  letter-spacing: 1.5px;
  /* Use text color from theme, but white looks good on dark backgrounds */
  color: ${props => props.theme.text};
  text-shadow: 0 0 20px ${props => props.theme.colors.primary}90; /* Dynamic shadow */
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
    background: ${props => props.theme.primaryGradient}; /* Dynamic gradient */
    border-radius: 3px;
    box-shadow: 0 0 10px ${props => props.theme.colors.primary}c0; /* Dynamic shadow */
    transition: all 0.3s ease;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px ${props => props.theme.colors.primary}10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  border: 1px solid ${props => props.theme.colors.primary}40;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, ${props => props.theme.colors.primary}70, transparent);
    transition: background 0.3s ease;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 80px ${props => props.theme.colors.primary}30;
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 10px;
  text-shadow: 0 0 15px ${props => props.theme.colors.primary}80;
  transition: all 0.3s ease;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.neutralText};
  text-align: center;
  letter-spacing: 0.5px;
`;

const FeatureContainer = styled.div`
  margin-top: 30px;
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px ${props => props.theme.colors.primary}10;
  border: 1px solid ${props => props.theme.colors.primary}40;
  transition: all 0.3s ease;
`;

const FeatureTitle = styled.h3`
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

// *** THIS IS THE FIX ***
// Renamed from 'FeatureStats' to 'FeatureStatsContainer' to avoid conflict with the imported type
const FeatureStatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
`;

const FeatureStat = styled.div`
  background-color: ${props => props.theme.background};
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  border: 1px solid ${props => props.theme.colors.primary}20;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 20px ${props => props.theme.colors.primary}10;
  }
`;

const StatName = styled.span`
  font-weight: 600;
  margin-right: 5px;
  color: ${props => props.theme.neutralText};
  text-transform: capitalize;
`;

const PlotsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 30px;
`;

const PlotCard = styled.div`
  background-color: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px ${props => props.theme.colors.primary}10;
  border: 1px solid ${props => props.theme.colors.primary}40;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 80px ${props => props.theme.colors.primary}30;
  }
`;

const PlotTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: ${props => props.theme.text};
  text-align: center;
  text-shadow: 0 0 10px ${props => props.theme.colors.primary}70;
  transition: all 0.3s ease;
  text-transform: capitalize;
`;

const PlotImage = styled.img`
  width: 100%;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid ${props => props.theme.colors.primary}30;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 30px ${props => props.theme.colors.primary}30;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.2rem;
  color: ${props => props.theme.neutralText};
  background: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: "⏳";
    font-size: 1.8rem;
    margin-right: 10px;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: ${props => props.theme.colors.danger};
  font-size: 1.2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  background: ${props => props.theme.cardBackground};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.theme.colors.danger}50;
  
  &::before {
    content: "⚠️";
    font-size: 1.8rem;
    margin-right: 10px;
  }
`;

// --- Helper Component for Stats ---
const FeatureStatsDisplay: React.FC<{ title: string, stats: FeatureStats }> = ({ title, stats }) => (
  <FeatureContainer>
    <FeatureTitle>{title}</FeatureTitle>
    {/* *** THIS IS THE FIX *** Use the renamed 'FeatureStatsContainer' */}
    <FeatureStatsContainer>
      <FeatureStat>
        <StatName>Mean:</StatName> {stats.mean.toFixed(2)}
      </FeatureStat>
      <FeatureStat>
        <StatName>Median:</StatName> {stats.median.toFixed(2)}
      </FeatureStat>
      <FeatureStat>
        <StatName>Range:</StatName> {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
      </FeatureStat>
    </FeatureStatsContainer>
  </FeatureContainer>
);

const DatasetAnalysisPage: React.FC = () => {
  const { modelMode } = useTheme(); // <-- Get current mode from context
  const [edaData, setEdaData] = useState<EDAData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs whenever 'modelMode' changes
    const loadEDAData = async () => {
      try {
        setLoading(true);
        setError(null);
        setEdaData(null); // Clear old data
        const data = await fetchEDA(modelMode); // <-- Pass mode to API
        setEdaData(data);
      } catch (err) {
        setError(`Failed to load ${modelMode} EDA data. Please try again later.`);
        console.error('Error fetching EDA data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEDAData();
  }, [modelMode]); // <-- Re-run effect when mode changes

  if (loading) {
    return (
      <PageContainer>
        <PageTitle>Dataset Analysis</PageTitle>
        <LoadingContainer>Loading {modelMode} data analysis...</LoadingContainer>
      </PageContainer>
    );
  }

  if (error || !edaData) {
    return (
      <PageContainer>
        <PageTitle>Dataset Analysis</PageTitle>
        <ErrorContainer>{error || 'Something went wrong. Please try again later.'}</ErrorContainer>
      </PageContainer>
    );
  }

  const { stats, plots } = edaData;
  const isClassification = modelMode === 'classification';

  return (
    <PageContainer>
      <PageTitle>{isClassification ? 'Placement Dataset Analysis' : 'Grade Prediction Dataset Analysis'}</PageTitle>

      <StatsContainer>
        <StatCard>
          <StatValue>{stats.total_samples}</StatValue>
          <StatLabel>Total Samples</StatLabel>
        </StatCard>
        
        {/* Only show Placement Rate for classification */}
        {isClassification && stats.placement_rate !== undefined && (
          <StatCard>
            <StatValue>{stats.placement_rate.toFixed(1)}%</StatValue>
            <StatLabel>Placement Rate</StatLabel>
          </StatCard>
        )}
        
        <StatCard>
          <StatValue>{stats.train_test_split}</StatValue>
          <StatLabel>Train/Test Split</StatLabel>
        </StatCard>
      </StatsContainer>

      {/* Dynamically render feature stats by iterating */}
      {Object.entries(stats.features).map(([key, featureStats]) => (
        <FeatureStatsDisplay key={key} title={`${key.replace(/_/g, ' ')} Stats`} stats={featureStats} />
      ))}

      {/* Dynamically render plots by iterating */}
      <PlotsContainer>
        {Object.entries(plots).map(([key, image]) => (
          <PlotCard key={key}>
            <PlotTitle>{key.replace(/_/g, ' ')}</PlotTitle>
            <PlotImage src={`data:image/png;base64,${image}`} alt={key.replace(/_/g, ' ')} />
          </PlotCard>
        ))}
      </PlotsContainer>
    </PageContainer>
  );
};

export default DatasetAnalysisPage;