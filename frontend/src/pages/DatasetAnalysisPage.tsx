import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchEDA } from '../services/api';
import { EDAData } from '../types';

// Updated styles for DatasetAnalysisPage
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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px rgba(0, 100, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
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
    background: linear-gradient(to right, transparent, rgba(0, 195, 255, 0.4), transparent);
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 80px rgba(0, 120, 255, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #00c3ff;
  margin-bottom: 10px;
  text-shadow: 0 0 15px rgba(0, 195, 255, 0.5);
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #a0a6ce;
  text-align: center;
  letter-spacing: 0.5px;
`;

const FeatureContainer = styled.div`
  margin-top: 30px;
  background-color: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px rgba(0, 100, 255, 0.1);
  border: 1px solid rgba(0, 150, 255, 0.25);
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #e0e6ff;
  position: relative;
  display: inline-block;
  text-shadow: 0 0 10px rgba(0, 195, 255, 0.4);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #0077ff, transparent);
    border-radius: 2px;
  }
`;

const FeatureStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
`;

const FeatureStat = styled.div`
  background-color: rgba(20, 30, 50, 0.8);
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 150, 255, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 100, 255, 0.1);
  }
`;

const StatName = styled.span`
  font-weight: 600;
  margin-right: 5px;
  color: #a0a6ce;
`;

const PlotsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 30px;
`;

const PlotCard = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 60px rgba(0, 100, 255, 0.1);
  border: 1px solid rgba(0, 150, 255, 0.25);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 80px rgba(0, 120, 255, 0.2);
  }
`;

const PlotTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #e0e6ff;
  text-align: center;
  text-shadow: 0 0 10px rgba(0, 195, 255, 0.4);
`;

const PlotImage = styled.img`
  width: 100%;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid rgba(0, 150, 255, 0.2);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 120, 255, 0.2);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.2rem;
  color: #a0a6ce;
  background: rgba(10, 20, 40, 0.8);
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
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #ff5555;
  font-size: 1.2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  background: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 50, 50, 0.3);
  
  &::before {
    content: "⚠️";
    font-size: 1.8rem;
    margin-right: 10px;
  }
`;

const DatasetAnalysisPage: React.FC = () => {
  const [edaData, setEdaData] = useState<EDAData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEDAData = async () => {
      try {
        setLoading(true);
        const data = await fetchEDA();
        setEdaData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load EDA data. Please try again later.');
        console.error('Error fetching EDA data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEDAData();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageTitle>Dataset Analysis</PageTitle>
        <LoadingContainer>Loading data analysis...</LoadingContainer>
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

  return (
    <PageContainer>
      <PageTitle>Dataset Analysis</PageTitle>

      <StatsContainer>
        <StatCard>
          <StatValue>{stats.total_samples}</StatValue>
          <StatLabel>Total Samples</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.placement_rate.toFixed(1)}%</StatValue>
          <StatLabel>Placement Rate</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.train_test_split}</StatValue>
          <StatLabel>Train/Test Split</StatLabel>
        </StatCard>
      </StatsContainer>

      <FeatureContainer>
        <FeatureTitle>CGPA Statistics</FeatureTitle>
        <FeatureStats>
          <FeatureStat>
            <StatName>Mean:</StatName> {stats.features.cgpa.mean.toFixed(2)}
          </FeatureStat>
          <FeatureStat>
            <StatName>Median:</StatName> {stats.features.cgpa.median.toFixed(2)}
          </FeatureStat>
          <FeatureStat>
            <StatName>Range:</StatName> {stats.features.cgpa.min.toFixed(1)} - {stats.features.cgpa.max.toFixed(1)}
          </FeatureStat>
        </FeatureStats>
      </FeatureContainer>

      <FeatureContainer>
        <FeatureTitle>IQ Statistics</FeatureTitle>
        <FeatureStats>
          <FeatureStat>
            <StatName>Mean:</StatName> {stats.features.iq.mean.toFixed(2)}
          </FeatureStat>
          <FeatureStat>
            <StatName>Median:</StatName> {stats.features.iq.median.toFixed(2)}
          </FeatureStat>
          <FeatureStat>
            <StatName>Range:</StatName> {stats.features.iq.min.toFixed(1)} - {stats.features.iq.max.toFixed(1)}
          </FeatureStat>
        </FeatureStats>
      </FeatureContainer>

      <PlotsContainer>
        <PlotCard>
          <PlotTitle>CGPA Distribution</PlotTitle>
          <PlotImage src={`data:image/png;base64,${plots.cgpa_hist}`} alt="CGPA Distribution" />
        </PlotCard>
        
        <PlotCard>
          <PlotTitle>IQ Distribution</PlotTitle>
          <PlotImage src={`data:image/png;base64,${plots.iq_hist}`} alt="IQ Distribution" />
        </PlotCard>
        
        <PlotCard>
          <PlotTitle>Placement by CGPA and IQ</PlotTitle>
          <PlotImage src={`data:image/png;base64,${plots.scatter_plot}`} alt="Scatter Plot of CGPA vs IQ" />
        </PlotCard>
      </PlotsContainer>
    </PageContainer>
  );
};

export default DatasetAnalysisPage;