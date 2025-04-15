import { useState, useEffect } from 'react';
import './App.css';

// Phone options
const phones = [
  'iPhone 12',
  'Itel A56',
  'Tecno Camon 12',
  'Infinix Hot 10',
  'Huawei P30',
  'Google Pixel 7',
  'Xiaomi Redmi Note 10',
  'Samsung Galaxy S22',
  'Motorola razr+',
  'iPhone XR',
  'Samsung Galaxy Note 10'
];

// Criteria and their importance scale
const criteria = [
  { name: 'Memory', importance: 1 },
  { name: 'Storage', importance: 1 },
  { name: 'CPU Frequency', importance: 1 },
  { name: 'Price', importance: 1 },
  { name: 'Brand', importance: 1 }
];

// Mock data for phone specifications
const phoneData = {
  "iPhone 12": { memory: 4, storage: 128, cpu: 3.1, price: 799, brand: 9 },
  "Itel A56": { memory: 2, storage: 32, cpu: 1.6, price: 150, brand: 2 },
  "Tecno Camon 12": { memory: 3, storage: 64, cpu: 2.0, price: 250, brand: 4 },
  "Infinix Hot 10": { memory: 4, storage: 128, cpu: 2.3, price: 180, brand: 3 },
  "Huawei P30": { memory: 6, storage: 128, cpu: 2.6, price: 699, brand: 8 },
  "Google Pixel 7": { memory: 8, storage: 128, cpu: 2.8, price: 799, brand: 9 },
  "Xiaomi Redmi Note 10": { memory: 4, storage: 128, cpu: 2.2, price: 249, brand: 7 },
  "Samsung Galaxy S22": { memory: 8, storage: 128, cpu: 3.0, price: 899, brand: 9 },
  "Motorola razr+": { memory: 6, storage: 256, cpu: 2.8, price: 1399, brand: 6 },
  "iPhone XR": { memory: 3, storage: 64, cpu: 2.5, price: 599, brand: 9 },
  "Samsung Galaxy Note 10": { memory: 8, storage: 256, cpu: 2.9, price: 999, brand: 9 }
};

// AHP Implementation
const AHP = {
  // Scale of preference (1-9 scale)
  scale: {
    1: 'Equal importance',
    3: 'Moderate importance of one over another',
    5: 'Essential or strong importance',
    7: 'Very strong importance',
    9: 'Extreme importance',
    2: 'Intermediate value between 1 and 3',
    4: 'Intermediate value between 3 and 5',
    6: 'Intermediate value between 5 and 7',
    8: 'Intermediate value between 7 and 9'
  },

  // Create pairwise comparison matrix
  createPairwiseMatrix: (criteria) => {
    const matrix = Array(criteria.length).fill().map(() => Array(criteria.length).fill(1));

    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        // Default to 1 (equal importance) - will be updated by user input
        matrix[i][j] = 1;
        matrix[j][i] = 1;
      }
    }
    return matrix;
  },

  // Calculate eigenvector (criteria weights)
  calculateWeights: (matrix) => {
    const n = matrix.length;
    const sums = matrix.map(row => row.reduce((a, b) => a + b, 0));
    const normalizedMatrix = matrix.map((row, i) =>
      row.map(value => value / sums[i])
    );

    const columnSums = normalizedMatrix[0].map((_, colIndex) =>
      normalizedMatrix.reduce((sum, row) => sum + row[colIndex], 0)
    );

    const weights = columnSums.map(sum => sum / n);
    return weights;
  },

  // Calculate consistency ratio
  calculateConsistency: (matrix, weights) => {
    const n = matrix.length;
    const lambdaMax = weights.reduce((sum, weight, i) =>
      sum + weight * matrix.map(row => row[i]).reduce((a, b) => a + b)
      , 0);

    const consistencyIndex = (lambdaMax - n) / (n - 1);
    const randomIndex = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n];
    const consistencyRatio = consistencyIndex / randomIndex;

    return {
      consistencyIndex,
      consistencyRatio,
      isConsistent: consistencyRatio < 0.1
    };
  }
};

