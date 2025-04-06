import PropTypes from 'prop-types';
import styles from "./AddChart.module.css";
import { useState } from 'react';
import { Link } from 'react-router-dom';

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

const AddChart = ({ onClose }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [selectedShadedQuantity, setSelectedShadedQuantity] = useState('');
  const [selectedBarQuantity, setSelectedBarQuantity] = useState('');

  const isShadedQuantityNumeric = numericQuantities.includes(selectedShadedQuantity);

  const handleChartClick = (chartType) => {
    setSelectedChart(chartType);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Select a Chart</h2>
          <Link className={styles.exitButton}  disabled={!selectedChart} to="/Visualizations/Charts" > 
          X</Link>
          
        </div>

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
                {isShadedQuantityNumeric && (
                 <div className={styles.numericSettings}>
                 <p>Dollar Value</p>
                  <div className={styles.radioGroup}>
                    <p><input type="radio" name="shadedDollar" /> Today</p>
                    <p><input type="radio" name="shadedDollar" /> Future</p>
                  </div>
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
                  <p><input type="radio" name="barValueType" /> Median</p>
                  <p><input type="radio" name="barValueType" /> Average</p>
                </div>
                <div className={styles.selectContainer}>
                <select
                  value={selectedBarQuantity}
                  onChange={(e) => setSelectedBarQuantity(e.target.value)}
                >
                  <option value="" disabled hidden>Select Quantity</option>
                  {stackedBarQuantities.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                </div>

                <p className={styles.thresholdLabel}>
                  Aggregation Threshold
                  <input type="number" />
                  <span className={styles.tooltip} title="Categories with values less than this threshold will be combined into an 'Other' category.">?</span>
                </p>

                <div className={styles.numericSettings}>
                 <p>Dollar Value</p>
                  <div className={styles.radioGroup}>
                    <p><input type="radio" name="shadedDollar" /> Today</p>
                    <p><input type="radio" name="shadedDollar" /> Future</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
            <Link className={styles.saveButton}  disabled={!selectedChart} to="/Visualizations/Charts" > 
            Save & Add Chart</Link>
        </div>
      </div>
    </div>
  );
};

AddChart.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default AddChart;
