import { useState, useEffect, useRef } from 'react';
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

  // Co-pilot (Gemini 2.5 pro) assistance:
  // Idea: only user to only run 1 simulation at a time, need a setInterval to check if the simulation is still running
  // refresh and show result every 5 seconds if user left the page / refresh the page and update status accordingly
  // - Added a ref to the button to manage Ladda instance
  // - Used useRef to store the Ladda instance and interval ID
  // - Used useEffect to set up the Ladda instance and interval

  const runButtonRef = useRef(null); // Ref for the button
  const laddaInstanceRef = useRef(null); // Ref to store the Ladda instance
  const intervalRef = useRef(null); // Ref to store interval ID

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    let initialLaddaInstance = null; // Temporary variable for Ladda instance

    Axios.get('/runSimulation').then((response) => {
      const data = response.data;
      setScenarios(data.scenarios);
      setPreviousRun(data.previousRun);
      setIsRunning(data.isRunning);

      if (data.isRunning) {
        setPreviousRun(null);

        // Check if button ref is available and start Ladda
        if (runButtonRef.current) {
          initialLaddaInstance = Ladda.create(runButtonRef.current);
          laddaInstanceRef.current = initialLaddaInstance; // Store instance
          initialLaddaInstance.start();
        }

        // Clear any existing interval before starting a new one
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => { // Store interval ID
          Axios.get('/runSimulation/isRunningSimulation').then((response) => {
            const stillRunning = response.data;
            setIsRunning(stillRunning);
            if (!stillRunning) {
              clearInterval(intervalRef.current); // Clear interval using stored ID
              intervalRef.current = null; // Reset interval ref
              if (laddaInstanceRef.current) {
                laddaInstanceRef.current.stop(); // Stop spinner using stored instance
                laddaInstanceRef.current = null; // Reset Ladda instance ref
              }
              Axios.get('/runSimulation').then(res => setPreviousRun(res.data.previousRun));
            }
          }).catch((error) => {
            console.error('Error fetching isRunningSimulation:', error);
            clearInterval(intervalRef.current); // Clear interval on error too
            intervalRef.current = null;
            if (laddaInstanceRef.current) {
              laddaInstanceRef.current.stop();
              laddaInstanceRef.current = null;
            }
            setIsRunning(false); // Assume not running on error
          });
        }, 5000);
      }
    }).catch((error) => {
      console.error('Error fetching initial state:', error);
      setIsRunning(false); // Assume not running on error
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);


  const handleRunSimulation = async () => {
    if (!selectedScenario) {
      setErrors({ scenario: 'Scenario selection is required' });
      return;
    }
    const num = numSimulations;
    if (isNaN(num) || num < 10 || num > 50) {
      setErrors({ simulation: 'Number of simulation runs must be between 10 and 50' });
      return;
    }

    clearErrors(setErrors, "simulation");
    setPreviousRun(null);
    setIsRunning(true);

    if (runButtonRef.current) {
      const laddaBtn = Ladda.create(runButtonRef.current);
      laddaInstanceRef.current = laddaBtn;
      laddaBtn.start();
    } else {
      console.error("Run button ref not found");
      return;
    }

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
    } catch (error) {
      setErrors({ simulation: 'An error occurred during the simulation' });
      console.error('Simulation error:', error);
      setIsRunning(false);
    } finally {
      if (laddaInstanceRef.current && !isRunning) {
        laddaInstanceRef.current.stop();
        laddaInstanceRef.current = null;
      }
      if (!isRunning && laddaInstanceRef.current) {
        laddaInstanceRef.current.stop();
        laddaInstanceRef.current = null;
      }
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
                ref={runButtonRef}
                onClick={() => handleRunSimulation()}
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
