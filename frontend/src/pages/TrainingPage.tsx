/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';
import { 
  Typography, 
  Stack as MuiStack,
  Button as MuiButton,
  ButtonGroup as MuiButtonGroup
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { NeuralNetworkVisualizer } from '../components/NeuralNetworkVisualizer';
import { 
  TrainingStatus,
  TrainingFormData,
} from '../types';
import { 
  startTraining, 
  getTrainingStatus, 
  saveModel, 
  getModelState, 
  getSessions,
  replaySession
} from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Styled components
const PageContainer = styled.div`
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const PageTitle = styled.h1`
  font-size: 2.7rem;
  text-align: center;
  margin-bottom: 40px;
  color: ${({ theme }) => theme.lightText};
  position: relative;
  letter-spacing: 1px;
  text-shadow: 0 0 20px rgba(77, 140, 255, 0.4);
  font-weight: 800;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -15px;
    left: 0;
    width: 120px;
    height: 3px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.highlight});
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(77, 140, 255, 0.6);
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 22px;
  color: ${({ theme }) => theme.lightText};
  border-bottom: 2px solid ${({ theme }) => theme.border};
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(77, 140, 255, 0.3);
  
  &::before {
    content: '⚡';
    margin-right: 12px;
    font-size: 1.5rem;
    color: ${({ theme }) => theme.highlight};
    text-shadow: 0 0 15px rgba(155, 122, 255, 0.5);
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 40px;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TrainingForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FormLabel = styled.label`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 8px;
  display: block;
  color: ${({ theme }) => theme.text};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}40`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.neutralText};
  }
`;

const FormRow = styled.div`
  margin-bottom: 20px;
`;

const SubmitButton = styled.button`
  background: linear-gradient(to right, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  color: ${({ theme }) => theme.lightText};
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${({ theme }) => `${theme.colors.primary}60`};
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:disabled {
    background: ${({ theme }) => theme.border};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button<{ primary?: boolean; disabled?: boolean }>`
  padding: 12px 25px;
  background: ${props => (props.primary 
    ? 'linear-gradient(135deg, #0052d4, #4364f7, #6fb1fc)' 
    : 'rgba(15, 30, 60, 0.7)')};
  color: #ffffff;
  border: 1px solid ${props => (props.primary ? 'transparent' : 'rgba(0, 150, 255, 0.3)')};
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.7 : 1)};
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  text-shadow: ${props => (props.primary ? '0 0 10px rgba(0, 100, 255, 0.5)' : 'none')};
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(255, 255, 255, 0.1), 
      transparent
    );
    transition: all 0.6s;
  }

  &:hover {
    background: ${props => (props.primary 
      ? 'linear-gradient(135deg, #0077ff, #00c3ff)' 
      : 'rgba(25, 40, 80, 0.8)')};
    transform: ${props => (props.disabled ? 'none' : 'translateY(-3px)')};
    box-shadow: ${props => (props.disabled 
      ? 'none' 
      : '0 6px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 120, 255, 0.3)')};
    
    &::before {
      left: 100%;
    }
  }
  
  &::after {
    content: ${props => (props.primary ? '"🚀"' : '"💾"')};
    font-size: 1.2rem;
  }
`;

const StatusContainer = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-radius: 12px;
  padding: 25px;
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

const StatusRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const StatusCard = styled.div`
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 20px ${({ theme }) => theme.darkShadow};
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const StatusTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.lightText};
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: "⚙️";
    font-size: 1.1rem;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
`;

const StatusItem = styled.div`
  text-align: center;
  padding: 15px;
  background: ${({ theme }) => `${theme.cardBackground}99`};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 4px 8px ${({ theme }) => theme.darkShadow};
`;

const StatusLabel = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.neutralText};
  margin-bottom: 6px;
`;

const StatusValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.lightText};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  background: ${({ theme }) => `${theme.cardBackground}90`};
  border-radius: 6px;
  margin: 20px 0 5px;
  overflow: hidden;
  position: relative;
  border: 1px solid ${({ theme }) => theme.border};
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.highlight});
  border-radius: 5px;
  transition: width 0.3s ease;
  position: relative;
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  }
`;

const ChartContainer = styled.div`
  background: rgba(10, 20, 40, 0.4);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  flex: 1;
  min-width: 300px;
  height: 300px;
  display: flex;
  flex-direction: column;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
  }
`;

const EpochControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
`;

const EpochButton = styled.button`
  background: rgba(5, 15, 35, 0.6);
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 6px;
  padding: 8px 15px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: rgba(0, 150, 255, 0.2);
    box-shadow: 0 0 10px rgba(0, 150, 255, 0.2);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const EpochIndicator = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(5, 15, 35, 0.6);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
  padding: 8px 15px;
  min-width: 80px;
  text-align: center;
`;

const BoundaryTitle = styled.h3`
  &::before {
    content: "🧠";
  }
`;

const ChartCard = styled.div`
  background: rgba(10, 20, 40, 0.4);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-height: 650px;
  overflow: auto;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
  }
