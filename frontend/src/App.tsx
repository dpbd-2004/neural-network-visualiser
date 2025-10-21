import React, { useState } from 'react'; // Import useState for theme toggling
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'; // Use BrowserRouter
// Import necessary components from styled-components
import styled, { ThemeProvider, createGlobalStyle, DefaultTheme } from 'styled-components';
import TrainingPage from './pages/TrainingPage';
// Import other pages if/when you add them
// import DatasetAnalysisPage from './pages/DatasetAnalysisPage';
// import PredictionPage from './pages/PredictionPage';

// --- Define your Themes (copied from bhaskar-nie/App.tsx) ---
// Make sure these match the structure in your styled.d.ts
const lightTheme: DefaultTheme = {
  colors: {
    primary: '#2962ff', secondary: '#e91e63', success: '#00c853',
    danger: '#d50000', text: '#212121'
  },
  background: '#f8f9fa', text: '#212121', cardBackground: '#ffffff',
  border: '#e0e0e0', highlight: '#bbdefb', accent: '#ff4081',
  darkShadow: 'rgba(0, 0, 0, 0.15)', lightText: '#ffffff', neutralText: '#424242'
};

const darkTheme: DefaultTheme = {
   colors: {
    primary: '#82b1ff', secondary: '#ff80ab', success: '#69f0ae',
    danger: '#ff5252', text: '#f5f5f5'
  },
  background: '#121212', text: '#f5f5f5', cardBackground: '#1e1e1e',
  border: '#424242', highlight: '#3949ab', accent: '#ff80ab',
  darkShadow: 'rgba(0, 0, 0, 0.5)', lightText: '#ffffff', neutralText: '#bdbdbd'
};

// --- Global Styles (copied from bhaskar-nie/App.tsx) ---
const GlobalStyle = createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif; /* Add Google Font import if needed */
    background-color: ${(props) => props.theme.background};
    color: ${(props) => props.theme.text};
    transition: all 0.3s ease;
    line-height: 1.5;
  }
  /* Add other global styles from bhaskar-nie if desired */
`;

// --- Basic App Structure ---
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.main`
  flex: 1;
  padding: 1rem; /* Add some padding */
`;

// --- Main App Component ---
function App() {
  // Add state for theme toggling (optional, but good practice)
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true); // Default to dark

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    // Wrap the entire app with ThemeProvider
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <GlobalStyle /> {/* Apply global styles */}
      <Router> {/* Use BrowserRouter or HashRouter */}
        <AppContainer>
          <nav style={{ padding: '1rem', backgroundColor: isDarkTheme ? '#1e1e1e' : '#f0f0f0', borderBottom: `1px solid ${isDarkTheme ? '#424242' : '#ddd'}` }}>
            {/* Basic Nav */}
            <Link to="/training" style={{ marginRight: '1rem', color: isDarkTheme ? '#82b1ff' : '#2962ff' }}>Training</Link>
            {/* Add theme toggle button */}
             <button onClick={toggleTheme} style={{ float: 'right', padding: '0.5rem' }}>
               Toggle Theme ({isDarkTheme ? 'Dark' : 'Light'})
             </button>
          </nav>

          <ContentContainer>
            <Routes>
              {/* Set TrainingPage as the default route for '/' */}
              <Route path="/" element={<TrainingPage />} />
              <Route path="/training" element={<TrainingPage />} />
              {/* Add other routes later */}
              {/* <Route path="/analysis" element={<DatasetAnalysisPage />} /> */}
              {/* <Route path="/predict" element={<PredictionPage />} /> */}
            </Routes>
          </ContentContainer>

           {/* Optional Footer */}
           {/* <footer style={{ marginTop: 'auto', padding: '1rem', textAlign: 'center', borderTop: `1px solid ${isDarkTheme ? '#424242' : '#ddd'}` }}>
             My Visualizer
           </footer> */}
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;