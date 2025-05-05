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
  const chartTabsRef = useRef(null);

  const [scenarios, setScenarios] = useState([]);
  const [simulationInput, setSimulationInput] = useState({
    numSimulations: 10
  });
  const [errors, setErrors] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [previousRun, setPreviousRun] = useState(null);
  const [previousRunScenarioName, setPreviousRunScenarioName] = useState(null);
  const [previousRunSimulationAmount, setPreviousRunSimulationAmount] = useState(null);
  const [previousRunSimulationType, setPreviousRunSimulationType] = useState(null);
  const [previousRunParamOne, setPreviousRunParamOne] = useState(null);
  const [previousRunParamTwo, setPreviousRunParamTwo] = useState(null);

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
      setPreviousRunSimulationAmount(data.previousRunSimulationAmount);
      setPreviousRunScenarioName(data.previousRunScenarioName);
      if (data.previousRunParamOneType) {
        setPreviousRunParamOne({
          paramOne: data.previousRunParamOne,
          paramOneType: data.previousRunParamOneType,
          paramOneLower: data.previousRunParamOneLower,
          paramOneUpper: data.previousRunParamOneUpper,
          paramOneStep: data.previousRunParamOneStep,
        });
      } else {
        setPreviousRunParamOne(null);
      }
      if (data.previousRunParamTwoType) {
        setPreviousRunParamTwo({
          paramTwo: data.previousRunParamTwo,
          paramTwoType: data.previousRunParamTwoType,
          paramTwoLower: data.previousRunParamTwoLower,
          paramTwoUpper: data.previousRunParamTwoUpper,
          paramTwoStep: data.previousRunParamTwoStep,
        });
      } else {
        setPreviousRunParamTwo(null);
      }
      setIsRunning(data.isRunning);

      if (data.isRunning) {
        setPreviousRun(null);
        setPreviousRunScenarioName(null);
        setPreviousRunSimulationAmount(null);
        setPreviousRunParamOne(null);
        setPreviousRunParamTwo(null);
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

  const simulationTypeMapping = {
    "NORMAL": "Regular Simulation",
    "1D": "1D-Exploration Simulation",
    "2D": "2D-Exploration Simulation"
  }

  const handleRunSimulation = async () => {
    if (!simulationInput.selectedScenario) {
      setErrors({ scenario: 'Scenario selection is required' });
      return;
    }
    const num = simulationInput.numSimulations;
    if (isNaN(num) || num < 10 || num > 1000) {
      setErrors({ simulation: 'Number of simulation runs must be between 10 and 1000' });
      return;
    }
    if (chartTabsRef.current && !chartTabsRef.current.validateFields()) {
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

      await Axios.post('/runSimulation', {},
        {
          params: {
            scenarioId: selectedScenarioId,
            numTimes: num,
            exploration: exploration,
          }
        }
      );

      const response = await Axios.get('/runSimulation');
      const data = response.data;
      setPreviousRun(data.previousRun);
      setPreviousRunSimulationType(data.previousRunSimulationType);
      setPreviousRunSimulationAmount(data.previousRunSimulationAmount);
      setPreviousRunScenarioName(data.previousRunScenarioName);
      if (data.previousRunParamOneType) {
        setPreviousRunParamOne({
          paramOne: data.previousRunParamOne,
          paramOneType: data.previousRunParamOneType,
          paramOneLower: data.previousRunParamOneLower,
          paramOneUpper: data.previousRunParamOneUpper,
          paramOneStep: data.previousRunParamOneStep,
        });
      } else {
        setPreviousRunParamOne(null);
      }
      if (data.previousRunParamTwoType) {
        setPreviousRunParamTwo({
          paramTwo: data.previousRunParamTwo,
          paramTwoType: data.previousRunParamTwoType,
          paramTwoLower: data.previousRunParamTwoLower,
          paramTwoUpper: data.previousRunParamTwoUpper,
          paramTwoStep: data.previousRunParamTwoStep,
        });
      } else {
        setPreviousRunParamTwo(null);
      }
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
        <div >
          <p>To run a simulation, a scenario needs at least the Basic Information section completed.</p>

        </div>
        <ErrorMessage errors={errors} />
        <div className={styles.columns}>
          <ChartTabs
            ref={chartTabsRef}
            scenarios={scenarios}
            simulationInput={simulationInput}
            setSimulationInput={setSimulationInput}
            setErrors={setErrors}
          />
          <div className={styles.section}>
            <h3>Most Recent Simulation Results</h3>
            <p className={styles.disclaimer}>
              {previousRun !== null ? (
                <span>
                  <strong>Scenario: </strong> {previousRunScenarioName}
                  <br /><strong>Simulation Type: </strong>{simulationTypeMapping[previousRunSimulationType]}
                  <br /><strong>Number of Simulations: </strong> {previousRunSimulationAmount}
                  {previousRunParamOne && (
                    <>
                      <br /><strong>Parameter 1: {previousRunParamOne.paramOneType === "Disable Roth" ? "Roth Optimizer" : previousRunParamOne.paramOneType}</strong>
                      {previousRunParamOne.paramOneType !== "Disable Roth" ? (
                        <>
                          <br />- Event: {previousRunParamOne.paramOne}
                          <br />- Lower Bound: {previousRunParamOne.paramOneLower}{previousRunParamOne.paramOneType === "First of Two Investments" && "%"}
                          <br />- Upper Bound: {previousRunParamOne.paramOneUpper}{previousRunParamOne.paramOneType === "First of Two Investments" && "%"}
                          <br />- Step Size: {previousRunParamOne.paramOneStep}{previousRunParamOne.paramOneType === "First of Two Investments" && "%"}
                        </>
                      ) :
                        <>
                          <br />- Enable versus Disable Roth
                        </>
                      }
                    </>
                  )}
                  {previousRunParamTwo && (
                    <>
                      <br /><strong>Parameter 2:</strong>
                      <br />- Type: {previousRunParamTwo.paramTwoType}
                      <br />- Parameter: {previousRunParamTwo.paramTwo}
                      <br />- Lower Bound: {previousRunParamTwo.paramTwoLower}{previousRunParamTwo.paramTwoType === "First of Two Investments" && "%"}
                      <br />- Upper Bound: {previousRunParamTwo.paramTwoUpper}{previousRunParamTwo.paramTwoType === "First of Two Investments" && "%"}
                      <br />- Step Size: {previousRunParamTwo.paramTwoStep}{previousRunParamTwo.paramTwoType === "First of Two Investments" && "%"}
                    </>
                  )}
                </span>
              ) : (
                isRunning ? (
                  <span>
                    Simulation is running... Please wait.
                  </span>
                )
                  :
                  (
                    <span>
                      No simulation results are available. Please run a simulation to see the results.
                    </span>
                  )
              )}
            </p>
            {
              previousRun !== null && (
                <div>
                  {previousRunSimulationType === "NORMAL" && <>
                    <Link className={styles.seeResults} to={`/visualizations/charts/${previousRun}`}>
                      See Normal Results
                    </Link>
                  </>}

                  {previousRunSimulationType === "1D" && <>
                    <Link className={styles.seeResults} to={`/visualizations/OneDimensional/${previousRun}`}>
                      See 1D Results
                    </Link>
                  </>}

                  {previousRunSimulationType === "2D" && <>
                    <Link className={styles.seeResults} to={`/visualizations/TwoDimensional/${previousRun}`}>
                      See 2D Results
                    </Link>
                  </>}
                </div>
              )
            }
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
        <details className={styles.disclaimer}>
          <summary><strong>Disclaimer</strong></summary>
          <i>
            <ul>
              <li>The system expects the starting year of everything to be at least the current year.</li>
              <li>The system assumes all users are US citizens.</li>
              <li>The system does not account for state income tax unless a file of the matching state of residence is uploaded.
                <ul>
                  <li>By default, files for NY, NJ, CT, and WA of year 2024 are provided.</li>
                  <li>For married filers, both MARRIEDJOINT and SINGLE files are required; otherwise, only the SINGLE file is needed.</li>
                </ul>
              </li>
              <li>The system will fetch the latest version of state tax brackets available, federal tax brackets, and the RMD table.
                <ul>
                  <li>If the year of computation is earlier than the latest version of information, we will still just use the latest version and will not calculate reverse inflation.</li>
                </ul>
              </li>
              <li>All taxes are adjusted for the inflation rate.</li>
              <li>The system assumes all users take the federal standard deduction.</li>
              <li>The system assumes that the user satisfies the conditions to use the standard deductions in <a className={styles.specialLink} href="https://www.irs.gov/publications/p17">Table 10-1</a>.</li>
              <li>The system assumes the user satisfies the conditions for using <a className={styles.specialLink} href="https://www.irs.gov/publications/p590b">IRS Publication 590-B Table III</a>.</li>
              <li>The system assumes all capital gains are long-term.</li>
              <li>The system assumes that states tax capital gains the same way as other income. This is reasonable because most states tax them the same way.</li>
              <li>The system assumes that state income tax can be computed in a similar manner as federal income tax, using a table of tax rates and brackets for each filing status, and ignores any deviations from this.</li>
              <li>The system also ignores any deductions or exemptions for state income tax.</li>
              <li>The system assumes that 85% of social security benefits are subject to federal income tax.</li>
              <li>When part of an investment is sold, the system uses the average cost basis method to compute the capital gains.</li>
              <li>The system ignores capital gains tax related to the cash investment.</li>
              <li>The system runs inflation on an annual basis.</li>
              <li>The system assumes the IRS annual contribution limits for retirement accounts adjust smoothly with inflation.</li>
              <li>The system assumes that investments have no capital gains at the start of the simulation.</li>
              <li>For married couples, the system assumes that all investments are jointly owned, and the beneficiary is the surviving spouse. When the user or the spouse reaches their life expectancy (death), the percentages of income and expense transactions associated with the deceased spouse are omitted from transaction amounts for future years, and the survivor&apos;s tax filing status changes from married filing jointly to single.</li>
              <li>The system assumes that no tax needs to be paid in the starting year of the simulation.</li>
              <li>The system assumes all simulations start in the current actual year.</li>
              <li>The system results may be inaccurate and do not necessarily reflect real life.</li>
            </ul>
          </i>
        </details>
      </div>
    </Layout>
  );
};

export default ScenarioSimulation;
