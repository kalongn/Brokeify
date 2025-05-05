import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Axios from 'axios';

import styles from './ChartTabs.module.css';

const ChartParameters = ({ parameterIndex, inputRemount1, inputRemount2, parameterRemount, simulationInput, handleChange, handleSelectChange, setSimulationInput, isTwoD }) => {
  const [parameterOptions, setparameterOptions] = useState([]);

  const [events, setEvents] = useState([]);
  const [incomeExpenseEvents, setincomeExpenseEvents] = useState([]);
  const [investEvents, setInvestEvents] = useState([]);
  const [displayedEvents, setdisplayedEvents] = useState([]);

  const inputRemount = parameterIndex === 1 ? inputRemount1 : inputRemount2;

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
          options.push({ value: "START_EVENT", label: "Start Year" }, { value: "DURATION_EVENT", label: "Duration" },)
        }
        if (allIncomeExpenseEvents.length > 0) {
          options.push({ value: "EVENT_AMOUNT", label: "Initial Amount" })
        }
        if (allInvestEvents.length > 0) {
          options.push({ value: "INVEST_PERCENTAGE", label: "First of Two Investments" })
        }
        if (isRothEnabled && !isTwoD) {
          options.push({ value: "ROTH_BOOLEAN", label: "Disable Roth Optimizer" });
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
  }, [simulationInput.selectedScenario, simulationInput.numSimulations, setSimulationInput, isTwoD]);

  useEffect(() => {
    const parameterValue = simulationInput[`parameter${parameterIndex}`];
    if (parameterValue === "START_EVENT" || parameterValue === "DURATION_EVENT") {
      setdisplayedEvents(events);
    } else if (parameterValue === "EVENT_AMOUNT") {
      setdisplayedEvents(incomeExpenseEvents);
    } else if (parameterValue === "INVEST_PERCENTAGE") {
      setdisplayedEvents(investEvents);
    } else {
      setdisplayedEvents([]);
    }
  }, [parameterIndex, simulationInput, events, incomeExpenseEvents, investEvents]);

  return (
    <div>
      <label>
        Select Parameter {parameterIndex}
        <div className={`${styles.selectWrapper} ${simulationInput.selectedScenario === undefined ? styles.disabled : ''}`}>
          <Select
            key={parameterRemount}
            options={parameterOptions}
            onChange={(option) => handleSelectChange(option, `parameter${parameterIndex}`)}
            className="select"
            isDisabled={simulationInput.selectedScenario === undefined}
          />
        </div>
      </label>
      {simulationInput[`parameter${parameterIndex}`] !== undefined && simulationInput[`parameter${parameterIndex}`] !== "ROTH_BOOLEAN" && (
        <>
          <label>
            Select Event Series {parameterIndex}
            <Select
              key={inputRemount}
              options={displayedEvents.map((event) => ({ value: event.id, label: event.name }))}
              onChange={(option) => handleSelectChange(option, `displayedEvents${parameterIndex}`)}
              className="select"
            />
          </label>

          <div className={styles.parameterBounds}>
            <label>
              Lower Bound
              <input
                type="number"
                key={inputRemount}
                name={`lowerBound${parameterIndex}`}
                onChange={handleChange}
              />
            </label>
            <label>
              Upper Bound
              <input
                type="number"
                key={inputRemount}
                name={`upperBound${parameterIndex}`}
                onChange={handleChange}
              />
            </label>
            <label>
              Step Size
              <input
                type="number"
                key={inputRemount}
                name={`stepSize${parameterIndex}`}
                onChange={handleChange}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}

ChartParameters.propTypes = {
  parameterIndex: PropTypes.number.isRequired,
  inputRemount1: PropTypes.number.isRequired,
  inputRemount2: PropTypes.number.isRequired,
  parameterRemount: PropTypes.number.isRequired,
  simulationInput: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSelectChange: PropTypes.func.isRequired,
  setSimulationInput: PropTypes.func.isRequired,
  isTwoD: PropTypes.bool,
};

export default ChartParameters;