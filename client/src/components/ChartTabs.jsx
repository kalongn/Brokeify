import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import Select from 'react-select';
import Axios from 'axios';

import { clearErrors } from "../utils/ScenarioHelper";
import sectionStyles from '../pages/SimulationPage.module.css';
import styles from './ChartTabs.module.css';

const ChartTabs = ({ scenarios, simulationInput, setSimulationInput, setErrors }) => {
  const [activeTab, setActiveTab] = useState("Charts");
  // Keys used to force remount and clear inputs when the tab is changed
  // Need separate key management between parameters
  // [0] = parameter1 and parameter2 [1] = 1D associated fields [2] = 2D associated fields
  const [inputRemounts, setInputRemounts] = useState([0, 0, 0]);
  // Used to map ChartParameters
  const chartParametersCount = Number(activeTab[0]);
  const [parameterOptions, setparameterOptions] = useState([]);
  const [parameterIndex, setParameterIndex] = useState(0);

  const [events, setEvents] = useState([]);
  const [incomeExpenseEvents, setincomeExpenseEvents] = useState([]);
  const [investEvents, setInvestEvents] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState({
    1: [],
    2: []
  });  
  const isTwoD = activeTab === "2-D Exploration";

  const allParameterOptions = useMemo(() => [
    { value: "START_EVENT", label: "Start Year" },
    { value: "DURATION_EVENT", label: "Duration" },
    { value: "EVENT_AMOUNT", label: "Initial Amount" },
    { value: "INVEST_PERCENTAGE", label: "First of Two Investments" },
    { value: "ROTH_BOOLEAN", label: "Disable Roth Optimizer" }
  ], []);

  useEffect(() => {
    if (!simulationInput.selectedScenario) {
      return;
    }

    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get("/runSimulation/exploration", {
      params: {
        scenarioId: simulationInput.selectedScenario,
      }
    }).then((response) => {
      const data = response.data;
      const isRothEnabled = data.isRothEnabled;
      const allEvents = data.events.map((event) => {
        return {
          name: event.name,
          id: event.id,
        }
      });

      const allIncomeExpenseEvents = data.incomeExpenseEvents.map((event) => {
        return {
          name: event.name,
          id: event.id,
        }
      });

      const allInvestEvents = data.investEvents.map((event) => {
        return {
          name: event.name,
          id: event.id,
        }
      });

      setparameterOptions(() => {
        const options = []
        if (allEvents.length > 0) {
          options.push(allParameterOptions[0], allParameterOptions[1],)
        }
        if (allIncomeExpenseEvents.length > 0) {
          options.push(allParameterOptions[2])
        }
        if (allInvestEvents.length > 0) {
          options.push(allParameterOptions[3])
        }
        if (isRothEnabled && !isTwoD) {
          options.push(allParameterOptions[4]);
        }
        return options;
      })
      setEvents(allEvents);
      setincomeExpenseEvents(allIncomeExpenseEvents);
      setInvestEvents(allInvestEvents);
    }).catch((error) => {
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert("You do not have permission to view this scenario.");
      } else {
        alert("Error fetching scenario name. Please try again.");
      }
      console.error('Error fetching scenario name:', error);
    });
  }, [allParameterOptions, simulationInput.selectedScenario, simulationInput.numSimulations, setSimulationInput, isTwoD]);

  useEffect(() => {
    const parameterValue = simulationInput[`parameter${parameterIndex}`];
    let eventsToDisplay = [];
    if (parameterValue === "START_EVENT" || parameterValue === "DURATION_EVENT") {
      eventsToDisplay = events;
    } else if (parameterValue === "EVENT_AMOUNT") {
      eventsToDisplay = incomeExpenseEvents;
    } else if (parameterValue === "INVEST_PERCENTAGE") {
      eventsToDisplay = investEvents;
    }
    // set the displayedEvent by the parameter
    setDisplayedEvents(prev => ({
      ...prev,
      [parameterIndex]: eventsToDisplay
    }));
  }, [parameterIndex, simulationInput, events, incomeExpenseEvents, investEvents]);

  // Prompt to AI: Plugged in Copilot's review about making remount keys flexible
  // Needed to adjust the indices
  const updateRemount = (remountKeys) => {
    setInputRemounts(prev => {
      const newRemounts = [...prev];
      remountKeys.forEach(key => {
        newRemounts[key] = prev[key] + 1;
      });
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
    let prevSelection = simulationInput[field] !== undefined ? simulationInput[field] : null;
    // Clear parameter associated fields when the scenario is changed
    if (field === "selectedScenario" && prevSelection !== null && prevSelection !== selectedOption.value) {
      setSimulationInput(() => ({
        numSimulations: simulationInput.numSimulations,
        selectedScenario: selectedOption.value
      }));
      updateRemount([0, 1, 2]);
      // Clear errors when user makes changes
      clearErrors(setErrors, field);
      return;
    }
    setParameterIndex(Number(field.at(-1)));
    // Prompt to AI (Amazon Q): Make this highlighted code more concise
    // Needed to adjust for prevSelection
    setSimulationInput((prev) => {
      const newState = { ...prev, [field]: selectedOption.value };
      // If the parameter field is changed, clear the associated fields
      if (field.startsWith("parameter")) {
        const parameterCount = field.at(-1);
        const fieldsToRemove = [`lowerBound${parameterCount}`, `upperBound${parameterCount}`, `stepSize${parameterCount}`];
        if (fieldsToRemove.some(f => prev[f] !== undefined)) {
          fieldsToRemove.forEach(f => delete newState[f]);
          updateRemount([Number(parameterCount)]);
        }
      }
      return newState;
    });
    // Clear current selection and add back in previous selection
    setparameterOptions(prev => prev.filter(param => param.value !== selectedOption.value));
    if (prevSelection !== null) {
      prevSelection = allParameterOptions.find(option => option.value === prevSelection);
      setparameterOptions(prev => [...prev, prevSelection]);
    }
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
            <div key={index}>
              <label>
                Select Parameter {index + 1}
                <div className={`${styles.selectWrapper} ${simulationInput.selectedScenario === undefined ? styles.disabled : ''}`}>
                  <Select
                    key={inputRemounts[0]}
                    options={parameterOptions}
                    onChange={(option) => handleSelectChange(option, `parameter${index + 1}`)}
                    className="select"
                    isDisabled={simulationInput.selectedScenario === undefined}
                  />
                </div>
              </label>
              {simulationInput[`parameter${index + 1}`] !== undefined && simulationInput[`parameter${index + 1}`] !== "ROTH_BOOLEAN" && (
                <>
                  <label>
                    Select Event Series {index + 1}
                    <Select
                      key={inputRemounts[index + 1]}
                      options={displayedEvents[index + 1].map((event) => ({ value: event.id, label: event.name }))}
                      onChange={(option) => handleSelectChange(option, `displayedEvents${index + 1}`)}
                      className="select"
                    />
                  </label>

                  <div className={styles.parameterBounds}>
                    <label>
                      Lower Bound
                      <input
                        type="number"
                        key={inputRemounts[index + 1]}
                        name={`lowerBound${index + 1}`}
                        onChange={handleChange}
                      />
                    </label>
                    <label>
                      Upper Bound
                      <input
                        type="number"
                        key={inputRemounts[index + 1]}
                        name={`upperBound${index + 1}`}
                        onChange={handleChange}
                      />
                    </label>
                    <label>
                      Step Size
                      <input
                        type="number"
                        key={inputRemounts[index + 1]}
                        name={`stepSize${index + 1}`}
                        onChange={handleChange}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
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