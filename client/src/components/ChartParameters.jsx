import { useState } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import styles from './ChartTabs.module.css';

const ChartParameters = ({ parameterIndex, simulationInput, handleChange, handleSelectChange }) => {
  const parameterOptions = [
      { value: "Roth Optimizer", label: "Toggle Roth Optimizer" },
      { value: "Start Year", label: "Start Year" },
      { value: "Duration", label: "Duration" },
      { value: "Initial Amount", label: "Initial Amount" },
      { value: "Investment Percentage", label: "First of Two Investments" },
    ];
    const [eventSeries, setEventSeries] = useState([{ name: "Event 1" }, { name: "Event 2"}, { name: "Event 3"}]);

  return (
    <div>
      <label>
        Select Event Series {parameterIndex}
        <Select
          options={eventSeries.map((event) => ({ value: event.name, label: event.name }))}
          onChange={(option) => handleSelectChange(option, `eventSeries${parameterIndex}`)}
          className="select"
        />
      </label>
      <label>
        Select Parameter
        <Select
          options={parameterOptions}
          onChange={(option) => handleSelectChange(option, `parameter${parameterIndex}`)}
          className="select"
        />
      </label>
      <div className={styles.parameterBounds}>
        <label>
          Lower Bound
          <input
            type="number"
            value={simulationInput[`lowerBound${parameterIndex}`]}
            onChange={handleChange}
          />
        </label>
        <label>
          Upper Bound
          <input
            type="number"
            value={simulationInput[`upperBound${parameterIndex}`]}
            onChange={handleChange}
          />
        </label>
        <label>
          Step Size
          <input
            type="number"
            value={simulationInput[`stepSize${parameterIndex}`]}
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  );
}

ChartParameters.propTypes = {
  parameterIndex: PropTypes.number.isRequired,
  simulationInput: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSelectChange: PropTypes.func.isRequired
};

export default ChartParameters;