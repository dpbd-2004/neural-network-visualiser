import React from 'react'; // Removed useState
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle, DefaultTheme } from 'styled-components'; // Removed ThemeProvider
import DatasetAnalysisPage from './pages/DatasetAnalysisPage';
import TrainingPage from './pages/TrainingPage';
import PredictionPage from './pages/PredictionPage';
import ChatbotWidget from './components/ChatbotWidget';
import { useTheme } from './contexts/ThemeContext'; // <-- Import our new hook

// Global styles (update to use new theme variables)
const GlobalStyle = createGlobalStyle<{theme: DefaultTheme}>`
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
  max-width: 1400px; /* Widen for new dropdown */
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary}; /* Dynamic color */
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.3s ease;
  
  img {
    width: 36px;
    height: 36px;
  }
`;

const NavContainer = styled.nav`
  display: flex;
  gap: 12px;
`;

// Update NavLink to use dynamic theme colors
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
    background: ${props => props.theme.primaryGradient}; /* Dynamic gradient */
    transition: all 0.3s ease;
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

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ModeSelect = styled.select`
  background: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-appearance: none;
  appearance: none;
  padding-right: 2.5rem; // space for arrow
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${props => props.theme.text.substring(1)}' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  background-size: 16px 16px;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 10px ${props => props.theme.colors.primary}30;
  }
`;

// Re-add ThemeToggle
const ThemeToggle = styled.button`
  background: ${props => props.theme.cardBackground};
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
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
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

// Navigation component (no changes)
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
  // Get all state and functions from our new context
  const { modelMode, setModelMode, themeMode, toggleThemeMode, theme } = useTheme(); 
  
  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelMode(event.target.value as 'classification' | 'regression');
  };
  
  return (
    // The <ThemeProvider> is now in index.tsx
    <Router>
      <GlobalStyle theme={theme} /> {/* Pass theme to GlobalStyle */}
      <AppContainer>
        <Header>
          <HeaderContent>
            <Logo>
              <img src="/BrainLogo.svg" alt="Neural Network Logo" />
              Neural Network Visualizer
            </Logo>
            <Navigation />
            <HeaderControls>
              <ModeSelect value={modelMode} onChange={handleModeChange}>
                <option value="classification">🔵 Classification</option>
                <option value="regression">🔴 Regression</option>
              </ModeSelect>
              
              <ThemeToggle onClick={toggleThemeMode}>
                {themeMode === 'dark' ? (
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
            </HeaderControls>
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

        <ChatbotWidget />
      </AppContainer>
    </Router>
  );
};

export default App;