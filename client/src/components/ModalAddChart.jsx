import PropTypes from 'prop-types';
import styles from "./ModalAddChart.module.css";
import { useState } from 'react';
import ModalBase from './ModalBase';

const shadedLineQuantities = [
  "Total Investments",
  "Total Income",
  "Total Expenses (including taxes)",
  "Early Withdrawal Tax",
  "Percentage of Discretionary Expenses"
];

const stackedBarQuantities = [
  "Total Investments by Investments",
  "Income",
  "Expenses"
];

const numericQuantities = [
  "Total Investments",
  "Total Income",
  "Total Expenses (including taxes)",
  "Early Withdrawal Tax"
];
{/*TODO: Add error validation*/ }
const AddChart = ({ isOpen, setIsOpen, setCharts }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  // const [formData, setFormData] = useState({});
  const [selectedShadedQuantity, setSelectedShadedQuantity] = useState('');
  const [selectedBarQuantity, setSelectedBarQuantity] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const isShadedQuantityNumeric = numericQuantities.includes(selectedShadedQuantity);

  const handleChartClick = (chartType) => {
    setSelectedChart(chartType);
    setValidationErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors.chartSelection;
      return newErrors;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedChart) {
      errors.chartSelection = 'Please select a chart type.';
    }
    if (selectedChart === 'shaded') {
      if (!selectedShadedQuantity) errors.shadedQuantity = 'Please select a quantity.';
      if (isShadedQuantityNumeric) {
        const radios = document.getElementsByName('shadedDollar');
        if (![...radios].some(r => r.checked)) {
          errors.dollarValue = 'Please choose a dollar value (Today or Future).';
        }
      }
    }

    if (selectedChart === 'stacked') {
      if (!selectedBarQuantity) errors.barQuantity = 'Please select a quantity.';
      const barRadios = document.getElementsByName('barValueType');
      if (![...barRadios].some(r => r.checked)) {
        errors.barType = 'Please select Median or Average.';
      }

      const thresholdInput = document.querySelector('input[type="number"]');
      if (!thresholdInput || thresholdInput.value === '') {
        errors.threshold = 'Please enter an aggregation threshold.';
      } else if (parseFloat(thresholdInput.value) < 0) {
        errors.threshold = 'Threshold cannot be a negative number.';
      }

      const dollarRadios = document.getElementsByName('shadedDollar');
      if (![...dollarRadios].some(r => r.checked)) {
        errors.dollarValue = 'Please choose a dollar value (Today or Future).';
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

    let content = {};
    if (selectedChart === 'line') {
      content = { content: "Probability of Success over Time"};
    }
    if (selectedChart === 'shaded') {
      const dollarRadios = document.getElementsByName('shadedDollar');
      const dollarValue = [...dollarRadios].find(r => r.checked)?.nextSibling?.nodeValue.trim();
  
      content = {
        quantity: selectedShadedQuantity,
        dollarValue: isShadedQuantityNumeric ? dollarValue : null
      };
    }
  
    if (selectedChart === 'stacked') {
      const barRadios = document.getElementsByName('barValueType');
      const valueType = [...barRadios].find(r => r.checked)?.nextSibling?.nodeValue.trim();
  
      const thresholdInput = document.querySelector('input[type="number"]');
      const dollarRadios = document.getElementsByName('shadedDollar');
      const dollarValue = [...dollarRadios].find(r => r.checked)?.nextSibling?.nodeValue.trim();
  
      content = {
        quantity: selectedBarQuantity,
        valueType,
        threshold: parseFloat(thresholdInput.value),
        dollarValue
      };
    }




    setCharts((prevCharts) => [...prevCharts, { type: selectedChart }]);
    setIsOpen(false);
  }

  return (
    <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className={styles.header}>Select a Chart</h2>

      <div className={styles.chartOptions}>
        {/* Line Chart */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'line' ? styles.selected : ''}`}
          onClick={() => handleChartClick('line')}
        >
          <h3>Line Chart</h3>
          <p>Probability of Success over Time</p>
          <div className={styles.chartPreview}>
            <img src="/src/assets/lineChartEx.svg" alt="Line Chart Preview" />
          </div>
          {selectedChart === 'line' && (
            <div className={styles.chartSettings}>
              {/* Line Chart has no additional settings */}
            </div>
          )}
        </div>

        {/* Shaded Line Chart */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'shaded' ? styles.selected : ''}`}
          onClick={() => handleChartClick('shaded')}
        >
          <h3>Shaded Line Chart</h3>
          <p>Probability Ranges for a Selected Quantity over Time</p>
          <div className={styles.chartPreview}>
            <img src="/src/assets/shadedChartEx.png" alt="Shaded Line Chart Preview" />

          </div>
          {selectedChart === 'shaded' && (
            <div className={styles.chartSettings}>
              <select
                value={selectedShadedQuantity}
                onChange={(e) => setSelectedShadedQuantity(e.target.value)}
              >
                <option value="" disabled hidden>Select Quantity</option>
                {shadedLineQuantities.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {validationErrors.shadedQuantity && (
                <p className={styles.error}>{validationErrors.shadedQuantity}</p>
              )}
              {isShadedQuantityNumeric && (
                <div className={styles.numericSettings}>
                  <p>Dollar Value</p>
                  <div className={styles.radioGroup}>
                    <label><input type="radio" name="shadedDollar" /> Today</label>
                    <label><input type="radio" name="shadedDollar" /> Future</label>
                  </div>
                  {validationErrors.dollarValue && (
                    <p className={styles.error}>{validationErrors.dollarValue}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stacked Bar Chart */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'stacked' ? styles.selected : ''}`}
          onClick={() => handleChartClick('stacked')}
        >
          <h3>Stacked Bar Chart</h3>
          <p>Median or Average Values of a Selected Quantity over Time</p>
          <div className={styles.chartPreview}>
            <img src="/src/assets/stackedBarChartEx.svg" alt="Stacked Bar Chart Preview" />
          </div>
          {selectedChart === 'stacked' && (
            <div className={styles.chartSettings}>
              <div className={styles.radioGroup}>
                <label><input type="radio" name="barValueType" /> Median</label>
                <label><input type="radio" name="barValueType" /> Average</label>
              </div>
              {validationErrors.barType && (
                <p className={styles.error}>{validationErrors.barType}</p>
              )}
              <div className={styles.selectContainer}>
                <select
                  value={selectedBarQuantity}
                  onChange={(e) => setSelectedBarQuantity(e.target.value)}
                >
                  <option value="" disabled hidden>Select Quantity</option>
                  {stackedBarQuantities.map((quantity) => (
                    <option key={quantity} value={quantity}>{quantity}</option>
                  ))}
                </select>
                {validationErrors.barQuantity && (
                  <p className={styles.error}>{validationErrors.barQuantity}</p>
                )}
              </div>

              <p className={styles.thresholdLabel}>
                Aggregation Threshold
                <input type="number" />
                {/*TOD0: Get and add the questionmark icon to reflect like below*/}
                {/* <span className={styles.tooltip} title="Categories with values less than this threshold will be combined into an 'Other' category.">?</span>*/}
              </p>
              {validationErrors.threshold && (
                <p className={styles.error}>{validationErrors.threshold}</p>
              )}

              <div className={styles.numericSettings}>
                <p>Dollar Value</p>
                <div className={styles.radioGroup}>
                  <p><input type="radio" name="shadedDollar" /> Today</p>
                  <p><input type="radio" name="shadedDollar" /> Future</p>
                </div>
                {validationErrors.dollarValue && (
                  <p className={styles.error}>{validationErrors.dollarValue}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        {validationErrors.chartSelection && (
          <p className={styles.error}>{validationErrors.chartSelection}</p>
        )}
        <button
          className={styles.saveButton}
          onClick={(e) => handleSaveChart(e)}
        >
          Save & Add Chart
        </button>
      </div>
    </ModalBase>
  );
};

AddChart.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  setCharts: PropTypes.func.isRequired
};

export default AddChart;
