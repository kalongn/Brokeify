import PropTypes from 'prop-types';
import styles from "./ModalAddChart.module.css";
import { useEffect, useState } from 'react';
import ModalBase from './ModalBase';
import Select from 'react-select';

const shadedLineQuantities = [
  "Total Investments",
  "Total Income",
  "Total Expenses (including taxes)",
  "Early Withdrawal Tax",
  "Percentage of Discretionary Expenses"
];

const stackedBarQuantities = [
  "Investments Breakdown",
  "Incomes Breakdown",
  "Expenses Breakdown",
];

const numericQuantities = [
  "Total Investments",
  "Total Income",
  "Total Expenses (including taxes)",
  "Early Withdrawal Tax"
];

const AddChart = ({ isOpen, setIsOpen, setCharts, hasParameterValue, paramOneType, paramOneName, paramOneSteps, paramTwoType, paramTwoName, paramTwoSteps }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [selectedShadedQuantity, setSelectedShadedQuantity] = useState('');
  const [selectedBarQuantity, setSelectedBarQuantity] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const isShadedQuantityNumeric = numericQuantities.includes(selectedShadedQuantity);

  const [selectedParameterOneValue, setselectedParameterOneValue] = useState('');
  const [selectedParameterTwoValue, setselectedParameterTwoValue] = useState('');

  const [parameterOneArray, setparameterOneArray] = useState([]);
  const [parameterTwoArray, setparameterTwoArray] = useState([]);

  useEffect(() => {
    if (paramOneType && paramOneType !== "Disable Roth") {
      setparameterOneArray(paramOneSteps);
    } else {
      setparameterOneArray(["Enabled", "Disabled"]);
    }
    if (paramTwoType && paramTwoType !== "Disable Roth") {
      setparameterTwoArray(paramTwoSteps);
    } else {
      setparameterTwoArray(["Enabled", "Disabled"]);
    }
  }, [paramOneSteps, paramOneType, paramTwoSteps, paramTwoType]);

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
    if (hasParameterValue) {
      if (!selectedParameterOneValue) {
        if (paramOneType !== "Disable Roth") {
          errors.parameterValue = `Please enter a value for ${paramOneName}'s ${paramOneType}.`;
        } else {
          errors.parameterValue = `Please enter a value for Roth Optimizer.`;
        }
      } else if (paramTwoType && !selectedParameterTwoValue) {
        if (paramTwoType !== "Disable Roth") {
          errors.parameterValue = `Please enter a value for ${paramTwoName}'s ${paramTwoType}.`;
        } else {
          errors.parameterValue = `Please enter a value for Roth Optimizer.`;
        }
      }
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

      const dollarRadios = document.getElementsByName('stackedDollar');
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

    {/* Note: I used chatGPT to get the consts in this specific function. Used that output to create cContent for each chart.*/ }
    let cType = {};
    let cContent = {};
    if (selectedChart === 'line') {
      cType = 'Line Chart';
      cContent = { label: "Probability of Success over Time" };
    }
    if (selectedChart === 'shaded') {
      cType = 'Shaded Line Chart';
      const dollarRadios = document.getElementsByName('shadedDollar');
      const dollarValue = [...dollarRadios].find(r => r.checked)?.value;

      cContent = {
        quantity: selectedShadedQuantity,
        dollarValue: isShadedQuantityNumeric ? dollarValue : null,
        label: `Quantity: ${selectedShadedQuantity}` + (dollarValue ? `, Dollar Value: ${dollarValue}` : '')
      };
      console.log(cContent);
    }

    if (selectedChart === 'stacked') {
      cType = 'Stacked Bar Chart';
      const barRadios = document.getElementsByName('barValueType');
      const valueType = [...barRadios].find(r => r.checked)?.nextSibling?.nodeValue.trim();

      const thresholdInput = document.querySelector('input[type="number"]');
      const dollarRadios = document.getElementsByName('stackedDollar');
      const dollarValue = [...dollarRadios].find(r => r.checked)?.nextSibling?.nodeValue.trim();

      cContent = {
        quantity: selectedBarQuantity,
        valueType: valueType,
        threshold: parseFloat(thresholdInput.value),
        dollarValue: dollarValue,
        label: `Quantity: ${selectedBarQuantity}, Value Type: ${valueType}, Threshold: ${thresholdInput.value}`
          + (dollarValue ? `, Dollar Value: ${dollarValue}` : '')
      };
    }

    if (hasParameterValue) {
      if (paramOneType) {
        if (paramOneType !== "Disable Roth") {
          cContent.label += `, Parameter One: ${paramOneName}, ${selectedParameterOneValue}`;
        } else {
          cContent.label += `, Parameter One: Roth Optimizer, ${selectedParameterOneValue}`;
        }
        if (paramOneType !== "Disable Roth") {
          cContent.paramOne = selectedParameterOneValue;
        } else {
          cContent.paramOne = selectedParameterOneValue === "Enabled" ? -1 : -2;
        }
      }
      if (paramTwoType) {
        if (paramTwoType !== "Disable Roth") {
          cContent.label += `, Parameter Two: ${paramTwoName}, ${selectedParameterTwoValue}`;
        } else {
          cContent.label += `, Parameter Two: Roth Optimizer, ${selectedParameterTwoValue}`;
        }
        if (paramTwoType !== "Disable Roth") {
          cContent.paramTwo = selectedParameterTwoValue;
        } else {
          cContent.paramTwo = selectedParameterTwoValue === "Enabled" ? -1 : -2;
        }
      }
    }

    setCharts((prevCharts) => {
      const newChart = {
        id: prevCharts.length + 1,
        type: cType,
        content: cContent,
        label: cContent.label,
        data: {}
      };
      return [...prevCharts, newChart];
    });

    setIsOpen(false);
  }

  return (
    <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className={styles.header}>Select a Chart</h2>
      {hasParameterValue && (
        <div className={styles.parameterSection} >
          <>
            <label>Select a value for {paramOneType !== "Disable Roth" && <>{paramOneName}&apos;s</>} {paramOneType !== "Disable Roth" ? <>{paramOneType}</> : <>Roth Optimizer</>}:</label>
            <Select
              options={parameterOneArray.map(param => ({ value: param, label: param }))}
              value={
                parameterOneArray
                  .map(param => ({ value: param, label: param }))
                  .find(option => option.value === selectedParameterOneValue)
              }
              onChange={(selectedOption) => setselectedParameterOneValue(selectedOption.value)}
              placeholder={`Select ${paramOneType !== "Disable Roth" ? paramOneType : "Roth Optimizer Status"}`}
            />
          </>
          {paramTwoType && (
            <>
              <label>Select a value for {paramTwoName}&apos;s {paramTwoType}:</label>
              <Select
                options={parameterTwoArray.map(param => ({ value: param, label: param }))}
                value={
                  parameterTwoArray
                    .map(param => ({ value: param, label: param }))
                    .find(option => option.value === selectedParameterTwoValue)
                }
                onChange={(selectedOption) => setselectedParameterTwoValue(selectedOption.value)}
                placeholder={`Select ${paramTwoType}`}
              />
            </>
          )}
          {validationErrors.parameterValue && (
            <p className={styles.error}>{validationErrors.parameterValue}</p>
          )}
        </div>
      )}


      <div className={styles.chartOptions}>
        {/* Line Chart */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'line' ? styles.selected : ''}`}
          onClick={() => handleChartClick('line')}
        >
          <h3>Line Chart</h3>
          <p>Probability of Success over Time</p>
          <div className={styles.chartPreview}>
            <img src="/src/assets/lineChartEx.png" alt="Line Chart Preview" />
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
              {/*Note: Used AI here. Prompted to ChatGPT: please replace this section of code with React Select.
             Performance: Did well! */}
              <Select
                options={shadedLineQuantities.map(q => ({ value: q, label: q }))}
                value={shadedLineQuantities
                  .map(q => ({ value: q, label: q }))
                  .find(option => option.value === selectedShadedQuantity)}
                onChange={(selected) => setSelectedShadedQuantity(selected.value)}
                placeholder="Select Quantity"
              />

              {validationErrors.shadedQuantity && (
                <p className={styles.error}>{validationErrors.shadedQuantity}</p>
              )}
              {isShadedQuantityNumeric && (
                <div className={styles.numericSettings}>
                  <p>Dollar Value</p>
                  <div className={styles.radioGroup}>
                    <label><input type="radio" name="shadedDollar" value="Today" /> Today</label>
                    <label><input type="radio" name="shadedDollar" value="Future" /> Future</label>
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
            <img src="/src/assets/stackedBarChartEx.png" alt="Stacked Bar Chart Preview" />
          </div>
          {selectedChart === 'stacked' && (
            <div className={styles.chartSettings}>
              <div className={styles.radioGroup}>
                <p><input type="radio" name="barValueType" value="Median" /> Median</p>
                <p><input type="radio" name="barValueType" value="Average" /> Average</p>
              </div>
              {validationErrors.barType && (
                <p className={styles.error}>{validationErrors.barType}</p>
              )}
              <div className={styles.selectContainer}>
                {/*Note: Used AI here. Prompted to ChatGPT: please replace this section of code with React Select.
             Performance: Did well! */}
                <Select
                  options={stackedBarQuantities.map(q => ({ value: q, label: q }))}
                  value={stackedBarQuantities
                    .map(q => ({ value: q, label: q }))
                    .find(option => option.value === selectedBarQuantity)}
                  onChange={(selected) => setSelectedBarQuantity(selected.value)}
                  placeholder="Select Quantity"
                />

                {validationErrors.barQuantity && (
                  <p className={styles.error}>{validationErrors.barQuantity}</p>
                )}
              </div>

              <p className={styles.thresholdLabel}>
                <p>Aggregation Threshold </p>
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
                  <p><input type="radio" name="stackedDollar" value="Today" /> Today</p>
                  <p><input type="radio" name="stackedDollar" value="Future" /> Future</p>
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
  setCharts: PropTypes.func.isRequired,
  hasParameterValue: PropTypes.bool.isRequired,
  paramOneType: PropTypes.string,
  paramOneName: PropTypes.string,
  paramOneSteps: PropTypes.array,
  paramTwoType: PropTypes.string,
  paramTwoName: PropTypes.string,
  paramTwoSteps: PropTypes.array,
};

export default AddChart;