`;

const DecisionBoundaryContainer = styled(ChartCard)`
  text-align: center;
  background: linear-gradient(to bottom, ${({ theme }) => theme.cardBackground}, rgba(15, 25, 45, 0.95));
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow}, 0 0 20px rgba(77, 140, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px ${({ theme }) => theme.darkShadow}, 0 0 30px rgba(77, 140, 255, 0.2);
  }
`;

const DecisionBoundaryImage = styled.img`
  max-width: 100%;
  border-radius: 10px;
  margin-top: 15px;
  border: 1px solid rgba(0, 150, 255, 0.3);
  transition: all 0.4s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 100, 255, 0.15);
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 120, 255, 0.25);
    border-color: rgba(0, 195, 255, 0.5);
  }
`;

// Additional styled components to organize the page
const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  
  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const VisualizerSection = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 1200px) {
    grid-column: 1 / 2;
    grid-row: span 2;
  }
`;

const StatsSection = styled.div`
  grid-column: 1 / -1;
  
  @media (min-width: 1200px) {
    grid-column: 2 / 3;
  }
`;

const ChartsSection = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: 1200px) {
    grid-column: 2 / 3;
    grid-template-columns: 1fr;
  }
`;

const ChartHeading = styled.h3`
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  color: ${({ theme }) => theme.highlight};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 3px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
    border-radius: 3px;
  }
`;

const NoticeContainer = styled.div`
  background-color: rgba(10, 20, 40, 0.8);
  border-left: 4px solid #00f7ff;
  padding: 20px;
  margin: 25px 0;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 100, 255, 0.1);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  color: #e0e6ff;
  border: 1px solid rgba(0, 150, 255, 0.25);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: "💡";
    font-size: 1.8rem;
    margin-right: 15px;
    text-shadow: 0 0 10px rgba(255, 255, 200, 0.5);
  }
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(to bottom, transparent, #00f7ff, transparent);
    opacity: 0.7;
  }
`;

// Add a new component for displaying network stats
const NetworkStats = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.cardBackground}, rgba(15, 25, 45, 0.95));
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow}, 0 0 30px rgba(77, 140, 255, 0.08);
  border: 1px solid ${({ theme }) => theme.border};
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px ${({ theme }) => theme.darkShadow}, 0 0 30px rgba(77, 140, 255, 0.15);
  }
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
  }
`;

const StatsTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: "⚙️";
    font-size: 1.2rem;
  }
`;

const StatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => `${theme.border}80`};
  }
  
  th {
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
    background-color: rgba(10, 20, 40, 0.3);
  }
  
  tr:hover {
    background-color: rgba(77, 140, 255, 0.05);
  }
  
  .positive {
    color: ${({ theme }) => theme.colors.secondary};
    font-weight: 600;
    text-shadow: 0 0 8px rgba(0, 230, 118, 0.2);
  }
  
  .negative {
    color: ${({ theme }) => theme.accent};
    font-weight: 600;
    text-shadow: 0 0 8px rgba(255, 100, 100, 0.2);
  }
`;

