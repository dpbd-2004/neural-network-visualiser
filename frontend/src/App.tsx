import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import TrainingPage from './pages/TrainingPage';

function App() {
  return (
    <div>
      <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Training</Link>
        {/* We will add links to other pages here later */}
      </nav>

      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<TrainingPage />} />
          {/* We will add routes to other pages here later */}
        </Routes>
      </main>
    </div>
  );
}

export default App;