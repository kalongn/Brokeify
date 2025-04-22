import PropTypes from 'prop-types';
import styles from "./ModalAddChart.module.css";
import { useState } from 'react';
import ModalBase from './ModalBase';

const multiLineQuantities = [
  "Probability of Success",
  "Median Total Investments"
];

const lineChartParameterQuantities = [
  "Final Value: Probability of Success",
  "Final Value: Median Total Investments"
];

const ModalOneD = ({ isOpen, setIsOpen, setCharts, isScenarioParameterNumeric }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [selectedMultiLineQuantities, setSelectedMultiLineQuantities] = useState('');
  const [selectedLineChartParameterQuantities, setSelectedLineChartParameterQuantities] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const handleChartClick = (chartType) => {
    setSelectedChart(chartType);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedChart) {
      errors.chartSelection = 'Please select a chart type.';
    }

    if (selectedChart === 'multiLine') {
      if (!selectedMultiLineQuantities) {
        errors.multiLineQuantities = 'Please select a quantity.';
      }
    }

    if (selectedChart === 'finalValue') {
      if (!selectedLineChartParameterQuantities) {
        errors.lineChartParameterQuantities = 'Please select a quantity.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChart = (e) => {
    if (!validateForm()) {
      e.preventDefault();
      return;
    }

    let cType = '';
    let cContent = {};

    if (selectedChart === 'multiLine') {
      cType = 'Multi-Line Chart';
      cContent = {
        quantity: selectedMultiLineQuantities,
        label: `Selected Quantity: ${selectedMultiLineQuantities}`
      };
    }

    if (selectedChart === 'finalValue') {
      cType = 'Final Value Line Chart';
      cContent = {
        quantity: selectedLineChartParameterQuantities,
        label: `Selected Quantity: ${selectedLineChartParameterQuantities}`
      };
    }

    setCharts((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: cType,
        content: cContent,
        label: cContent.label,
        data: {}
      }
    ]);

    setIsOpen(false);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className={styles.header}>Select a Chart</h2>

      <div className={styles.chartOptions}>
        {/* Multi-Line Chart */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'multiLine' ? styles.selected : ''}`}
          onClick={() => handleChartClick('multiLine')}
        >
          <h3>Multi-Line Chart</h3>
          <p>Multiple Values of a Quantity Over Time</p>
          <div className={styles.chartPreview}>
            {/*TODO: Update this image*/}
            <img src="/src/assets/lineChartEx.png" alt="Final Value Line Chart Preview" />
          </div>
          {selectedChart === 'multiLine' && (
            <div className={styles.chartSettings}>
              <select
                value={selectedMultiLineQuantities}
                onChange={(e) => setSelectedMultiLineQuantities(e.target.value)}
              >
                <option value="" disabled hidden>Select Quantity</option>
                {multiLineQuantities.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {validationErrors.multiLineQuantities && (
                <p className={styles.error}>{validationErrors.multiLineQuantities}</p>
              )}
            </div>
          )}
        </div>
        {/* Final Value Line Chart */}
        {isScenarioParameterNumeric && (
          <div
            className={`${styles.chartCard} ${selectedChart === 'finalValue' ? styles.selected : ''}`}
            onClick={() => handleChartClick('finalValue')}
          >
            <h3>Final Value vs Parameter</h3>
            <p>Shows the final result of a quantity as the parameter changes</p>
            <div className={styles.chartPreview}>
              <img src="/src/assets/lineChartEx.png" alt="Final Value Line Chart Preview" />
            </div>
            {selectedChart === 'finalValue' && (
              <div className={styles.chartSettings}>
                <select
                  value={selectedLineChartParameterQuantities}
                  onChange={(e) => setSelectedLineChartParameterQuantities(e.target.value)}
                >
                  <option value="" disabled hidden>Select Quantity</option>
                  {lineChartParameterQuantities.map(quantity => (
                    <option key={quantity} value={quantity}>{quantity}</option>
                  ))}
                </select>
                {validationErrors.lineChartParameterQuantities && (
                  <p className={styles.error}>{validationErrors.lineChartParameterQuantities}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

        <div className={styles.footer}>
          {validationErrors.chartSelection && (
            <p className={styles.error}>{validationErrors.chartSelection}</p>
          )}
          <button className={styles.saveButton} onClick={(e) => handleSaveChart(e)}>
            Save & Add Chart
          </button>
        </div>
    </ModalBase>
  );
};

ModalOneD.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  setCharts: PropTypes.func.isRequired,
  isScenarioParameterNumeric: PropTypes.bool.isRequired
};

export default ModalOneD;
