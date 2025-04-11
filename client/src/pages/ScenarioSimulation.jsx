import { TbEdit } from "react-icons/tb";
import { TbFileSearch } from "react-icons/tb";
import { FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import Axios from "axios";

import styles from "./ScenarioSimulation.module.css";
import Investment from "../components/Investment";
import Event from "../components/Event";
import Layout from "../components/Layout";
import Accordion from "../components/Accordion";

const ScenarioSimulation = () => {

  const { scenarioId } = useParams(); // Get the scenario ID from the URL params
  const [scenario, setScenario] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [events, setEvents] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [permission, setPermission] = useState(0);
  const [canShare, setCanShare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [numSimulations, setNumSimulations] = useState(50);
  const [isRunning, setIsRunning] = useState(true);
  const [previousRun, setPreviousRun] = useState(null);

  //NOte: the seeResults button is disabled if the simulation is running. 
  //If there is a previousRun, it will show up, but it will be disabled if the user taps on it while the simulation is running.
 //TODO: If loading, make sure all other buttons are disabled (editingScenario, sharing, etc.)


  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/scenario/${scenarioId}`).then((response) => {
      const scenarioData = response.data;
      console.log('Scenario data:', scenarioData);
      setScenario(scenarioData);
      setPermission(scenarioData.permission);
      setInvestments(scenarioData.investments || []);
      setEvents(scenarioData.events || []);
      setCanShare(scenarioData.canShare);

      const strategyList = [
        {
          title: "Spending Strategy",
          content: scenarioData.orderedSpendingStrategy
        },
        {
          title: "Expense Withdrawal Strategy",
          content: scenarioData.orderedExpenseWithdrawalStrategy
        },
        {
          title: "RMD Strategy",
          content: scenarioData.orderedRMDStrategy
        }
      ];

      if (scenarioData.startYearRothOptimizer !== undefined) {
        strategyList.push({
          title: "Roth Conversion Strategy",
          content: scenarioData.orderedRothStrategy
        });
      } else {
        strategyList.push({
          title: "Roth Conversion Strategy",
          content: "Roth Optimizer is disabled"
        });
      }

      setStrategies(strategyList);
      setLoading(false);
    }).catch((error) => {
      if (error.response && error.response.status === 403) {
        console.error('You do not have permission to access this scenario.');
      }
      else if (error.response && error.response.status === 404) {
        console.error('Scenario not found.');
      } else {
        console.error('Error fetching scenario:', error);
      }
      return <Navigate to="/Home" />;
    });
  }, [scenarioId]);


  const runSimulation = () => {
    const num = numSimulations;
    if (isNaN(num) || num < 10 || num > 50) {
      window.alert("Please enter a number between 10 and 50.");
      //Decided to pop-up because not sure where to keep the error message
      return;
    }
    
    setIsRunning(true); 
    // TODO: Implement the simulation logic here
    //Temporarily just testing lol -- can remove this statement below
    window.alert(`Running simulation with ${num} runs...`);
    console.log("Number of runs:", num);
  };

  return (
    <Layout>
      <div className={styles.container}>
        {loading ? <h1>Loading...</h1>
          :
          <>
            <div className={styles.header}>
              <div className={styles.title}>
                <h2>{scenario.name}</h2>
                {permission > 0 && <Link to={`/ViewScenario/${scenarioId}`} className={styles.icon}><TbFileSearch size={25} /></Link>}
                {permission > 1 && <Link to={`/ScenarioForm/${scenarioId}`} className={styles.icon}><TbEdit size={25} /></Link>}
                {permission > 2 && canShare && <Link to={`/Sharing/${scenarioId}`} className={styles.icon}><FaUserPlus size={25} /></Link>}
              </div>
              <div className={styles.buttonBox}>
                <div className={styles.buttons}>
                  <div className={styles.simulationButtons}>
                    <p className={styles.description}>Number of Runs</p>
                    <div>
                      <input
                        id="sim-count"
                        type="number"
                        min="10"
                        max="50"
                        step="1"
                        className={styles.simInput}
                        value={numSimulations}
                        onChange={(e) => setNumSimulations(e.target.value)}
                      />
                    </div>
                  </div>
                  <button className={styles.runSimulation} onClick={runSimulation}>Run Simulation</button>
                  {previousRun && (<Link  
                   className={`${styles.seeResults} ${isRunning ? styles.disabled : ""}`}
                    onClick={(e) => {
                      if (isRunning) e.preventDefault(); 
                      window.alert("Results are not available yet. Please wait for simulation to finish running.");
                    }}
                  
                  to={`/Visualizations/Charts/${scenarioId}`} > {isRunning ? "Loading..." : "See Results"}</Link>
                  )}
                  </div>
              </div>
            </div>

            <div>
              <div className={styles.mainContent}>
                {/* Basic Info */}
                <div className={styles.basicInfo}>
                  <h3>Basic Information</h3>
                  <div className={styles.info}>
                    <div className={styles.infoItem1}>
                      <p>Financial Goal: </p>
                      <div className={styles.inputInfo}> ${scenario.financialGoal || "N/A"} </div>
                    </div>
                    <div className={styles.infoItem2}>
                      <p>State of Residence: </p>
                      <div className={styles.inputInfo}> {scenario.stateOfResidence || "N/A"} </div>
                    </div>
                    <div className={styles.infoItem3}>
                      <p>Filing Status: </p>
                      <div className={styles.inputInfo}> {scenario.filingStatus || "N/A"} </div>
                    </div>
                    <div className={styles.infoItem4}>
                      <p>Life Expenctancy: </p>
                      <div className={styles.inputInfo}> {scenario.userLifeExpectancyDistribution ? scenario.userLifeExpectancyDistribution : "N/A"} years </div>
                    </div>
                  </div>
                </div>
                {/* Strategies */}
                <div className={styles.strategies}>

                  <div className="accordion">
                    {strategies.map(({ title, content }) => (
                      <Accordion key={title} title={title} content={content} />
                    ))}
                  </div>

                </div>
                {/* Investments */}
                <div className={styles.investments}>
                  <h3 className={styles.investmentTitle}>Investments</h3>

                  {investments.length > 0 ? (
                    investments.map((investment, index) => (
                      <Investment
                        key={index}
                        Type={investment.investmentType.name}
                        DollarValue={investment.value}
                        Taxability={investment.investmentType.taxability ? "Taxable" : "Tax-exempt"}
                        AnnualReturn={investment.investmentType.expectedAnnualReturn}
                        TaxStatus={investment.taxStatus}
                      />
                    ))
                  ) : (
                    <p>You currently have no investments. Edit the scenario to add.</p>
                  )}

                </div>
                {/* Events */}
                <div className={styles.events}>
                  <h3 className={styles.eventTitle}>Events</h3>
                  {events.length > 0 ? (
                    events.map((event, index) => (
                      <Event
                        key={index}
                        Name={event.name}
                        DollarValue={event.amount}
                        Duration={event.duration}
                        StartYear={event.startYear}
                        Type={event.eventType}
                      />
                    ))

                  )
                    : (
                      <p>You currently have no events. Edit the scenario to add.</p>
                    )}
                </div>
              </div>
            </div>
          </>
        }

      </div>
    </Layout>
  );
};

export default ScenarioSimulation;
