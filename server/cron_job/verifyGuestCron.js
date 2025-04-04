// Verify guest users being deleted every 4 hours by passing in old date

import mongoose from "mongoose";
import 'dotenv/config'

import UserController from "../db/controllers/UserController.js";
import TaxController from "../db/controllers/TaxController.js";
import DistributionController from "../db/controllers/DistributionController.js";
import InvestmentController from "../db/controllers/InvestmentController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import SimulationController from "../db/controllers/SimulationController.js";
import ResultController from "../db/controllers/ResultController.js";

const scenarioController = new ScenarioController();
const userController = new UserController();
const taxController = new TaxController();
const DistributionFactory = new DistributionController();
const InvestmentFactory = new InvestmentController();
const InvestmentTypeFactory = new InvestmentTypeController();
const EventFactory = new EventController();
const simulationController = new SimulationController();
const resultController = new ResultController();

async function init() {
    try {
        const caliSingleStateTax = await taxController.create("STATE_INCOME", {
            filingStatus: "SINGLE",
            state: "CA",
            taxBrackets: [
                { lowerBound: 0, upperBound: 8544, rate: 0.01 },
                { lowerBound: 8545, upperBound: 20255, rate: 0.02 },
                { lowerBound: 20256, upperBound: 31969, rate: 0.04 },
                { lowerBound: 31970, upperBound: 44377, rate: 0.06 },
                { lowerBound: 44378, upperBound: 56085, rate: 0.08 },
                { lowerBound: 56086, upperBound: 286492, rate: 0.093 },
                { lowerBound: 286493, upperBound: 343788, rate: 0.103 },
                { lowerBound: 343789, upperBound: 572980, rate: 0.113 },
                { lowerBound: 572981, upperBound: Infinity, rate: 0.123 }
            ]
        });

        const washingtonSingleStateTax = await taxController.create("STATE_INCOME", {
            filingStatus: "SINGLE",
            state: "WA",
            taxBrackets: [
                { lowerBound: 0, upperBound: Infinity, rate: 0 }
            ]
        });

        const testInvestment1 = await InvestmentFactory.create({
            value: 10000,
            taxStatus: "NON_RETIREMENT"
        });

        const testInvestment2 = await InvestmentFactory.create({
            value: 20000,
            taxStatus: "NON_RETIREMENT"
        });

        const testInvestment3 = await InvestmentFactory.create({
            value: 30000,
            taxStatus: "NON_RETIREMENT"
        });

        const testInvestmentType1 = await InvestmentTypeFactory.create({
            name: "Fixed Income",
            description: "Fixed income investments pay a fixed rate of return on a fixed schedule.",
            expectedAnnualReturn: 0.05,
            expectedAnnualReturnDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
            expenseRatio: 0.01,
            expectedAnnualIncome: 1000,
            expectedAnnualIncomeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1000 }),
            taxability: true,
            investments: [testInvestment1, testInvestment2, testInvestment3]
        });

        const testInvestment4 = await InvestmentFactory.create({
            value: 15000,
            taxStatus: "NON_RETIREMENT"
        });
        const testInvestment5 = await InvestmentFactory.create({
            value: 25000,
            taxStatus: "NON_RETIREMENT"
        });

        const testInvestmentType2 = await InvestmentTypeFactory.create({
            name: "Equity",
            description: "Equity investments are shares of ownership in a company.",
            expectedAnnualReturn: 0.08,
            expectedAnnualReturnDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.08 }),
            expenseRatio: 0.02,
            expectedAnnualIncome: 2000,
            expectedAnnualIncomeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2000 }),
            taxability: true,
            investments: [testInvestment4, testInvestment5]
        });


        const RebalanceEvent = await EventFactory.create("REBALANCE", {
            name: "Rebalance",
            description: "Rebalance the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 1,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            assetAllocationType: "GLIDE",
            percentageAllocations: [[0.6, 0.4], [0.5, 0.5], [0.4, 0.6]],
            allocatedInvestments: [testInvestment1, testInvestment2, testInvestment3],
            maximumCash: 1000,
            taxStatus: "NON_RETIREMENT"
        });

        const InvestEvent = await EventFactory.create("INVEST", {
            name: "Invest",
            description: "Invest in the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 1,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", {
                value:
                    1
            }),
            assetAllocationType: "FIXED",
            percentageAllocations: [[0.6], [0.5], [0.4]],
            allocatedInvestments: [testInvestment1, testInvestment2, testInvestment3],
            maximumCash: 1000,
        });

        const IncomeEvent = await EventFactory.create("INCOME", {
            name: "Income",
            description: "Income from the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 1,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            amount: 1000,
            expectedAnnualChange: 0.05,
            expectedAnnualChangeDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
            isinflationAdjusted: true,
            userContributions: 100,
            spouseContributions: 0,
            isSocialSecurity: true
        });

        const ExpenseEvent = await EventFactory.create("EXPENSE", {
            name: "Expense",
            description: "Expense from the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 1,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            amount: 1000,
            expectedAnnualChange: 0.05,
            expectedAnnualChangeDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
            isinflationAdjusted: true,
            userContributions: 100,
            spouseContributions: 0,
            isDiscretionary: true
        });

        const testScenario = await scenarioController.create({
            name: "Test Scenario",
            filingStatus: "MARRIEDJOINT",
            userBirthYear: 1990,
            spouseBirthYear: 1990,
            userLifeExpectancy: 90,
            userLifeExpectancyDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 90 }),
            spouseLifeExpectancy: 90,
            spouseLifeExpectancyDistribution: await DistributionFactory.create("NORMAL_AMOUNT", { mean: 90, standardDeviation: 5 }),
            stateOfResidence: "CA",
            investmentTypes: [testInvestmentType1, testInvestmentType2],
            events: [RebalanceEvent, InvestEvent, IncomeEvent, ExpenseEvent],
            inflationAssumption: 0.02,
            inflationAssumptionDistribution: await DistributionFactory.create("NORMAL_PERCENTAGE", {
                mean: 0.02,
                standardDeviation: 0.005
            }),
            annualPostTaxContributionLimit: 6000,
            financialGoal: 1000000,
            orderedSpendingStrategy: [IncomeEvent, ExpenseEvent],
            orderedExpenseWithdrawalStrategy: [testInvestment1, testInvestment2, testInvestment3],
            orderedRMDStrategy: [testInvestment1, testInvestment2, testInvestment3],
            orderedRothStrategy: [testInvestment1, testInvestment2, testInvestment3],
            startYearRothOptimizer: 2021,
            endYearRothOptimizer: 2021
        });

        const resultOne = await resultController.create({
            yearlyResults: [
                {
                    year: 2021,
                    investmentValues: [
                        { name: testInvestment1._id, values: 10000 },
                        { name: testInvestment2._id, values: 20000 },
                        { name: testInvestment3._id, values: 30000 }
                    ],
                    incomeByEvent: [
                        { name: IncomeEvent._id, values: 1000 }
                    ],
                    totalIncome: 1000,
                    totalExpense: 1000,
                    totalTax: 0,
                    earlyWithdrawalTax: 0,
                    totalDiscretionaryExpenses: 0,
                    isViolated: false
                }
            ]
        });
        const resultTwo = await resultController.create({
            yearlyResults: [
                {
                    year: 2022,
                    investmentValues: [
                        { name: testInvestment1._id, values: 11000 },
                        { name: testInvestment2._id, values: 22000 },
                        { name: testInvestment3._id, values: 33000 }
                    ],
                    incomeByEvent: [
                        { name: IncomeEvent._id, values: 1100 }
                    ],
                    totalIncome: 1100,
                    totalExpense: 1100,
                    totalTax: 0,
                    earlyWithdrawalTax: 0,
                    totalDiscretionaryExpenses: 0,
                    isViolated: false
                }
            ]
        });

        const testSimulation = await simulationController.create({
            scenario: testScenario._id,
            results: [resultOne._id, resultTwo._id]
        });

        const theDayBefore = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const user = await userController.create({
            ownerScenarios: [],
            userSpecificTaxes: [],
            userSimulations: [],
            lastLogin: theDayBefore,
        });


        user.userSpecificTaxes.push(caliSingleStateTax._id);
        user.userSpecificTaxes.push(washingtonSingleStateTax._id);
        user.ownerScenarios.push(testScenario._id);
        user.userSimulations.push(testSimulation._id);
        await userController.update(user._id, user)

        await userController.create({
            ownerScenarios: [],
            userSpecificTaxes: [],
            userSimulations: [],
            lastLogin: theDayBefore,
        });
        await userController.create({
            ownerScenarios: [],
            userSpecificTaxes: [],
            userSimulations: [],
            lastLogin: theDayBefore,
        });
        await userController.create({
            ownerScenarios: [],
            userSpecificTaxes: [],
            userSimulations: [],
            lastLogin: theDayBefore,
        });
        await userController.create({
            ownerScenarios: [],
            userSpecificTaxes: [],
            userSimulations: [],
            lastLogin: theDayBefore,
        });
    } catch (error) {
        console.error("Error initializing user:", error);
    }
}

const DB_ADDRESS = `${process.env.DB_ADDRESS}`;

mongoose.connect(DB_ADDRESS);
const connection = mongoose.connection;

connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

connection.once('open', async () => {
    await init();
    connection.close();
    process.exit();
});
