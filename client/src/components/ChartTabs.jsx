import { useState } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import ChartParameters from './ChartParameters';

import { clearErrors } from "../utils/ScenarioHelper";
import sectionStyles from '../pages/SimulationPage.module.css';

const ChartTabs = ({ scenarios, simulationInput, setSimulationInput, setErrors }) => {
  const [activeTab, setActiveTab] = useState("Charts");
  // Keys used to force remount and clear inputs when the tab is changed
  // Need separate key management between parameters
  // [0] = parameters [1] = 1D fields [2] = 2D fields
  const [inputRemounts, setInputRemounts] = useState([0, 0, 0]);
  // Used to map ChartParameters
  const chartParametersCount = Number(activeTab[0]);

  // Prompt to AI: Plugged in Copilot's review about making remount keys flexible
  // Needed to adjust the indices
  const updateRemount = (remountKey) => {
    setInputRemounts(prev => {
      const newRemounts = [...prev];
      newRemounts[remountKey] = prev[remountKey] + 1;
      return newRemounts;
    });
  };

  // Only number of simulations and the selected scenario inputs are shared across all tabs
  const changeTab = (tab) => {
    setActiveTab(tab);
    setSimulationInput(() => ({
      numSimulations: simulationInput.numSimulations,
      selectedScenario: simulationInput.selectedScenario
    }));
    setInputRemounts(prev => prev.map(val => val + 1));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    // Match to names with numbers since ChartParameter inputs are named as such: lowerBound1
    if (name.match(/\d/) || name === "numSimulations") {
      processedValue = Number(value);
    }
    setSimulationInput((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    clearErrors(setErrors, name);
  };

  const handleSelectChange = (selectedOption, field) => {
    // Prompt to AI (Amazon Q): Make this highlighted code more concise
    // Works as intended
    setSimulationInput((prev) => {
      const newState = { ...prev, [field]: selectedOption.value };
      if (field.startsWith("parameter")) {
        const parameterCount = field.at(-1);
        const fieldsToRemove = [`lowerBound${parameterCount}`, `upperBound${parameterCount}`, `stepSize${parameterCount}`];
        if (fieldsToRemove.some(f => prev[f] !== undefined)) {
          fieldsToRemove.forEach(f => delete newState[f]);
          updateRemount(Number(parameterCount));
        }
      }
      return newState;
    });
    // Clear errors when user makes changes
    clearErrors(setErrors, field);
  };

  return (
    <div>
      <button onClick={() => changeTab("Charts")}>Charts</button>
      <button onClick={() => changeTab("1-D Exploration")}>1-D Exploration</button>
      <button onClick={() => changeTab("2-D Exploration")}>2-D Exploration</button>
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
              id="numSimulations"
              type="number"
              name="numSimulations"
              defaultValue={simulationInput.numSimulations !== undefined ? simulationInput.numSimulations : 10}
              onChange={handleChange}
            />
          </label>
        </div>
        {activeTab !== "Charts" && (
          [...Array(chartParametersCount)].map((_, index) => (
            <ChartParameters
              key={index}
              parameterIndex={index + 1}
              inputRemounts={inputRemounts}
              simulationInput={simulationInput}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              setSimulationInput={setSimulationInput}
              isTwoD={activeTab === "2-D Exploration"}
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