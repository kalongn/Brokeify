import { TbEdit } from "react-icons/tb";
import { TbFileSearch } from "react-icons/tb";
import { FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { stateMap, distributionToString } from "../utils/ScenarioHelper";
import Axios from "axios";

import styles from "./ScenarioSimulation.module.css";
import Investment from "../components/Investment";
import Event from "../components/Event";
import Layout from "../components/Layout";
import Accordion from "../components/Accordion";
//import ModalSharing from "../components/ModalSharing";
//import Sharing from "./Sharing.jsx";
const ScenarioSimulation = () => {

  const { scenarioId } = useParams(); // Get the scenario ID from the URL params
  const [scenario, setScenario] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [events, setEvents] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  //const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {

    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/scenario/${scenarioId}`).then((response) => {

      const scenarioData = response.data;

      console.log('Scenario data:', scenarioData);
      setScenario(scenarioData);

      const allInvestments = scenarioData.investmentTypes.flatMap(type =>
        type.investments.map(investment => ({ type: type, investment }))
      );

      const allEvents = scenarioData.events;

      const investIdNameMap = {};
      for (let type of scenarioData.investmentTypes) {
        for (let investment of type.investments) {
          investIdNameMap[investment._id] = type.name;
        }
      }

      const eventIdNameMap = {};
      for (let event of allEvents) {
        eventIdNameMap[event._id] = event.name;
      }

      const investments = allInvestments.map(investment => ({
        investmentType: {
          name: investment.type.name,
          taxability: investment.type.taxability,
          expectedAnnualReturn: distributionToString(investment.type.expectedAnnualReturnDistribution)
        }
        , value: investment.investment.value,
        taxStatus: investment.investment.taxStatus
      }));

      const events = allEvents.map(event => ({
        name: event.name,
        amount: event.amount ?? event.maximumCash ?? 0,
        duration: distributionToString(event.durationTypeDistribution),
        startYear: distributionToString(event.startYearTypeDistribution),
        eventType: event.eventType
      }));


      setInvestments(investments);
      setEvents(events);

      const spendingStrategy = [];
      for (let eventId of scenarioData.orderedSpendingStrategy) {
        const eventName = eventIdNameMap[eventId] || "Unknown Event";
        spendingStrategy.push(eventName);
      }

      const expenseWithdrawalStrategy = [];
      for (let investmentId of scenarioData.orderedExpenseWithdrawalStrategy) {
        const investmentName = investIdNameMap[investmentId] || "Unknown Investment";
        expenseWithdrawalStrategy.push(investmentName);
      }

      const rmdStrategy = [];
      for (let investmentId of scenarioData.orderedRMDStrategy) {
        const investmentName = investIdNameMap[investmentId] || "Unknown Investment";
        rmdStrategy.push(investmentName);
      }

      const rothConversionStrategy = [];
      for (let investmentId of scenarioData.orderedRothStrategy) {
        const investmentName = investIdNameMap[investmentId] || "Unknown Investment";
        rothConversionStrategy.push(investmentName);
      }

      setStrategies([
        {
          title: "Spending Strategy",
          content: spendingStrategy
        },
        {
          title: "Expense Withdrawal Strategy",
          content: expenseWithdrawalStrategy
        },
        {
          title: "RMD Strategy",
          content: rmdStrategy
        },
        {
          title: "Roth Conversion Strategy",
          content: rothConversionStrategy
        }
      ]);

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
  return (
    <Layout>
      <div className={styles.container}>
        {loading ? <h1>Loading...</h1>
          :
          <>

            <div className={styles.header}>
              <div className={styles.title}>
                <h2>{scenario.name}</h2>
                <Link to={`/ViewScenario/${scenarioId}`} className={styles.icon} onClick={() => { console.log('View Scenario Page') }}><TbFileSearch size={25} /></Link>
                <Link to={`/ScenarioForm/${scenarioId}`} className={styles.icon} onClick={() => { console.log('Edit Scenario Page') }}> <TbEdit size={25} /> </Link>
                <Link   to={`/Sharing/${scenarioId}`} className={styles.icon}><FaUserPlus size={23}/></Link>
              </div>
              
              <div className={styles.buttons}>
                <button className={styles.runSimulation}>Run Simulation</button>
                <button className={styles.seeResults}>See Results</button>
              </div>
            </div>
            
            <div>
              <div className={styles.mainContent}>
                {/**Basic Info */}
                <div className={styles.basicInfo}>
                  <h3>Basic Information</h3>
                  <div className={styles.info}>
                    <div className={styles.infoItem1}>
                      <p>Financial Goal: </p>
                      <div className={styles.inputInfo}> ${scenario.financialGoal || "N/A"} </div>
                    </div>
                    <div className={styles.infoItem2}>
                      <p>State of Residence: </p>
                      <div className={styles.inputInfo}> {stateMap[scenario.stateOfResidence] || "N/A"} </div>
                    </div>
                    <div className={styles.infoItem3}>
                      <p>Filing Status: </p>
                      <div className={styles.inputInfo}> {scenario.filingStatus || "N/A"} </div>
                    </div>
                    <div className={styles.infoItem4}>
                      <p>Life Expenctancy: </p>
                      <div className={styles.inputInfo}> {scenario.userLifeExpectancyDistribution ? distributionToString(scenario.userLifeExpectancyDistribution) : "N/A"} years </div>
                    </div>
                  </div>
                </div>
                 {/**Strategies */}
                <div className={styles.strategies}>

                  <div className="accordion">
                    {strategies.map(({ title, content }) => (
                      <Accordion key={title} title={title} content={content} />
                    ))}
                  </div>

                </div>
                 {/**Investments */}
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
                  {/**Events */}
                <div className={styles.events}>
                  <h3 className={styles.eventTitle}>Events</h3>
                  {events.length > 0 ? (
                    events.map((event, index) => (
                      <Event
                        key={index}
                        Name={event.name}
                        DollarValue={event.amount ?? event.maximumCash ?? 0}
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
