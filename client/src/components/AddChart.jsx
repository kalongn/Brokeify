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
    "Income By Event Series",
    "Expenses By Event Series (plus taxes)",
];

const numericQuantities = [
    "Total Investments",
    "Total Income",
    "Total Expenses (including taxes)",
    "Early Withdrawal Tax"
];
{/*TODO: Check error validation*/ }
const AddChart = ({ onClose }) => {
    const [selectedChart, setSelectedChart] = useState(null);
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

    
    const handleSaveChart = () => {
        if (selectedChart && validateForm()) {
            let label = '';
    
            // For Line Chart
            if (selectedChart === 'line') {
                label = `Line Chart Example`;
            }
    
            // For Shaded Line Chart
            else if (selectedChart === 'shaded') {
                label = `Shaded Line Chart: ${selectedShadedQuantity} with ${document.querySelector('input[name="shadedDollar"]:checked')?.value || 'None'} Dollar Value`;
            }
    
            // For Stacked Bar Chart
            else if (selectedChart === 'stacked') {
                const barType = document.querySelector('input[name="barValueType"]:checked')?.value || 'None';
                const threshold = document.querySelector('input[type="number"]').value || 'No Threshold';
                label = `Stacked Bar Chart: ${selectedBarQuantity} (${barType}) with ${threshold} Aggregation Threshold and ${document.querySelector('input[name="shadedDollar"]:checked')?.value || 'None'} Dollar Value`;
            }
    
            const newChart = {
                type: selectedChart,
                label: label,  // Store all information in the label
                data: {}, // You can leave data as an empty object for now
            };
    
            console.log(newChart);  // Log the new chart object, which includes the label with user-selected information
            addChart(newChart);  // Assuming `addChart` is passed as a prop
            onClose();  // Close the modal after saving
        }
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



    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Select a Chart</h2>
                    <Link className={styles.exitButton} to={"/Visualizations/Charts"}> X</Link>
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
                                {validationErrors.shadedQuantity && (
                                    <p className={styles.error}>{validationErrors.shadedQuantity}</p>
                                )}
                                {isShadedQuantityNumeric && (
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
                                {validationErrors.barType && (
                                        <p className={styles.error}>{validationErrors.barType}</p>
                                )}
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
                    <Link className={styles.saveButton}
                        onClick={(e) => {
                            if (!validateForm()) e.preventDefault();
                            handleSaveChart();
                            
                        }}

                        to="/Visualizations/Charts" >
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
