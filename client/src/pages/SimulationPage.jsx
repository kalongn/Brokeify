import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clearErrors } from "../utils/ScenarioHelper";
import Layout from '../components/Layout';
import ErrorMessage from '../components/ErrorMessage';
import Axios from 'axios';

import 'ladda/dist/ladda.min.css';
import * as Ladda from 'ladda/js/ladda'; // or import from submodule path

import styles from './SimulationPage.module.css';

const ScenarioSimulation = () => {

  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [numSimulations, setNumSimulations] = useState(10);
  const [errors, setErrors] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [previousRun, setPreviousRun] = useState(null);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;
    Axios.get('/runSimulation').then((response) => {
      const data = response.data;
      const scenarios = data.scenarios;
      const previousRun = data.previousRun;
      console.log('Scenarios data:', data);
      setPreviousRun(previousRun);
      setScenarios(scenarios);
    }).catch((error) => {
      console.error('Error fetching scenarios:', error);
    });
  }, []);


  const handleRunSimulation = async (e) => {
    const num = numSimulations;
    if (!selectedScenario) {
      setErrors({ scenario: 'Scenario selection is required' });
      return;
    }
    if (isNaN(num) || num < 10 || num > 50) {
      setErrors({ simulation: 'Number of simulation runs must be between 10 and 50' });
      return;
    }

    clearErrors(setErrors, "simulation"); // Clear previous error message
    setPreviousRun(null); // Clear previous run
    setIsRunning(true); // Set simulation as running

    const laddaBtn = Ladda.create(e.currentTarget);
    laddaBtn.start();  // Start the Ladda button spinner

    try {
      const response = await Axios.post('/runSimulation', {},
        {
          params: {
            scenarioId: selectedScenario,
            numTimes: num
          }
        }
      );
      setPreviousRun(response.data);
      setIsRunning(false); // Set simulation as not running
    } catch (error) {
      setErrors({ simulation: 'An error occurred during the simulation' });
      console.error('Simulation error:', error);
    } finally {
      laddaBtn.stop(); // Stop the Ladda spinner
    }
  };

  return (
    <Layout>
      <div className={styles.background}>
        <h2>Scenario Simulation</h2>
        <ErrorMessage errors={errors} />

        <div className={styles.section}>
          <div className={styles.group}>
            <p>Select a Scenario:</p>
            {/* TODO: modify to react-select here */}
            <select id="scenario" className={styles.dropdown} value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
              <option value="" hidden disabled>-- Select a Scenario --</option>
              {scenarios.map((scenario, index) => (
                <option key={index} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p>Enter number of simulation runs: </p>
            <input
              id="simulation"
              type="number"
              min="10"
              max="50"
              step="1"
              className={styles.simInput}
              value={numSimulations}
              onChange={(e) => setNumSimulations(e.target.value)}
            />
          </div>

          {/* {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>} */}

          <div className={styles.buttonBox}>
            <div className={styles.buttons}>
              <div className={styles.simulationButtons}>
              </div>
              <button
                className={`${styles.runSimulation} ladda-button`}
                data-style="expand-left"
                data-spinner-size="25"
                onClick={(e) => handleRunSimulation(e)}
              >
                <span>Run Simulation</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Results</h2>
          {!isRunning && previousRun === null && (
            <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
              Please select a scenario, enter number of simulations, and run simulation to see results.
            </p>
          )}

          {isRunning ? (
            <p>Simulation is running... Please wait.</p>
          ) : (
            previousRun !== null && (
              <div>
                <p>Most Recent Run Result:</p>
                <Link className={styles.seeResults} to={`/visualizations/charts/${previousRun}`}>
                  See Results
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ScenarioSimulation;
