/** Referenced ChatGPT to generate a part of the design of this code.**/
import { CgMenuGridO } from "react-icons/cg";
import { BsToggleOn } from "react-icons/bs";
import { BsToggleOff } from "react-icons/bs";
import { BiSolidCircle } from "react-icons/bi";
import { BiCircle } from "react-icons/bi";
import { useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Axios from "axios";


import Layout from "../components/Layout";
import styles from "./ViewScenario.module.css";

const ViewScenario = () => {

  const { scenarioId } = useParams(); // Get the scenario ID from the URL params

  const [loading, setLoading] = useState(true);
  const [scenarioData, setScenarioData] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [events, setEvents] = useState([]);
  const [orderedSpendingStrategy, setOrderedSpendingStrategy] = useState([]);
  const [orderedExpenseWithdrawalStrategy, setOrderedExpenseWithdrawalStrategy] = useState([]);
  const [orderedRMDStrategy, setOrderedRMDStrategy] = useState([]);
  const [orderedRothStrategy, setOrderedRothStrategy] = useState([]);

  useEffect(() => {
    // Fetch the scenario data from the backend using the scenarioId
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/scenario-detail/${scenarioId}`).then((response) => {
      const scenarioData = response.data;
      console.log('Scenario data:', scenarioData);
      setScenarioData(scenarioData);

      setInvestments(scenarioData.investments || []);
      setEvents(scenarioData.events || []);
      setOrderedSpendingStrategy(scenarioData.orderedSpendingStrategy || []);
      setOrderedExpenseWithdrawalStrategy(scenarioData.orderedExpenseWithdrawalStrategy || []);
      setOrderedRMDStrategy(scenarioData.orderedRMDStrategy || []);
      setOrderedRothStrategy(scenarioData.orderedRothStrategy || []);

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
      <div className={styles.background}>
        {loading ? <div className={styles.loading}>Loading...</div>
          :
          <div className={styles.sections}>
            {/**Basic Information Section */}
            <h2>Basic Information</h2>

            <p className={styles.question}>Scenario Name</p>
            <div className={styles.textbox}>{scenarioData.name || "N/A"}</div>

            <div className={styles.columns}>
              <div className={styles.columnsp1}>
                <p className={styles.question}>First Name</p>
                <div className={styles.textbox}>{scenarioData.ownerFirstName}</div>
              </div>
              <div className={styles.columnsp2}>
                <p className={styles.question}>Last Name</p>
                <div className={styles.textbox}>{scenarioData.ownerLastName}</div>
              </div>
            </div>

            <div>
              <p className={styles.question}>Financial Goal</p>
              <p className={styles.description}>
                Specify a non-negative number representing the desired minimum total value of your
                investments. A goal of 0 ensures all expenses are met, while a positive goal provides a financial cushion and estate.
              </p>
              <div className={styles.textbox}>${scenarioData.financialGoal}</div>
            </div>

            <p className={styles.question}>State of Residence</p>
            <div className={styles.textbox}>{scenarioData.stateOfResidence}</div>

            <p className={styles.question}>Marital Status</p>
            <div className={styles.textbox}>
              <div className={styles.answer}>{scenarioData.filingStatus === "MARRIEDJOINT" ? "Married" : "Single"}</div>
            </div>
            <div className={styles.columns}>
              <div className={styles.columnsp1}>
                <p className={styles.question}>Your Birth Year</p>
                <div className={styles.textbox}>{scenarioData.userBirthYear}</div>
              </div>
              {scenarioData?.filingStatus === "MARRIEDJOINT" && (
                <div className={styles.columnsp2}>
                  <p className={styles.question}>Spouse Birth Year</p>
                  <div className={styles.textbox}>{scenarioData.spouseBirthYear}</div>
                </div>
              )}
            </div>
            <div className={styles.columns}>
              <div className={styles.columnsp1}>
                <p className={styles.question}>Your Life Expectancy</p>
                {
                  scenarioData.userLifeExpectancyDistribution?.distributionType === "NORMAL_AMOUNT" ? (
                    <>
                      <div>
                        <BiCircle /> <span> Fixed Value</span>
                      </div>
                      <div>
                        <BiSolidCircle /><span> Sample from Normal Distribution</span>
                      </div>
                      <div className={styles.distribution}>
                        Mean : <div className={styles.textbox}> {scenarioData.userLifeExpectancyDistribution.mean}</div>
                        Standard Deviation : <div className={styles.textbox}> {scenarioData.userLifeExpectancyDistribution.standardDeviation}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <BiSolidCircle /><span> Fixed Value</span>
                      </div>
                      <div>
                        <BiCircle /> <span> Sample from Normal Distribution</span>
                      </div>
                      Value: <div className={styles.textbox}>{scenarioData.userLifeExpectancyDistribution?.value}</div>
                    </>
                  )
                }


              </div>
              {scenarioData?.filingStatus === "MARRIEDJOINT" && (
                <div className={styles.columnsp2}>
                  <p className={styles.question}>Spouse Life Expectancy</p>
                  {
                    scenarioData.spouseLifeExpectancyDistribution?.distributionType === "NORMAL_AMOUNT" ? (
                      <>
                        <div>
                          <BiCircle /> <span> Fixed Value</span>
                        </div>
                        <div>
                          <BiSolidCircle /><span> Sample from Normal Distribution</span>
                        </div>
                        Mean : <div className={styles.textbox}> {scenarioData.spouseLifeExpectancyDistribution.mean}</div>
                        Standard Deviation : <div className={styles.textbox}> {scenarioData.spouseLifeExpectancyDistribution.standardDeviation}</div>
                      </>
                    ) : (
                      <>
                        <div>
                          <BiSolidCircle /><span> Fixed Value</span>
                        </div>
                        <div>
                          <BiCircle /> <span> Sample from Normal Distribution</span>
                        </div>
                        Value: <div className={styles.textbox}>{scenarioData.spouseLifeExpectancyDistribution.value}</div>
                      </>
                    )
                  }

                </div>
              )}
            </div>

            {/**Investments Section */}
            <h2>Investments</h2>
            <p className={styles.description}>
              If married, investments will automatically be assumed as jointly owned.
            </p>
            <div className={styles.investmentRow}>
              <div className={styles.question}>Name</div>
              <div className={styles.question}>Value (in Dollars)</div>
              <div className={styles.question}>Tax Status</div>
            </div>
            <div className={styles.investmentTable}>
              {investments.map((investment, index) => (
                <div key={index} className={styles.investmentWrapper}>
                  <div className={styles.investmentRowWithHover}>
                    <div className={styles.textbox}>{investment.name}</div>
                    <div className={styles.textbox}>{investment.value.toLocaleString()}</div>
                    <div className={styles.textbox}>{investment.taxStatus}</div>
                  </div>
                  <div className={styles.hoverInlineDetails}>
                    <p className={styles.lightText}>Taxability: {investment.taxability ? "Taxable" : "Tax-exempt"}</p>
                    <p className={styles.lightText}>Expected Annual Return: {investment.expectedAnnualReturnDistribution}</p>
                    <p className={styles.lightText}>Expense Ratio: {investment.expenseRatio}</p>
                    <p className={styles.lightText}>Expected Annual Income from Dividends or Interests: {investment.expectedAnnualIncomeDistribution}</p>
                  </div>
                </div>
              ))}

            </div>

            {/**Event Series Section */}
            <h2>Event Series</h2>
            <p className={styles.description}>
              An event series is a sequence of recurring financial events (income, expense, investment, or rebalancing) over a defined period.
            </p>
            <div className={styles.eventRow}>
              <div className={`${styles.question} ${styles.eventRow1}`}>Event Series Name</div>
              <div className={`${styles.question} ${styles.eventRow2}`}>Type</div>
            </div>

            <div className={styles.eventTable}>
              {events.map((event, index) => (
                <div key={index} className={styles.eventRow}>
                  <div className={`${styles.textbox} ${styles.eventRow1}`}>{event.name}</div>
                  <div className={`${styles.textbox} ${styles.eventRow2}`}>{event.type}</div>
                </div>
              ))}
            </div>

            {/**Inflation and Contribution Limits Section */}
            <h2>Inflation & Contribution Limits</h2>
            <p className={styles.question}>Inflation Assumption Percentage</p>

            {
              scenarioData.inflationAssumptionDistribution?.distributionType === "NORMAL_PERCENTAGE" ? (
                <>
                  <div>
                    <BiCircle /> <span> Fixed Percentage</span>
                  </div>
                  <div>
                    <BiSolidCircle /><span> Sample from Normal Distribution</span>
                  </div>
                  <div>
                    <BiCircle /><span> Sample from Uniform Distribution</span>
                  </div>
                  Mean : <div className={styles.textbox}> {parseFloat(scenarioData.inflationAssumptionDistribution.mean) * 100} </div>
                  Standard Deviation : <div className={styles.textbox}> {parseFloat(scenarioData.inflationAssumptionDistribution.standardDeviation) * 100} </div>
                </>
              ) :

                scenarioData.inflationAssumptionDistribution?.distributionType === "UNIFORM_PERCENTAGE" ? (
                  <>
                    <div>
                      <BiCircle /> <span> Fixed Percentage</span>
                    </div>
                    <div>
                      <BiCircle /><span> Sample from Normal Distribution</span>
                    </div>
                    <div>
                      <BiSolidCircle /><span> Sample from Uniform Distribution</span>
                    </div>
                    Lower Bound : <div className={styles.textbox}> {parseFloat(scenarioData.inflationAssumptionDistribution.lowerBound) * 100}</div>
                    Upper Bound : <div className={styles.textbox}> {parseFloat(scenarioData.inflationAssumptionDistribution.upperBound) * 100}</div>
                  </>
                ) :
                  (
                    <>
                      <div>
                        <BiSolidCircle /> <span> Fixed Percentage</span>
                      </div>
                      <div>
                        <BiCircle /><span> Sample from Normal Distribution</span>
                      </div>
                      <div>
                        <BiCircle /><span> Sample from Uniform Distribution</span>
                      </div>
                      Percentage: <div className={styles.textbox}>{parseFloat(scenarioData.inflationAssumptionDistribution?.value) * 100}</div>
                    </>
                  )
            }


            <p className={styles.question}> After-Tax Retirement Accounts Initial Limit on Annual Contributions</p>

            <div className={styles.textbox}>{scenarioData.annualPostTaxContributionLimit}</div>


            {/**Spending Strategy Section */}
            <h2>Spending Strategy</h2>
            <p className={styles.description}>
              Specify the order of discretionary expenses to be paid as cash allows.
            </p>

            <div className={styles.listBox}>
              {orderedSpendingStrategy.map((strategy, index) => (
                <div key={index} className={styles.draggableItem}>
                  <CgMenuGridO size={20} className={styles.icon} />
                  <div className={styles.draggableText}>
                    <span className={styles.draggableItemText}>{strategy.name}</span>
                    <p className={styles.lightText}>
                      ${strategy.amount} – {strategy.percentage} -  {strategy.taxability}
                    </p>
                  </div>
                </div>
              ))}
            </div>


            {/**Expense Withdrawl Section */}
            <h2>Expense Withdrawal Strategy</h2>
            <p className={styles.description}>
              Specify the order in which the set of investments should be sold when cash is insufficient.
            </p>
            <div className={styles.listBox}>
              {orderedExpenseWithdrawalStrategy.map((strategy, index) => (
                <div key={index} className={styles.draggableItem}>
                  <CgMenuGridO size={20} className={styles.icon} />
                  <div className={styles.draggableText}>
                    <span className={styles.draggableItemText}>{strategy.name}</span>
                    <div>
                      <p className={styles.lightText}>${strategy.value}  – {strategy.expectedAnnualReturnDistribution} – {strategy.taxStatus} </p>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/**RMD Stategy Section */}
            <h2>Required Minimum Distribution Strategy</h2>
            <p className={styles.description}>
              Specify the order in which investments should be transferred from pre-tax retirement accounts to non-retirement accounts when a Required Minimum Distribution (RMD) is triggered.
            </p>

            {orderedRMDStrategy?.map((strategy, index) => (
              <div key={index} className={styles.draggableItem}>
                <CgMenuGridO size={20} className={styles.icon} />
                <div className={styles.draggableText}>
                  <span className={styles.draggableItemText}>{strategy.name}</span>
                  <div>
                    <p className={styles.lightText}>${strategy.value}  – {strategy.expectedAnnualReturnDistribution} – {strategy.taxStatus} </p>
                  </div>
                </div>
              </div>
            ))}

            {/**Roth Optimizer Section */}
            <h2>Roth Conversion Strategy & Optimizer</h2>
            <p className={styles.description}>
              Specify the order in which investments should be transferred from pre-tax to after-tax retirement accounts when a conversion is triggered.
            </p>

            <p className={styles.question}>Roth Conversion Optimizer</p>
            {(scenarioData.startYearRothOptimizer !== undefined) ? (
              <div>
                <div className={styles.roth}>
                  <BsToggleOn size={30} className={styles.icon} /><p className={styles.rothText}>Enabled</p>
                </div>
                <div className={styles.columns}>
                  <div className={styles.columnsp1}>
                    <p className={styles.question}>Start Year</p>
                    <div className={styles.textbox}>{scenarioData.startYearRothOptimizer}</div>
                  </div>
                  <div className={styles.columnsp2}>
                    <p className={styles.question}>End Year</p>
                    <div className={styles.textbox}>{scenarioData.endYearRothOptimizer}</div>
                  </div>
                </div>
                <p className={styles.question}>Roth Conversion Strategy</p>
                {/* Roth Listing - only displayed when roth is on**/}
                {orderedRothStrategy?.map((strategy, index) => (
                  <div key={index} className={styles.draggableItem}>
                    <CgMenuGridO size={20} className={styles.icon} />
                    <div className={styles.draggableText}>
                      <span className={styles.draggableItemText}>{strategy.name}</span>
                      <div>
                        <p className={styles.lightText}>${strategy.value}  – {strategy.expectedAnnualReturnDistribution} – {strategy.taxStatus} </p>
                      </div>
                    </div>

                  </div>
                ))}

              </div>
            ) : (

              <div className={styles.roth}>
                <BsToggleOff size={30} className={styles.icon} /><p className={styles.rothText}>Disabled</p>
              </div>

            )}
          </div>
        }
      </div>
    </Layout>
  );
};

export default ViewScenario;
