import { useState } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import ChartParameters from './ChartParameters';

import { clearErrors } from "../utils/ScenarioHelper";
import sectionStyles from '../pages/SimulationPage.module.css';

const ChartTabs = ({ scenarios, simulationInput, setSimulationInput, setErrors }) => {
  const [activeTab, setActiveTab] = useState("Charts");
  const chartParametersCount = Number(activeTab[0]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSimulationInput((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user makes changes
    clearErrors(setErrors, name);
  };

  const handleSelectChange = (selectedOption, field) => {
    setSimulationInput((prev) => ({ ...prev, [field]: selectedOption.value }));
    // Clear errors when user makes changes
    clearErrors(setErrors, "selectInput");
  };
  return (
    <div>
      <button onClick={() => setActiveTab("Charts")}>Charts</button>
      <button onClick={() => setActiveTab("1-D Exploration")}>1-D Exploration</button>
      <button onClick={() => setActiveTab("2-D Exploration")}>2-D Exploration</button>
      <div className={sectionStyles.section}>
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
              defaultValue={simulationInput.numSimulations !== undefined ? simulationInput.numSimulations : 10}
              onChange={handleChange}
            />
          </label>
        </div>
        {activeTab !== "Charts" && (
          [...Array(chartParametersCount)].map((_, index) => (
            <ChartParameters
              key={index}
              parameterIndex={index+1}
              simulationInput={simulationInput}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
            />
          ))
        )}
      </div>
    </div>
  )
}

ChartTabs.propTypes = {
  scenarios: PropTypes.object.isRequired,
  simulationInput: PropTypes.object.isRequired,
  setSimulationInput: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired
};

export default ChartTabs;