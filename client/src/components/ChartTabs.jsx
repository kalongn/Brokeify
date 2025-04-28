import { useState } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import ChartParameters from './ChartParameters';

import { clearErrors } from "../utils/ScenarioHelper";
import styles from '../pages/SimulationPage.module.css';

const ChartTabs = ({ scenarios, chartData, setChartData, setErrors }) => {
  const [activeTab, setActiveTab] = useState("Charts");
  const chartParametersCount = Number(activeTab[0]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setChartData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user makes changes
    clearErrors(setErrors, name);
  };

  const handleSelectChange = (selectedOption, field) => {
    setChartData((prev) => ({ ...prev, [field]: selectedOption.value }));
    // Clear errors when user makes changes
    clearErrors(setErrors, "selectInput");
  };
  return (
    <>
      <button onClick={() => setActiveTab("Charts")}>Charts</button>
      <button onClick={() => setActiveTab("1-D Exploration")}>1-D Exploration</button>
      <button onClick={() => setActiveTab("2-D Exploration")}>2-D Exploration</button>
      <div className={styles.section}>
        <div>
          <label>
            Select Scenario
            <Select
              options={scenarios.map((scenario) => ({ value: scenario.id, label: scenario.name }))}
              onChange={(option) => handleSelectChange(option, "selectedScenario")}
              className="select"
            />
          </label>
        </div>

        <div>
          <label>
            Number of Simulation Runs
            <br />
            <input
              id="simulation"
              type="number"
              min="10"
              max="50"
              step="1"
              value={chartData.numSimulations !== undefined ? chartData.numSimulations : 10}
              onChange={handleChange}
            />
          </label>
        </div>
        {activeTab !== "Charts" && (
          [...Array(chartParametersCount)].map((_, index) => (
            <ChartParameters
              key={index}
              parameterIndex={index+1}
              chartData={chartData}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
            />
          ))
        )}
      </div>
    </>
  )
}

ChartTabs.propTypes = {
  scenarios: PropTypes.object.isRequired,
  chartData: PropTypes.object.isRequired,
  setChartData: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired
};

export default ChartTabs;