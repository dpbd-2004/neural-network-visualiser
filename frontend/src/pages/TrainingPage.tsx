    import React, { useState } from 'react';
    import styled from 'styled-components';

    //--- Styled Components ---
    // This is a modern way to write CSS directly in your component files.
    // It keeps your styling organized and scoped to the component it belongs to.

    const PageContainer = styled.div`
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      font-family: sans-serif;
      color: #333;
    `;

    const ControlsContainer = styled.div`
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const ControlGroup = styled.div`
      display: flex;
      flex-direction: column;
      min-width: 200px;
    `;

    const ButtonGroup = styled.div`
      display: flex;
      gap: 1rem;
      align-items: center;
    `;

    const Button = styled.button`
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      background-color: #007bff;
      color: white;
      font-size: 1rem;
      font-weight: bold;
      transition: background-color 0.2s;

      &:hover {
        background-color: #0056b3;
      }
    `;


    //--- React Component ---

    const TrainingPage: React.FC = () => {
      // State to manage the values of our sliders
      const [epochs, setEpochs] = useState(1000);
      const [learningRate, setLearningRate] = useState(0.01);

      return (
        <PageContainer>
          <h1>Neural Network Training</h1>
          <ControlsContainer>
            <ControlGroup>
              <label htmlFor="epochs">Epochs: {epochs}</label>
              <input
                type="range"
                id="epochs"
                min="100"
                max="10000"
                step="100"
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
              />
            </ControlGroup>
            <ControlGroup>
              <label htmlFor="learningRate">Learning Rate: {learningRate}</label>
              <input
                type="range"
                id="learningRate"
                min="0.001"
                max="0.1"
                step="0.001"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
              />
            </ControlGroup>
            <ButtonGroup>
                <Button>Start Training</Button>
                <Button style={{ backgroundColor: '#6c757d' }}>Reset</Button>
            </ButtonGroup>
          </ControlsContainer>

          {/* The Neural Network Visualizer will be added here in the next step */}

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