import { useState } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import ChartParameters from './ChartParameters';

import { clearErrors } from "../utils/ScenarioHelper";
import sectionStyles from '../pages/SimulationPage.module.css';

const ChartTabs = ({ scenarios, simulationInput, setSimulationInput, setErrors }) => {
  const [activeTab, setActiveTab] = useState("Charts");
  // Key used to force remount and clear Select component inputs when the tab is changed
  const [selectRemount, setSelectRemount] = useState(0);
  // Used to map ChartParameters
  const chartParametersCount = Number(activeTab[0]);

  // Only number of simulations and the selected scenario inputs are shared across all tabs
  const changeTab = (tab) => {
    setActiveTab(tab);
    setSimulationInput(() => ({
      numSimulations: simulationInput.numSimulations,
      selectedScenario: simulationInput.selectedScenario
    }));
    setSelectRemount((prevKey) => prevKey + 1);
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
    setSimulationInput((prev) => ({ ...prev, [field]: selectedOption.value }));
    // Clear errors when user makes changes
    clearErrors(setErrors, field);
  };
  console.log(simulationInput);
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
              min="10"
              max="1000"
              step="10"
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
              selectRemount={selectRemount}
              simulationInput={simulationInput}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              setSelectRemount={setSelectRemount}
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