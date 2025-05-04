import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { clearErrors } from "../utils/ScenarioHelper";
import Layout from '../components/Layout';
import ChartTabs from '../components/ChartTabs';
import ErrorMessage from '../components/ErrorMessage';
import Axios from 'axios';

import 'ladda/dist/ladda.min.css';
import * as Ladda from 'ladda/js/ladda'; // or import from submodule path

import styles from './SimulationPage.module.css';

const ScenarioSimulation = () => {
  const [scenarios, setScenarios] = useState([]);
  const [simulationInput, setSimulationInput] = useState({
    numSimulations: 10
  });
  const [errors, setErrors] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [previousRun, setPreviousRun] = useState(null);
  const [previousRunSimulationType, setPreviousRunSimulationType] = useState(null);

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
      setPreviousRunSimulationType(data.previousRunSimulationType);
      setIsRunning(data.isRunning);

      if (data.isRunning) {
        setPreviousRun(null);
        setPreviousRunSimulationType(null);

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
              Axios.get('/runSimulation').then(res => {
                const data = res.data;
                setPreviousRun(data.previousRun);
                setPreviousRunSimulationType(data.previousRunSimulationType);
              });
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
    if (!simulationInput.selectedScenario) {
      setErrors({ scenario: 'Scenario selection is required' });
      return;
    }
    const num = simulationInput.numSimulations;
    if (isNaN(num) || num < 10 || num > 100) {
      setErrors({ simulation: 'Number of simulation runs must be between 10 and 100' });
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
      const selectedScenarioId = simulationInput.selectedScenario;
      let exploration = structuredClone(simulationInput);
      delete exploration.selectedScenario;
      delete exploration.numSimulations;
      if (Object.keys(exploration).length === 0) {
        exploration = null;
      }

      const response = await Axios.post('/runSimulation', {},
        {
          params: {
            scenarioId: selectedScenarioId,
            numTimes: num,
            exploration: exploration,
          }
        }
      );

      const data = response.data;
      setPreviousRun(data.previousRun);
      setPreviousRunSimulationType(data.previousRunSimulationType);

    } catch (error) {
      setErrors({ simulation: 'An error occurred during the simulation' });
      console.error('Simulation error:', error);
    } finally {
      if (laddaInstanceRef.current && !isRunning) {
        laddaInstanceRef.current.stop();
        laddaInstanceRef.current = null;
        setIsRunning(false);
      }
    }
  };

  return (
    <Layout>
      <div className={styles.background}>
        <p>
          <b>To run a simulation, a scenario needs at least the Basic Information section completed.</b>
          <br /><br />
          <i>
            If the state income tax of the state of residence is not uploaded, the simulation will ignore state tax rate.
            There are 4 state tax files that are uploaded by default: New York, New Jersey, Connecticut, and Washington.
            If filing status is married, you need both MARRIEDJOINT and SINGLE state tax files; otherwise, you need only the SINGLE state tax file.
          </i>
        </p>
        <ErrorMessage errors={errors} />
        <div className={styles.columns}>
          <ChartTabs
            scenarios={scenarios}
            simulationInput={simulationInput}
            setSimulationInput={setSimulationInput}
            setErrors={setErrors}
          />
          <div className={styles.section}>
            <h2>Results</h2>
            {!isRunning && previousRun === null && (
              <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
                Please select a scenario, enter number of simulations, and run simulation to see results.
              </p>
            )}
            {isRunning ? (
              <p>A simulation is running... Please wait.</p>
            ) : (
              previousRun !== null && (
                <div>
                  {previousRunSimulationType === "NORMAL" && <>
                    <h3>Most Recent Run Result (Normal):</h3>
                    <p className={styles.disclaimer}>
                      Most recent run stats
                    </p>
                    <Link className={styles.seeResults} to={`/visualizations/charts/${previousRun}`}>
                      See Normal Results
                    </Link>
                  </>}

                  {previousRunSimulationType === "1D" && <>
                    <h3>Most Recent Run Result (1D):</h3>
                    <Link className={styles.seeResults} to={`/visualizations/OneDimensional/${previousRun}`}>
                      See 1D Results
                    </Link>
                  </>}

                  {previousRunSimulationType === "2D" && <>
                    <h3>Most Recent Run Result (2D)</h3>
                    <Link className={styles.seeResults} to={`/visualizations/TwoDimensional/${previousRun}`}>
                      See 2D Results
                    </Link>
                  </>}
                </div>
              )
            )}
            <div className={styles.buttonBox}>
              <div className={styles.buttons}>
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
        </div>
      </div>
    </Layout>
  );
};

export default ScenarioSimulation;
