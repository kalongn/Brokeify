import PropTypes from 'prop-types';
import styles from "./ModalAddChart.module.css";
import { useState } from 'react';
import ModalBase from './ModalBase';

const surfacePlotQuantities = [
  "Final Value: Probability of Success",
  "Final Value: Median Total Investments"
];

const contourPlotQuantities = [
  "Final Value: Probability of Success",
  "Final Value: Median Total Investments"
];

const ModalTwoD = ({ isOpen, setIsOpen, setCharts }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [selectedSurfaceQuantity, setSelectedSurfaceQuantity] = useState('');
  const [selectedContourQuantity, setSelectedContourQuantity] = useState('');
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

    if (selectedChart === 'surface' && !selectedSurfaceQuantity) {
      errors.surfaceQuantity = 'Please select a quantity.';
    }

    if (selectedChart === 'contour' && !selectedContourQuantity) {
      errors.contourQuantity = 'Please select a quantity.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChart = (e) => {
    if (!validateForm()) {
      e.preventDefault();
      return;
    }

    let chartTypeLabel = '';
    let selectedQuantity = '';

    if (selectedChart === 'surface') {
      chartTypeLabel = 'Surface Plot';
      selectedQuantity = selectedSurfaceQuantity;
    }

    if (selectedChart === 'contour') {
      chartTypeLabel = 'Contour Plot';
      selectedQuantity = selectedContourQuantity;
    }

    setCharts((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: chartTypeLabel,
        content: {
          quantity: selectedQuantity,
          label: `Selected Quantity: ${selectedQuantity}`
        },
        label: `Selected Quantity: ${selectedQuantity}`,
        data: {}
      }
    ]);

    setIsOpen(false);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className={styles.header}>Select a 2D Chart</h2>

      <div className={styles.chartOptions}>
        {/* Surface Plot */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'surface' ? styles.selected : ''}`}
          onClick={() => handleChartClick('surface')}
        >
          <h3>Surface Plot</h3>
          <div className={styles.chartPreview}>
            <img src="/src/assets/surfacePlotEx.png" alt="Surface Plot Preview" />
          </div>
          {selectedChart === 'surface' && (
            <div className={styles.chartSettings}>
              <select
                value={selectedSurfaceQuantity}
                onChange={(e) => setSelectedSurfaceQuantity(e.target.value)}
              >
                <option value="" disabled hidden>Select Quantity</option>
                {surfacePlotQuantities.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {validationErrors.surfaceQuantity && (
                <p className={styles.error}>{validationErrors.surfaceQuantity}</p>
              )}
            </div>
          )}
        </div>

        {/* Contour Plot */}
        <div
          className={`${styles.chartCard} ${selectedChart === 'contour' ? styles.selected : ''}`}
          onClick={() => handleChartClick('contour')}
        >
          <h3>Contour Plot</h3>
          <div className={styles.chartPreview}>
            <img src="/src/assets/contourPlotEx.png" alt="Contour Plot Preview" />
          </div>
          {selectedChart === 'contour' && (
            <div className={styles.chartSettings}>
              <select
                value={selectedContourQuantity}
                onChange={(e) => setSelectedContourQuantity(e.target.value)}
              >
                <option value="" disabled hidden>Select Quantity</option>
                {contourPlotQuantities.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {validationErrors.contourQuantity && (
                <p className={styles.error}>{validationErrors.contourQuantity}</p>
              )}
            </div>
          )}
        </div>
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

ModalTwoD.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  setCharts: PropTypes.func.isRequired
};

export default ModalTwoD;