// Updated chart controls
const ChartControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  background-color: rgba(5, 15, 30, 0.9);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
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
`;

const ControlButton = styled.button`
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background-color: rgba(15, 30, 60, 0.8);
  color: #e0e6ff;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 100, 255, 0.2);
  letter-spacing: 0.5px;
  
  &:hover:not(:disabled) {
    background-color: rgba(20, 40, 80, 0.9);
    border-color: rgba(0, 150, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 100, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CurrentEpoch = styled.div`
  padding: 8px 14px;
  margin: 0 10px;
  font-weight: bold;
  color: #00f7ff;
  font-family: 'Roboto Mono', monospace;
  text-shadow: 0 0 10px rgba(0, 247, 255, 0.5);
  letter-spacing: 0.5px;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  margin-left: 15px;
  border: 1px solid ${props => props.active ? 'rgba(0, 150, 255, 0.4)' : 'rgba(0, 100, 255, 0.2)'};
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #0052d4, #4364f7)' 
    : 'rgba(15, 30, 60, 0.8)'};
  color: ${props => props.active ? '#ffffff' : '#999999'};
  box-shadow: ${props => props.active 
    ? '0 4px 10px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 100, 255, 0.3)' 
    : 'none'};
  letter-spacing: 0.5px;
  
  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(135deg, #0077ff, #4364f7)' 
      : 'rgba(20, 40, 80, 0.9)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 100, 255, 0.2);
    border-color: rgba(0, 150, 255, 0.4);
  }
  
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${props => props.active 
      ? 'linear-gradient(to right, transparent, #00f7ff, transparent)' 
      : 'transparent'};
    opacity: 0.7;
  }
`;

const EpochDisplay = styled.button`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(10, 20, 40, 0.8);
  padding: 6px 12px;
  border: 1px solid rgba(0, 150, 255, 0.3);
  border-radius: 0;
  cursor: default;
  min-width: 80px;
`;

const ControlsContainer = styled.div`
  margin-bottom: 30px;
`;

const ControlsCard = styled.div`
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 20px ${({ theme }) => theme.darkShadow};
  margin-bottom: 25px;
  border: 1px solid ${({ theme }) => theme.border};
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 30px ${({ theme }) => theme.darkShadow}, 0 0 15px rgba(77, 140, 255, 0.1);
    transform: translateY(-3px);
  }
`;

const ControlsHeader = styled.h3`
  margin-bottom: 16px;
  font-size: 1.4rem;
  color: #e0e6ff;
  font-weight: 600;
`;

const ControlsGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
`;

const EpochNavigator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  margin-left: 10px;
`;

const Divider = styled.div`
  width: 1px;
  height: 30px;
  background-color: rgba(60, 80, 120, 0.5);
  margin: 0 10px;
`;

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  height: 100%;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const WeightsToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const WeightsToggleLabel = styled.span`
  margin-right: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
`;

const EpochsToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const EpochsToggleLabel = styled.span`
  margin-right: 10px;
  font-size: 14px;
  color: #e0e6ff;
`;

const FormCard = styled.div`
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow};
  margin-bottom: 25px;
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}40, transparent);
  }
`;

const NetworkVisualizationCard = styled.div`
  background: rgba(10, 20, 40, 0.4);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-height: 600px;
  overflow: auto;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
  }
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 44px;
  height: 22px;
  margin-right: 10px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: ${({ theme }) => theme.colors.primary}aa;
  }

  &:checked + span:before {
    transform: translateX(22px);
    background-color: ${({ theme }) => theme.lightText};
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.border};
  transition: 0.4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: ${({ theme }) => theme.lightText};
    transition: 0.4s;
    border-radius: 50%;
  }
`;

// Update the TrainingStatus interface to match the API response
interface ExtendedTrainingStatus extends TrainingStatus {
  current_epoch?: number;
  current_loss?: number;
}

// Styled components for session selection
const SessionsContainer = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.cardBackground}, rgba(15, 25, 45, 0.95));
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow}, 0 0 30px rgba(77, 140, 255, 0.08);
  border: 1px solid ${({ theme }) => theme.border};
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
  }
`;

const SessionsTitle = styled.h3`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.lightText};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: "📅";
    font-size: 1.3rem;
  }
`;

const SessionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const SessionCard = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgba(10, 20, 40, 0.4);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => `${theme.border}80`};
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(77, 140, 255, 0.1);
    border-color: ${({ theme }) => theme.colors.primary}60;
  }
`;

const SessionCardHeader = styled.div`
  padding: 15px;
  background: linear-gradient(to right, rgba(10, 30, 60, 0.7), rgba(20, 40, 70, 0.7));
  border-bottom: 1px solid ${({ theme }) => `${theme.border}60`};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SessionDate = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.lightText};
  font-weight: 500;
`;

