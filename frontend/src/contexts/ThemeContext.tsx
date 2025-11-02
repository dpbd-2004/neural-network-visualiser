import React, { createContext, useState, useContext, useMemo } from 'react';
import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';

// --- Base Themes (Dark & Light) ---
const darkBase = {
  darkShadow: 'rgba(0, 0, 0, 0.5)',
  lightText: '#ffffff',
  neutralText: '#bdbdbd',
  background: '#121212',
  text: '#f5f5f5',
  cardBackground: '#1e1e1e',
  border: '#424242',
};

const lightBase = {
  darkShadow: 'rgba(0, 0, 0, 0.15)',
  lightText: '#ffffff',
  neutralText: '#424242',
  background: '#f8f9fa',
  text: '#212121',
  cardBackground: '#ffffff',
  border: '#e0e0e0',
};

// --- Mode-Specific Themes ---

// CLASSIFICATION (Blue)
const classificationDark: DefaultTheme = {
  ...darkBase,
  colors: {
    primary: '#82b1ff',    // Bright blue
    secondary: '#ff80ab',  // Pink
    success: '#69f0ae',
    danger: '#ff5252',
    text: '#f5f5f5',
  },
  highlight: '#3949ab',
  accent: '#ff80ab',
  primaryGradient: 'linear-gradient(90deg, #82b1ff, #ff80ab)',
  primaryBoxShadow: '0 0 10px rgba(130, 177, 255, 0.8)',
};

const classificationLight: DefaultTheme = {
  ...lightBase,
  colors: {
    primary: '#2962ff',    // Deep blue
    secondary: '#e91e63',  // Pink
    success: '#00c853',
    danger: '#d50000',
    text: '#212121',
  },
  highlight: '#bbdefb',
  accent: '#ff4081',
  primaryGradient: 'linear-gradient(90deg, #2962ff, #e91e63)',
  primaryBoxShadow: '0 0 10px rgba(41, 98, 255, 0.8)',
};

// REGRESSION (Red)
const regressionDark: DefaultTheme = {
  ...darkBase,
  colors: {
    primary: '#ff5252',    // Bright red
    secondary: '#ff80ab',  // Pink
    success: '#69f0ae',
    danger: '#ff5252',
    text: '#f5f5f5',
  },
  highlight: '#d50000',
  accent: '#ff80ab',
  primaryGradient: 'linear-gradient(90deg, #ff5252, #ff80ab)',
  primaryBoxShadow: '0 0 10px rgba(255, 82, 82, 0.8)',
};

const regressionLight: DefaultTheme = {
  ...lightBase,
  colors: {
    primary: '#d50000',    // Deep red
    secondary: '#e91e63',  // Pink
    success: '#00c853',
    danger: '#d50000',
    text: '#212121',
  },
  highlight: '#ffcdd2',
  accent: '#ff4081',
  primaryGradient: 'linear-gradient(90deg, #d50000, #e91e63)',
  primaryBoxShadow: '0 0 10px rgba(213, 0, 0, 0.8)',
};


// --- Context Logic ---
export type ModelMode = 'classification' | 'regression';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  modelMode: ModelMode;
  themeMode: ThemeMode;
  setModelMode: (mode: ModelMode) => void;
  toggleThemeMode: () => void;
  theme: DefaultTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modelMode, setModelMode] = useState<ModelMode>('classification');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const toggleThemeMode = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => {
    if (modelMode === 'classification') {
      return themeMode === 'light' ? classificationLight : classificationDark;
    } else {
      return themeMode === 'light' ? regressionLight : regressionDark;
    }
  }, [modelMode, themeMode]);

  return (
    <ThemeContext.Provider value={{ modelMode, setModelMode, themeMode, toggleThemeMode, theme }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
};