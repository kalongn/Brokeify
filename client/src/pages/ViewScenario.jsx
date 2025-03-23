import React from "react";
import Layout from "../components/Layout";
import styles from "./ViewScenario.module.css";
import { CgMenuGridO } from "react-icons/cg";
import { BsToggleOn } from "react-icons/bs";
import { BsToggleOff } from "react-icons/bs";
const ViewScenario = () => {
    {/**TO-DO: Middleware/Backend: populate an investments array like below for investments table: 
        Iterate through each investmentType, get list of investments in there, 
        retrieve their value and taxstatus; make an array like below
        */}
    const investments = [
        { name: "Cash", value: 15000, taxStatus: "Non-Retirement" },
        { name: "Cash", value: 25000, taxStatus: "Non-Retirement" },
        { name: "Domestic Stocks", value: 9350, taxStatus: "Non-Retirement" },
        { name: "Bonds", value: 315, taxStatus: "Pre-Tax Retirement" },
        { name: "Bonds", value: 200, taxStatus: "Pre-Tax Retirement" },
        { name: "Cash", value: 1200, taxStatus: "Pre-Tax Retirement" }
    ];

    {/**TO-DO: Middleware/Backend: populate an events array like below
        for event series table
    */}



    const events = [
        { name: "Buy a mechanical keyboard", type: "Expense" },
        { name: "Buy a Ferrari", type: "Expense" },
        { name: "Get some Solana", type: "Invest" },
        { name: "Buy Apple stocks", type: "Invest" },
        { name: "Buy commodities - oil", type: "Invest" },
        { name: "Start a YouTube channel and stream", type: "Income" }
    ];

    {/**TO-DO: Middleware/Backend: populate an ordered spending array like below
    Note: event-id is being stored in orderedStrategy array in scenarioData, so that's why we need 
    seperate array; here u can just populate the events by id; in ordered Spending section, I call strategy.name,
     which is event.name
    */}
    const orderedSpendingStrategy = [{ name: "Buy a mechanical keyboard", type: "Expense" },
    { name: "Buy a Ferrari", type: "Expense" }];


    {/**TO-DO: Middleware/Backend: create lists like the following (pull up name, value and taxStatus
        as those will be the descriptors for each strategy element) <-- investments don't have a name
       */}


    const orderedExpenseWithdrawalStrategy = [
        { name: "Cash", value: 15000, taxStatus: "Non-Retirement" },
        { name: "Cash", value: 25000, taxStatus: "Non-Retirement" },
    ]
    const orderedRMDStrategy = [
        { name: "Cash", value: 1200, taxStatus: "Pre-Tax Retirement" },
        { name: "Bonds", value: 200, taxStatus: "Pre-Tax Retirement" }

    ]
    const orderedRothStrategy = [
        { name: "Bonds", value: 315, taxStatus: "Pre-Tax Retirement" },
        { name: "Bonds", value: 200, taxStatus: "Pre-Tax Retirement" },
        { name: "Cash", value: 1200, taxStatus: "Pre-Tax Retirement" }
    ]

    {/**Another Note: I just assumed that if startYearRothOptimizer is undefined,
        then that must have meant the user disabled the Roth Optimizer. 
       */}
    const scenarioData = {
        name: "Ideal Future 2.0",
        filingStatus: "MARRIEDJOINT",
        userBirthYear: 2000,
        spouseBirthYear: 1999,
        userLifeExpectancy: 90,
        spouseLifeExpectancy: 90,
        stateOfResidence: "CA",
        investmentTypes: ["Cash", "Domestic Stocks", "Bonds"],
        events: events,
        inflationAssumption: 0.22,
        inflationAssumptionDistribution: { type: "FIXED_PERCENTAGE", value: 0.02 },
        annualPreTaxContributionLimit: 19500,
        annualPostTaxContributionLimit: 6000,
        financialGoal: 1000000,
        orderedSpendingStrategy: orderedSpendingStrategy,
        orderedExpenseWithdrawalStrategy: orderedExpenseWithdrawalStrategy,
        orderedRMDStrategy: orderedRMDStrategy,
        orderedRothStrategy: orderedRothStrategy,
        startYearRothOptimizer: 2021,
        endYearRothOptimizer: 2021
    }




    return (
        <Layout>
            <div className={styles.background}>
                <div className={styles.sections}>
                    <h2>Basic Information</h2>
                    <p className={styles.question}>Scenario Name</p>
                    <div className={styles.textbox}>{scenarioData.name}</div>

                    <div className={styles.columns}>
                        <div className={styles.columnsp1}>
                            <p className={styles.question}>First Name</p>
                            <div className={styles.textbox}>Sharolette</div>
                        </div>
                        <div className={styles.columnsp2}>
                            <p className={styles.question}>Last Name</p>
                            <div className={styles.textbox}>Webb</div>
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
                    <div className={styles.textbox}>Maine</div>

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
                    {/**NOTE: Life expectancy can be sampled as a normal distributon!!! Right now, we don't
 * account for that in the scenario, but we should..
 * Future To-Do: depending on how the scenario will look, we should update below as such.
 */}
                    <div className={styles.columns}>
                        <div className={styles.columnsp1}>
                            <p className={styles.question}>Your Life Expectancy</p>
                            <div className={styles.textbox}>{scenarioData.userLifeExpectancy}</div>
                        </div>
                        {scenarioData?.filingStatus === "MARRIEDJOINT" && (
                            <div className={styles.columnsp2}>
                                <p className={styles.question}>Spouse Life Expectancy</p>
                                <div className={styles.textbox}>{scenarioData.spouseLifeExpectancy}</div>
                            </div>
                        )}
                    </div>


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
                            <div key={index} className={styles.investmentRow}>
                                <div className={styles.textbox}>{investment.name}</div>
                                <div className={styles.textbox}>{investment.value.toLocaleString()}</div>
                                <div className={styles.textbox}>{investment.taxStatus}</div>
                            </div>
                        ))}
                    </div>

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

                    <h2>Inflation & Contribution Limits</h2>
                    <p className={styles.question}>Inflation Assumption</p>
                    <div className={styles.textbox}>{scenarioData.inflationAssumption}</div>

                    <p className={styles.question}>Retirement Accounts Initial Limit on Annual Contributions</p>
                    <p className={styles.question}>Pre-Tax</p>
                    <div className={styles.textbox}>22,500</div>

                    <p className={styles.question}>After-Tax</p>
                    <div className={styles.textbox}>17,550</div>

                    <h2>Spending Strategy</h2>
                    <p className={styles.description}>
                        Specify the order of discretionary expenses to be paid as cash allows.
                    </p>

                    <div className={styles.listBox}>
                        {orderedSpendingStrategy.map((strategy, index) => (
                            <div key={index} className={styles.draggableItem}>
                                <div className={styles.icon}>
                                    <CgMenuGridO size={20} />
                                    <span className={styles.draggableItemText}>{strategy.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>


                    <h2>Expense Withdrawal Strategy</h2>
                    <p className={styles.description}>
                        Specify the order in which the set of investments should be sold when cash is insufficient.
                    </p>
                    <div className={styles.listBox}>
                        {orderedExpenseWithdrawalStrategy.map((strategy, index) => (
                            <div key={index} className={styles.draggableItem}>
                                <div className={styles.icon}>
                                    <CgMenuGridO size={20} />
                                    <p className={styles.draggableItemText}>{strategy.name}</p>
                                </div>
                                <p className={styles.lightText}> Value: {strategy.value} </p>
                                <p className={styles.lightText}> Tax Status: {strategy.taxStatus} </p>


                            </div>
                        ))}
                    </div>

                    <h2>Required Minimum Distribution Strategy</h2>
                    <p className={styles.description}>
                        Specify the order in which investments should be transferred from pre-tax retirement accounts to non-retirement accounts when a Required Minimum Distribution (RMD) is triggered.
                    </p>

                    {orderedRMDStrategy?.map((strategy, index) => (
                        <div key={index} className={styles.draggableItem}>
                            <div className={styles.icon}>
                                <CgMenuGridO size={20} />
                                <p className={styles.draggableItemText}>{strategy.name}</p>
                            </div>
                            <p className={styles.lightText}> Value: {strategy.value} </p>
                            <p className={styles.lightText}> Tax Status: {strategy.taxStatus} </p>


                        </div>
                    ))}

                    <h2>Roth Conversion Strategy & Optimizer</h2>
                    <p className={styles.description}>
                        Specify the order in which investments should be transferred from pre-tax to after-tax retirement accounts when a conversion is triggered.
                    </p>

                    {orderedRothStrategy?.map((strategy, index) => (
                        <div key={index} className={styles.draggableItem}>
                            <div className={styles.icon}>
                                <CgMenuGridO size={20} />
                                <p className={styles.draggableItemText}>{strategy.name}</p>
                            </div>
                            <p className={styles.lightText}> Value: {strategy.value} </p>
                            <p className={styles.lightText}> Tax Status: {strategy.taxStatus} </p>

                        </div>
                    ))}

                    <p className={styles.question}>Roth Conversion Optimizer</p>
                    {(scenarioData.startYearRothOptimizer !== undefined) ? (
                        <div>
                            <div className={styles.icon}>
                                <BsToggleOn size={30} /><p className={styles.iconText}>Enabled</p>
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

                        </div>
                    ) : (
                        <div className={styles.icon}>
                            <BsToggleff size={30} /><p className={styles.iconText}>Disabled</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ViewScenario;
