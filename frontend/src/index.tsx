// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
//import reportWebVitals from './reportWebVitals';
import { AppThemeProvider } from './contexts/ThemeContext'; // <-- Import new provider

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppThemeProvider>  {/* <-- Use new provider */}
      <App />
    </AppThemeProvider>
  </React.StrictMode>
);

//reportWebVitals();

// If you have reportWebVitals, keep it:
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();