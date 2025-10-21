import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// REMOVE: import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* Render App directly, as it handles its own routing */}
    <App />
  </React.StrictMode>
);

// If you have reportWebVitals, keep it:
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();