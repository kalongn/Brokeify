import { useState } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';


const ChartParameters = ({ parameterIndex, chartData, handleChange, handleSelectChange }) => {
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
        Select Event Series
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
      <div>
        <label>
          Lower Bound
          <input
            type="number"
            value={chartData[`lowerBound${parameterIndex}`]}
            onChange={handleChange}
          />
        </label>
        <label>
          Upper Bound
          <input
            type="number"
            value={chartData[`upperBound${parameterIndex}`]}
            onChange={handleChange}
          />
        </label>
        <label>
          Step Size
          <input
            type="number"
            value={chartData[`stepSize${parameterIndex}`]}
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  );
}

ChartParameters.propTypes = {
  parameterIndex: PropTypes.number.isRequired,
  chartData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSelectChange: PropTypes.func.isRequired
};

export default ChartParameters;