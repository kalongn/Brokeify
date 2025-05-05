import PropTypes from 'prop-types';
import styles from "./ModalAddChart.module.css";
import { useState } from 'react';
import Select from 'react-select';
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
      cType = 'Multi-Line Over Time';
      cContent = {
        quantity: selectedMultiLineQuantities,
        label: `Selected Quantity: ${selectedMultiLineQuantities}`
      };
    }

    if (selectedChart === 'finalValue') {
      cType = 'Final Value vs Parameter';
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


  {/*Note: I used ChatGPT on this page to convert my original selects to React-Select*/ }
  // Utility function for mapping options
  const toOptions = (arr) => arr.map(item => ({ value: item, label: item }));

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
          <p>Multiple Values of a Selected Quantity Over Time</p>
          <div className={styles.chartPreview}>
            {/*TODO: Update this image*/}
            <img src="/src/assets/multilineChartEx.png" alt="Final Value Line Chart Preview" />
          </div>
          {selectedChart === 'multiLine' && (
            <div className={styles.chartSettings}>
              <Select
                options={toOptions(multiLineQuantities)}
                value={
                  selectedMultiLineQuantities
                    ? { value: selectedMultiLineQuantities, label: selectedMultiLineQuantities }
                    : null
                }
                onChange={(selected) => setSelectedMultiLineQuantities(selected.value)}
                placeholder="Select Quantity"
              />
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
            <h3>Line Chart</h3>
            <p>Selected Quantity as a Function of Parameter Value</p>
            <div className={styles.chartPreview}>
              <img src="/src/assets/finalValueChart.png" alt="Final Value Line Chart Preview" />
            </div>
            {selectedChart === 'finalValue' && (
              <div className={styles.chartSettings}>
                <Select
                  options={toOptions(lineChartParameterQuantities)}
                  value={
                    selectedLineChartParameterQuantities
                      ? { value: selectedLineChartParameterQuantities, label: selectedLineChartParameterQuantities }
                      : null
                  }
                  onChange={(selected) => setSelectedLineChartParameterQuantities(selected.value)}
                  placeholder="Select Quantity"
                />
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
