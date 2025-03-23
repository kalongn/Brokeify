import { TbEdit } from "react-icons/tb";
import { TbFileSearch } from "react-icons/tb";
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
  const [loading, setLoading] = useState(true);

  const stateMap = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
  }

  const distributionToString = (distribution) => {
    switch (distribution.distributionType) {
      case "FIXED_AMOUNT":
        return `${distribution.value}`;
      case "FIXED_PERCENTAGE":
        return `${distribution.value * 100}%`;
      case "UNIFORM_AMOUNT":
        return `[${distribution.lowerBound}, ${distribution.upperBound}]`;
      case "UNIFORM_PERCENTAGE":
        return `[${distribution.lowerBound * 100}%, ${distribution.upperBound * 100}%]`;
      case "NORMAL_AMOUNT":
        return `μ: ${distribution.mean}, σ: ${distribution.standardDeviation}`;
      case "NORMAL_PERCENTAGE":
        return `μ: ${distribution.mean * 100}%, σ: ${distribution.standardDeviation * 100}%`;
      default:
        return "Unknown Distribution Type";
    }
  };

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
                <TbFileSearch size={25} />
                <TbEdit size={25} />

              </div>

              <div className={styles.buttons}>
                <button className={styles.runSimulation}>Run Simulation</button>
                <button className={styles.seeResults}>See Results</button>
              </div>
            </div>

            <div>
              <div className={styles.mainContent}>
                <div className={styles.basicInfo}>
                  <h3>Basic Information</h3>
                  <div className={styles.info}>
                    <div className={styles.infoItem1}>
                      <p>Financial Goal: </p>
                      <div className={styles.inputInfo}> ${scenario.financialGoal} </div>
                    </div>
                    <div className={styles.infoItem2}>
                      <p>State of Residence: </p>
                      <div className={styles.inputInfo}> {stateMap[scenario.stateOfResidence]} </div>
                    </div>
                    <div className={styles.infoItem3}>
                      <p>Filing Status: </p>
                      <div className={styles.inputInfo}> {scenario.filingStatus} </div>
                    </div>
                    <div className={styles.infoItem4}>
                      <p>Life Expenctancy: </p>
                      <div className={styles.inputInfo}> {distributionToString(scenario.userLifeExpectancyDistribution)} years </div>
                    </div>
                  </div>
                </div>

                <div className={styles.strategies}>

                  <div className="accordion">
                    {strategies.map(({ title, content }) => (
                      <Accordion key={title} title={title} content={content} />
                    ))}
                  </div>

                </div>

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