const SessionId = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.neutralText};
  font-family: 'Roboto Mono', monospace;
  background-color: rgba(10, 15, 30, 0.7);
  padding: 3px 8px;
  border-radius: 4px;
`;

const SessionCardBody = styled.div`
  padding: 15px;
  flex-grow: 1;
`;

const SessionParameter = styled.div`
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SessionParamLabel = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.neutralText};
`;

const SessionParamValue = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.lightText};
  font-weight: 600;
  font-family: 'Roboto Mono', monospace;
`;

const SessionCardFooter = styled.div`
  padding: 15px;
  background-color: rgba(10, 15, 30, 0.5);
  border-top: 1px solid ${({ theme }) => `${theme.border}60`};
  display: flex;
  justify-content: center;
`;

const SessionButton = styled.button<{ disabled?: boolean }>`
  background: ${({ disabled }) => disabled 
    ? 'rgba(50, 60, 80, 0.5)' 
    : 'linear-gradient(to right, rgba(77, 140, 255, 0.3), rgba(155, 122, 255, 0.3))'};
  color: ${({ disabled, theme }) => disabled ? theme.neutralText : theme.lightText};
  border: 1px solid ${({ disabled, theme }) => disabled 
    ? `${theme.border}60` 
    : `${theme.colors.primary}60`};
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ disabled }) => disabled 
      ? 'rgba(50, 60, 80, 0.5)' 
      : 'linear-gradient(to right, rgba(77, 140, 255, 0.5), rgba(155, 122, 255, 0.5))'};
    transform: ${({ disabled }) => disabled ? 'none' : 'translateY(-2px)'};
  }
`;

// Create a specific parameters display component for tracking all weights and biases
const ParametersTracker = styled.div`
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, ${({ theme }) => theme.cardBackground}, rgba(15, 25, 45, 0.95));
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 10px 30px ${({ theme }) => theme.darkShadow}, 0 0 30px rgba(77, 140, 255, 0.08);
  border: 1px solid ${({ theme }) => theme.border};
  margin-bottom: 25px;
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.primary}80, transparent);
  }
`;

const ParametersTitle = styled.h3`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.lightText};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: "⚙️";
    font-size: 1.3rem;
  }
`;

const ParametersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;
`;

const ParameterCard = styled.div<{ value: number | undefined }>`
  background-color: ${({ theme, value }) => 
    value !== undefined && value >= 0 
      ? `rgba(0, 230, 118, 0.1)` 
      : `rgba(255, 100, 100, 0.1)`};
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme, value }) => 
    value !== undefined && value >= 0 
      ? `rgba(0, 230, 118, 0.3)` 
      : `rgba(255, 100, 100, 0.3)`};
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme, value }) => 
      value !== undefined && value >= 0 
        ? `rgba(0, 230, 118, 0.6)` 
        : `rgba(255, 100, 100, 0.6)`};
  }
`;

const ParameterName = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.neutralText};
`;

const ParameterValue = styled.div<{ positive: boolean }>`
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme, positive }) => positive ? theme.colors.secondary : theme.accent};
`;

const ChartsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  width: 100%;
  max-height: 400px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 15px;
  text-align: center;
  color: ${({ theme }) => theme.highlight};
  opacity: 0.9;
  font-weight: 700;
