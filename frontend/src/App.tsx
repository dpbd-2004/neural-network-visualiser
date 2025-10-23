import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle, DefaultTheme } from 'styled-components';
import DatasetAnalysisPage from './pages/DatasetAnalysisPage';
import TrainingPage from './pages/TrainingPage';
import PredictionPage from './pages/PredictionPage';

// Theme definitions with enhanced color schemes
const lightTheme: DefaultTheme = {
  colors: {
    primary: '#2962ff',    // Deeper blue for better contrast
    secondary: '#e91e63',  // Vibrant pink
    success: '#00c853',    // Brighter green
    danger: '#d50000',     // Deeper red
    text: '#212121'        // Very dark gray, almost black
  },
  background: '#f8f9fa',   // Light gray background
  text: '#212121',         // Very dark gray text
  cardBackground: '#ffffff', // Pure white card background
  border: '#e0e0e0',       // Light gray border
  highlight: '#bbdefb',    // Light blue highlight
  accent: '#ff4081',       // Bright pink accent
  darkShadow: 'rgba(0, 0, 0, 0.15)', // Lighter shadow
  lightText: '#ffffff',    // White text
  neutralText: '#424242'   // Dark gray for neutral text (better contrast)
};

const darkTheme: DefaultTheme = {
  colors: {
    primary: '#82b1ff',    // Brighter blue for dark mode
    secondary: '#ff80ab',  // Brighter pink
    success: '#69f0ae',    // Bright teal/green
    danger: '#ff5252',     // Bright red
    text: '#f5f5f5'        // Very light gray
  },
  background: '#121212',   // Very dark gray background
  text: '#f5f5f5',         // Very light gray text
  cardBackground: '#1e1e1e', // Dark card background
  border: '#424242',       // Medium-dark gray border
  highlight: '#3949ab',    // Deeper blue highlight
  accent: '#ff80ab',       // Bright pink accent
  darkShadow: 'rgba(0, 0, 0, 0.5)', // Darker shadow
  lightText: '#ffffff',    // White text
  neutralText: '#bdbdbd'   // Light gray for neutral text (better contrast)
};

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap');

  body {
    font-family: 'Inter', sans-serif;
    background-color: ${(props) => props.theme.background};
    color: ${(props) => props.theme.text};
    transition: all 0.3s ease;
    line-height: 1.5;
  }

  code, pre {
    font-family: 'Roboto Mono', monospace;
  }
  
  button, input, select, textarea {
    font-family: 'Inter', sans-serif;
  }
  
  h1, h2, h3, h4, h5, h6 {
    letter-spacing: -0.01em;
    line-height: 1.2;
    margin-bottom: 0.5em;
  }
  
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.background};
    border-radius: 5px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.border};
    border-radius: 5px;
    border: 2px solid ${(props) => props.theme.background};
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.colors.primary};
  }
`;

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background-color: ${props => props.theme.cardBackground};
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 20px ${props => props.theme.darkShadow};
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${props => props.theme.border};
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 10px;
  
  img {
    width: 36px;
    height: 36px;
  }
`;

const NavContainer = styled.nav`
  display: flex;
  gap: 12px;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  text-decoration: none;
  color: ${props => (props.$active ? props.theme.colors.primary : props.theme.text)};
  padding: 0.7rem 1.4rem;
  border-radius: 8px;
  font-weight: ${props => (props.$active ? '600' : '500')};
  transition: all 0.2s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => (props.$active ? '80%' : '0')};
    height: 3px;
    background: linear-gradient(to right, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary}90);
    transition: width 0.3s ease;
    border-radius: 3px;
  }

  &:hover {
    color: ${props => props.theme.colors.primary};
    background-color: ${props => `${props.theme.colors.primary}15`};
    box-shadow: 0 2px 8px ${props => props.theme.darkShadow};
    
    &::after {
      width: 70%;
    }
  }
`;

const ThemeToggle = styled.button`
  background: ${props => 
    props.theme === lightTheme 
      ? 'linear-gradient(to right, #ffffff, #e3f2fd)' 
      : 'linear-gradient(to right, #1e1e1e, #3d5afe20)'
  };
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  box-shadow: 0 2px 5px ${props => props.theme.darkShadow};

  &:hover {
    background: linear-gradient(to right, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
    color: ${props => props.theme.lightText};
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 4px 12px ${props => props.theme.darkShadow};
    transform: translateY(-2px);
  }
`;

const Footer = styled.footer`
  margin-top: auto;
  padding: 2rem;
  text-align: center;
  background-color: ${props => props.theme.cardBackground};
  border-top: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.neutralText};
  
  p {
    margin: 5px 0;
    font-size: 0.9rem;
  }
  
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ContentContainer = styled.main`
  flex: 1;
  padding: 0 1rem;
`;

// Navigation component
const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <NavContainer>
      <NavLink to="/" $active={location.pathname === '/'}>
        Dataset Analysis
      </NavLink>
      <NavLink to="/training" $active={location.pathname === '/training'}>
        Training
      </NavLink>
      <NavLink to="/prediction" $active={location.pathname === '/prediction'}>
        Test Your Data
      </NavLink>
    </NavContainer>
  );
};

// Main App component
const App: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };
  
  return (
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Router>
        <AppContainer>
          <Header>
            <HeaderContent>
              <Logo>
                <img src="/BrainLogo.svg" alt="Neural Network Logo" />
                Neural Network Visualizer
              </Logo>
              <Navigation />
              <ThemeToggle onClick={toggleTheme}>
                {isDarkTheme ? (
                  <>
                    <span role="img" aria-label="sun">☀️</span>
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="moon">🌙</span>
                    <span>Dark Mode</span>
                  </>
                )}
              </ThemeToggle>
            </HeaderContent>
          </Header>
          
          <ContentContainer>
            <Routes>
              <Route path="/" element={<DatasetAnalysisPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/prediction" element={<PredictionPage />} />
            </Routes>
          </ContentContainer>
          
          <Footer>
            <p>Neural Network Visualizer © {new Date().getFullYear()}</p>
            <p>Built with <span role="img" aria-label="heart">🧠</span> using React and Flask</p>
          </Footer>
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
};

export default App;