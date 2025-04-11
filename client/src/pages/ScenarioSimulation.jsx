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


import 'ladda/dist/ladda.min.css';
import * as Ladda from 'ladda/js/ladda'; // or import from submodule path

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


  const runSimulation = async (e) => {
    const num = numSimulations;
    if (isNaN(num) || num < 10 || num > 50) {
      window.alert("Please enter a number between 10 and 50.");
      //Decided to pop-up because not sure where to keep the error message
      return;
    }

    setIsRunning(true);
    {/*Note: Used ChatGPT to create the Ladda button template -- adjusted to suit our project a little more; added comments 
    to expain parts of this button*/}
    const laddaBtn = Ladda.create(e.currentTarget);
    laddaBtn.start();

    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 1) {
        progress += 0.1; // Increase progress by 10%
        laddaBtn.setProgress(progress); // Update progress
      }
    }, 1000); // Update every 1000ms (can do an approx time of however sim takes to load)-can also just remove progress bat if we want lol

    try {
      // Currently running for 12 seconds - we need to adjust this manually (set it to the avg runtime of simulation)
      await new Promise((resolve) => setTimeout(resolve, 12000));

      setPreviousRun(true); //Update to actual run 
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      clearInterval(interval); // Clear the progress interval
      laddaBtn.stop(); // Stop the progress bar

      setIsRunning(false); // Set running state to false
    }

    // TODO: Implement the simulation logic here
    //Temporarily just testing lol -- can remove this statement below
    //window.alert(`Running simulation with ${num} runs...`);
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