`;

// Add a secondary button style for export button
const SecondaryButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  margin-left: 10px;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}15`};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.darkShadow};
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:disabled {
    border-color: ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.neutralText};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TrainingPage: React.FC = () => {
  // Get theme from styled-components
  const theme = useTheme() as DefaultTheme;
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    learning_rate: 0.01,
    epochs: 100,
  });

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<ExtendedTrainingStatus>({
    is_training: false,
    epoch: 0,
    total_epochs: 0,
    loss: 0,
    accuracy: 0,
    progress_percentage: 0,
  });

  // History state for charts
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [epochLabels, setEpochLabels] = useState<string[]>([]);
  
  // Polling interval
  const POLLING_INTERVAL = 1000; // 1 second

  // Use existing epochLabels state instead of redeclaring
  useEffect(() => {
    if (lossHistory.length > 0) {
      setEpochLabels(Array.from({ length: lossHistory.length }, (_, i) => `Epoch ${i + 1}`));
    }
  }, [lossHistory.length]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value),
    });
  };

  // Start training
  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await startTraining(formData);
      setIsTraining(true);
      
      // Reset history for new training session
      setLossHistory([]);
      setAccuracyHistory([]);
      setEpochLabels([]);
    } catch (error) {
      console.error('Failed to start training:', error);
      alert('Failed to start training. Please try again.');
    }
  };

  // Check training status periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isTraining) {
      intervalId = setInterval(async () => {
        try {
          console.log("Polling for training status...");
          const status = await getTrainingStatus();
          console.log("Received training status:", status);

          // Ensure consistent structure with safer access
          const processedStatus = {
            ...status,
            weights: status.weights || status.current_weights,
            biases: status.biases || status.current_biases,
          };

          if (status.decision_boundary && typeof status.decision_boundary === 'string') {
            // If decision_boundary is just a string (base64 image), convert to expected object structure
            processedStatus.decision_boundary = {
              epoch: status.epoch,
              image: status.decision_boundary
            };
          }

          console.log("Processed training status:", processedStatus);
          setTrainingStatus(processedStatus);

          // Update history arrays for charts
          if (status.epoch > 0 && status.loss !== undefined) {
            setLossHistory(prevLoss => {
              if (prevLoss.length < status.epoch) {
                return [...prevLoss, status.loss];
              }
              return prevLoss;
            });

            setAccuracyHistory(prevAcc => {
              if (prevAcc.length < status.epoch) {
                return [...prevAcc, status.accuracy];
              }
              return prevAcc;
            });

            setEpochLabels(prevLabels => {
              if (prevLabels.length < status.epoch) {
                return [...prevLabels, `Epoch ${status.epoch}`];
              }
              return prevLabels;
            });
          }

          // Stop polling if training is complete
          if (!status.is_training && status.progress_percentage === 100) {
            setIsTraining(false);
            
            // Fetch final model state to ensure we have the most up-to-date weights and decision boundary
            try {
              console.log("Fetching final model state...");
              const finalModelState = await getModelState();
              console.log("Final model state:", finalModelState);
              
              setTrainingStatus(prevStatus => ({
                ...prevStatus,
                weights: finalModelState.weights || prevStatus.weights,
                biases: finalModelState.biases || prevStatus.biases,
                decision_boundary: finalModelState.decision_boundary || prevStatus.decision_boundary
              }));
            } catch (err) {
              console.error("Failed to fetch final model state:", err);
            }
          }
        } catch (error) {
          console.error('Failed to fetch training status:', error);
        }
      }, POLLING_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTraining]);

  // Handle export model
  const handleExportModel = async () => {
    try {
      const modelData = await saveModel();
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = modelData.download_url;
      downloadLink.download = modelData.filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Failed to export model:', error);
      alert('Failed to export model. Please try again.');
    }
  };

  // UseEffect to fetch model state on page load
  useEffect(() => {
    const fetchModelState = async () => {
      try {
        console.log("Fetching model state...");
        const modelState = await getModelState();
        console.log("Received model state:", modelState);
        
        // Ensure we have default values even if the backend doesn't provide them
        const defaultWeights = {
          W1: [
            [0.01, 0.01],
            [0.01, 0.01]
          ],
          W2: [
            [0.01],
            [0.01]
          ]
        };
        const defaultBiases = {
          b1: [
            [0.0],
            [0.0]
          ],
          b2: [
            [0.0]
          ]
        };

        // Process decision boundary format
        let processedDecisionBoundary = modelState.decision_boundary;
        
        // If decision_boundary is a string, convert to object format
        if (typeof modelState.decision_boundary === 'string') {
          processedDecisionBoundary = {
            epoch: 0,
            image: modelState.decision_boundary
          };
        }

        setTrainingStatus(prevStatus => ({
          ...prevStatus,
          weights: modelState.weights || defaultWeights,
          biases: modelState.biases || defaultBiases,
          decision_boundary: processedDecisionBoundary
        }));
        
        console.log("Updated training status with model state");
      } catch (error) {
        console.error('Failed to fetch model state:', error);
        
        // Set default values if API call fails
        setTrainingStatus(prevStatus => ({
          ...prevStatus,
          weights: {
            W1: [
              [0.01, 0.01],
              [0.01, 0.01]
            ],
            W2: [
              [0.01],
              [0.01]
            ]
          },
          biases: {
            b1: [
              [0.0],
              [0.0]
            ],
            b2: [
              [0.0]
            ]
          }
        }));
        
        console.log("Set default weights and biases due to API error");
      }
    };

    fetchModelState();
  }, []);

  // Format a number for display
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return 'N/A';
    return num.toFixed(4);
  };

  // New function to render training status in an organized card
  const renderTrainingStatus = () => {
    const progress = trainingStatus && trainingStatus.total_epochs 
      ? ((trainingStatus.current_epoch || trainingStatus.epoch) / trainingStatus.total_epochs) * 100 
      : 0;
      
    return (
      <StatusCard>
        <StatusTitle>Training Status</StatusTitle>
        {!trainingStatus ? (
          <div style={{ textAlign: 'center', padding: '20px', color: theme.neutralText }}>
            Training has not started yet. Configure parameters and click "Start Training" to begin.
          </div>
        ) : (
          <>
            <StatusGrid>
              <StatusItem>
                <StatusLabel>Current Epoch</StatusLabel>
                <StatusValue>{trainingStatus.current_epoch || trainingStatus.epoch || 0}</StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Total Epochs</StatusLabel>
                <StatusValue>{trainingStatus.total_epochs}</StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Current Loss</StatusLabel>
                <StatusValue>
                  {trainingStatus.current_loss !== undefined
                    ? trainingStatus.current_loss.toFixed(4)
                    : trainingStatus.loss !== undefined
                    ? trainingStatus.loss.toFixed(4)
                    : "N/A"}
                </StatusValue>
              </StatusItem>
              <StatusItem>
                <StatusLabel>Accuracy</StatusLabel>
                <StatusValue>
                  {trainingStatus.accuracy
                    ? `${(trainingStatus.accuracy * 100).toFixed(2)}%`
                    : "N/A"}
                </StatusValue>
              </StatusItem>
            </StatusGrid>
            <div>
              <ProgressBar>
                <ProgressFill progress={progress} />
              </ProgressBar>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.8rem', 
                color: theme.neutralText,
                marginTop: '5px'
              }}>
                <span>Progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </div>
          </>
        )}
      </StatusCard>
    );
  };

  // Update the neural network rendering function
  const renderNeuralNetwork = () => {
    console.log("Rendering neural network with weights:", trainingStatus.weights);
    console.log("Rendering neural network with biases:", trainingStatus.biases);
    
    return (
      <>
        <NetworkVisualizationCard>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '10px'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.highlight }}>
              Neural Network Architecture
            </Typography>
          </div>
        
          {trainingStatus.weights && trainingStatus.biases ? (
            <NeuralNetworkVisualizer
              weights={trainingStatus.weights}
              biases={trainingStatus.biases}
              width={800}
              height={450}
              epoch={trainingStatus.epoch}
              inputValues={[0.5, 0.5]}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '150px 0', 
              color: theme.neutralText,
              fontStyle: 'italic'
            }}>
              Loading neural network visualization...
              {JSON.stringify(trainingStatus.weights) === undefined && <div>Weights data is missing</div>}
              {JSON.stringify(trainingStatus.biases) === undefined && <div>Biases data is missing</div>}
            </div>
          )}
        </NetworkVisualizationCard>
        
        {/* Add parameters tracker right under the network visualization */}
        {renderParametersTracker()}
      </>
    );
  };

  // Add a new function to render detailed parameters tracker
  const renderParametersTracker = () => {
    if (!trainingStatus.weights || !trainingStatus.biases) {
      return null;
    }

    // Extract all parameters for display
    const parameters = [
      // Input to Hidden layer weights (W1)
      { name: 'W1[0,0]', value: trainingStatus.weights.W1?.[0]?.[0], description: 'CGPA → Hidden 1' },
      { name: 'W1[0,1]', value: trainingStatus.weights.W1?.[0]?.[1], description: 'CGPA → Hidden 2' },
      { name: 'W1[1,0]', value: trainingStatus.weights.W1?.[1]?.[0], description: 'IQ → Hidden 1' },
      { name: 'W1[1,1]', value: trainingStatus.weights.W1?.[1]?.[1], description: 'IQ → Hidden 2' },
      
      // Hidden layer biases (b1)
      { name: 'b1[0]', value: trainingStatus.biases.b1?.[0]?.[0], description: 'Hidden 1 bias' },
      { name: 'b1[1]', value: trainingStatus.biases.b1?.[1]?.[0], description: 'Hidden 2 bias' },
      
      // Hidden to Output layer weights (W2)
      { name: 'W2[0,0]', value: trainingStatus.weights.W2?.[0]?.[0], description: 'Hidden 1 → Output' },
      { name: 'W2[1,0]', value: trainingStatus.weights.W2?.[1]?.[0], description: 'Hidden 2 → Output' },
      
      // Output layer bias (b2)
      { name: 'b2[0]', value: trainingStatus.biases.b2?.[0]?.[0], description: 'Output bias' }
    ];

    return (
      <ParametersTracker>
        <ParametersTitle>Neural Network Parameters (Current Epoch: {trainingStatus.epoch || 0})</ParametersTitle>
        <ParametersGrid>
          {parameters.map((param, index) => (
            <ParameterCard key={index} value={param.value}>
              <ParameterName>
                {param.name} ({param.description})
              </ParameterName>
              <ParameterValue positive={param.value !== undefined && param.value >= 0}>
                {formatNumber(param.value)}
              </ParameterValue>
            </ParameterCard>
          ))}
        </ParametersGrid>
      </ParametersTracker>
    );
  };

  // Update the renderCharts function to use more contrasting colors and better text visibility
  const renderCharts = () => {
    if (lossHistory.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: theme.neutralText,
          fontStyle: 'italic'
        }}>
          No training data available yet. Start training to see charts.
        </div>
      );
    }

    // Chart options with improved contrast and readability
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: theme.text,
            font: {
              weight: 'bold' as const
            }
          },
          grid: {
            color: `${theme.text}33` // 20% opacity
          }
        },
        x: {
          ticks: {
            color: theme.text,
            font: {
              weight: 'bold' as const
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          },
          grid: {
            color: `${theme.text}33` // 20% opacity
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: theme.text,
            font: {
              weight: 'bold' as const
            },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: theme.cardBackground,
          titleColor: theme.colors.primary,
          bodyColor: theme.text,
          borderColor: theme.border,
          borderWidth: 1,
          padding: 12,
          boxWidth: 10,
          boxHeight: 10,
          boxPadding: 3,
          usePointStyle: true,
          callbacks: {
            labelTextColor: () => theme.text
          }
        }
      }
    };

    // Use the epochLabels state variable directly
    const labels = epochLabels.length > 0 ? epochLabels : Array.from({ length: lossHistory.length }, (_, i) => `Epoch ${i + 1}`);

    // Loss chart data with enhanced visibility
    const lossChartData = {
      labels,
      datasets: [
        {
          label: 'Loss',
          data: lossHistory,
          fill: {
            target: 'origin',
            above: `${theme.colors.danger}20` // Light fill
          },
          borderColor: theme.colors.danger,
          backgroundColor: theme.colors.danger,
          tension: 0.3,
          pointBackgroundColor: theme.colors.danger,
          pointBorderColor: theme.cardBackground,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    };

    // Accuracy chart data with enhanced visibility
    const accuracyChartData = {
      labels,
      datasets: [
        {
          label: 'Accuracy',
          data: accuracyHistory,
          fill: {
            target: 'origin',
            above: `${theme.colors.success}20` // Light fill
          },
          borderColor: theme.colors.success,
          backgroundColor: theme.colors.success,
          tension: 0.3,
          pointBackgroundColor: theme.colors.success,
          pointBorderColor: theme.cardBackground,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    };

    return (
      <ChartsContainer>
        <ChartContainer>
          <ChartTitle>Loss History</ChartTitle>
          <div style={{ position: 'relative', width: '100%', height: '250px' }}>
            <Line data={lossChartData} options={chartOptions} />
          </div>
        </ChartContainer>
        <ChartContainer>
          <ChartTitle>Accuracy History</ChartTitle>
          <div style={{ position: 'relative', width: '100%', height: '250px' }}>
            <Line data={accuracyChartData} options={chartOptions} />
          </div>
        </ChartContainer>
      </ChartsContainer>
    );
  };

  // Render the Training Form
  const renderTrainingForm = () => {
    return (
      <FormCard>
        <SectionTitle>Configure Training Parameters</SectionTitle>
        <form onSubmit={handleStartTraining}>
          <FormRow>
            <FormLabel htmlFor="learning_rate">Learning Rate</FormLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FormInput
                type="range"
                id="learning_rate"
                name="learning_rate"
                min="0.001"
                max="0.1"
                step="0.001"
                value={formData.learning_rate}
                onChange={handleInputChange}
              />
              <span style={{ 
                minWidth: '60px', 
                textAlign: 'center',
                color: theme.colors.primary,
                fontWeight: '600',
                fontSize: '1rem'
              }}>
                {formData.learning_rate}
              </span>
            </div>
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="epochs">Number of Epochs</FormLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FormInput
                type="range"
                id="epochs"
                name="epochs"
                min="1"
                max="500"
                step="1"
                value={formData.epochs}
                onChange={handleInputChange}
              />
              <span style={{ 
                minWidth: '60px', 
                textAlign: 'center',
                color: theme.colors.primary,
                fontWeight: '600',
                fontSize: '1rem'
              }}>
                {formData.epochs}
              </span>
            </div>
          </FormRow>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <SubmitButton type="submit" disabled={isTraining}>
              {isTraining ? 'Training in Progress...' : 'Start Training'}
            </SubmitButton>
            
            <SecondaryButton 
              type="button" 
              disabled={isTraining || !trainingStatus || trainingStatus.progress_percentage < 100}
              onClick={handleExportModel}
            >
              Export Model
            </SecondaryButton>
          </div>
        </form>
      </FormCard>
    );
  };

  // Render the decision boundary if available
  const renderDecisionBoundary = () => {
    console.log("Decision boundary data:", trainingStatus.decision_boundary);
    
    // No decision boundary data at all
    if (!trainingStatus.decision_boundary) {
      return (
        <DecisionBoundaryContainer>
          <BoundaryTitle>Decision Boundary</BoundaryTitle>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: theme.neutralText,
            fontStyle: 'italic'
          }}>
            Decision boundary visualization not available yet.
            Train the model to see the decision boundary.
          </div>
        </DecisionBoundaryContainer>
      );
    }

    // Extract the image string depending on the format
    let imageData: string;
    if (typeof trainingStatus.decision_boundary === 'string') {
      // Direct string format
      imageData = trainingStatus.decision_boundary;
    } else if (typeof trainingStatus.decision_boundary === 'object' && trainingStatus.decision_boundary.image) {
      // Object format with image property
      imageData = trainingStatus.decision_boundary.image;
    } else {
      // No valid image data
      return (
        <DecisionBoundaryContainer>
          <BoundaryTitle>Decision Boundary</BoundaryTitle>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: theme.neutralText,
            fontStyle: 'italic'
          }}>
            Invalid decision boundary data format.
          </div>
        </DecisionBoundaryContainer>
      );
    }

    // Render with the extracted image data
    return (
      <DecisionBoundaryContainer>
        <BoundaryTitle>Decision Boundary</BoundaryTitle>
        <DecisionBoundaryImage
          src={`data:image/png;base64,${imageData}`}
          alt="Decision Boundary"
        />
      </DecisionBoundaryContainer>
    );
  };

  return (
    <PageContainer>
      <PageTitle>Training Page</PageTitle>
      
      {/* Training Form Section */}
      {renderTrainingForm()}
      
      <SectionContainer>
        <MainLayout>
          <VisualizerSection>
            {renderNeuralNetwork()}
          </VisualizerSection>
          <StatsSection>
            {renderTrainingStatus()}
            
            {/* Charts Section */}
            <ChartCard>
              <ChartHeading>Training Progress</ChartHeading>
              {renderCharts()}
            </ChartCard>
            
            {/* Decision Boundary */}
            {renderDecisionBoundary()}
          </StatsSection>
        </MainLayout>
      </SectionContainer>

      {!isTraining && trainingStatus.progress_percentage === 0 && (
        <NoticeContainer>
          Configure your training parameters and click 'Start Training' to begin the neural network training process.
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