function App() {
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [pairwiseMatrix, setPairwiseMatrix] = useState(AHP.createPairwiseMatrix(criteria));
  const [weights, setWeights] = useState([]);
  const [consistency, setConsistency] = useState(null);

  useEffect(() => {
    calculateBestPhone();
  }, [pairwiseMatrix]);

  const updatePairwiseMatrix = (row, col, value) => {
    const newMatrix = [...pairwiseMatrix];
    newMatrix[row][col] = value;
    newMatrix[col][row] = 1 / value;
    setPairwiseMatrix(newMatrix);
  };

  const calculateBestPhone = () => {
    // Calculate criteria weights
    const weights = AHP.calculateWeights(pairwiseMatrix);
    setWeights(weights);

    // Verify consistency
    const consistency = AHP.calculateConsistency(pairwiseMatrix, weights);
    setConsistency(consistency);

    if (!consistency.isConsistent) {
      console.warn('Pairwise comparison matrix is inconsistent. Please review your comparisons.');
      return;
    }

    // Normalize phone data and calculate scores
    const normalizedData = {};
    phones.forEach(phone => {
      normalizedData[phone] = {};
      criteria.forEach(criterion => {
        const value = phoneData[phone][criterion.name.toLowerCase()];
        normalizedData[phone][criterion.name] = value;
      });
    });

    // Calculate weighted scores
    const scores = phones.map(phone => {
      let totalScore = 0;
      criteria.forEach((criterion, index) => {
        const weight = weights[index];
        const value = normalizedData[phone][criterion.name];
        totalScore += value * weight;
      });
      return { phone, score: totalScore };
    });

    // Find the best phone
    const bestPhone = scores.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    setSelectedPhone(bestPhone.phone);
    setShowResults(true);
  };

  return (
    <div className="app-container">
      <h1>Phone Selection Using AHP</h1>

      <div className="criteria-section">
        <h2 className='text-left my-5'>Selection Criteria</h2>

        {criteria.map(criterion => (
          <p key={criterion.name} className='text-left my-1 text-amber-400'>{criterion.name}</p>
        ))}
        <div className="pairwise-comparison  overflow-auto">
          <h3 className='text-left my-5'>Pairwise Comparison Matrix</h3>
          <table>
            <thead>
              <tr className='bg-amber-800 p-2'>
                <th></th>
                {criteria.map(criterion => (
                  <th key={criterion.name}>{criterion.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((rowCriterion, rowIndex) => (
                <tr key={rowCriterion.name}>
                  <td className='bg-amber-800 p-2'>{rowCriterion.name}</td>
                  {criteria.map((colCriterion, colIndex) => (
                    <td key={colCriterion.name} className='p-2 border'>
                      {rowIndex === colIndex ? (
                        <span>1</span>
                      ) : (
                        <select
                          value={pairwiseMatrix[rowIndex][colIndex]}
                          onChange={(e) => updatePairwiseMatrix(rowIndex, colIndex, parseFloat(e.target.value))}
                          className='!w-auto text-amber-600'
                        >
                          {Object.entries(AHP.scale).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {consistency && (
          <div className="consistency-check my-5">
            <h3 className='text-left my-5'>Consistency Check</h3>
            <p>Consistency Ratio: {consistency.consistencyRatio.toFixed(2)}</p>
            <p>Status: {consistency.isConsistent ? 'Consistent' : 'Inconsistent'}</p>
          </div>
        )}

        {weights.length > 0 && (
          <div className="criteria-weights my-5">
            <h3 className='text-left my-5'>Criteria Weights</h3>
            <ul>
              {criteria.map((criterion, index) => (
                <li key={criterion.name}>
                  {criterion.name}: {weights[index].toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="phone-list">
        <h2>Available Phones</h2>
        <ul>
          {phones.map(phone => (
            <li key={phone}>{phone}</li>
          ))}
        </ul>

        {showResults && (
          <div className="results my-5">
            <h2 className='text-left my-5'>Best Phone Selection</h2>
            <p className='text-amber-300'>The best phone based on AHP analysis is: {selectedPhone}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
