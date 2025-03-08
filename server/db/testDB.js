import mongoose from "mongoose";
import 'dotenv/config'

import DistributionController from "./controllers/DistributionController.js";
import InvestmentTypeController from "./controllers/InvestmentTypeController.js";
import InvestmentController from "./controllers/InvestmentController.js";
import EventController from "./controllers/EventController.js";
import ScenarioController from "./controllers/ScenarioController.js";
import UserController from "./controllers/UserController.js";

import RMDTableController from "./controllers/RMDTableController.js";

// Connect to MongoDB
const DB_ADDRESS = `${process.env.DB_ADDRESS}`;

mongoose.connect(DB_ADDRESS);
const connection = mongoose.connection;

connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

connection.once('open', async () => {
    await populateDB();
    connection.close();
    process.exit();
});

// Test of CRUD operations

const testDistruibution = async () => {
    const factory = new DistributionController();
    try {
        await factory.create("FIXED_AMOUNT", { value: 100 });
        await factory.create("FIXED_PERCENTAGE", { value: 0.1 });
        await factory.create("UNIFORM_AMOUNT", { lowerBound: 50, upperBound: 150 });
        await factory.create("UNIFORM_PERCENTAGE", { lowerBound: 0.05, upperBound: 0.15 });
        await factory.create("NORMAL_AMOUNT", { mean: 100, standardDeviation: 10 });
        await factory.create("NORMAL_PERCENTAGE", { mean: 0.1, standardDeviation: 0.01 });
        await factory.create("MARKOV_PERCENTAGE", {
            initialValue: 100,
            driftMu: 0.1,
            volatileSigma: 0.01,
            timeStepDeltaT: 0.01,
            randomEpsilon: await factory.create("NORMAL_PERCENTAGE", { mean: 0, standardDeviation: 0.01 })
        });

        const distributions = await factory.readAll();
        console.log(distributions);

        const distribution = await factory.read(distributions[0].id);
        console.log(distribution);

        await factory.update(distribution.id, { value: 200 });
        const updatedDistribution = await factory.read(distribution.id);
        console.log(updatedDistribution);

        await factory.delete(updatedDistribution.id);
        const deletedDistribution = await factory.read(updatedDistribution.id);
        console.log(deletedDistribution);
    } catch (error) {
        console.error(error);
    }
}

const testInvestment = async () => {
    const factory = new InvestmentController();
    try {
        await factory.create({
            value: 10000,
            taxStatus: "NON_RETIREMENT"
        });

        const investments = await factory.readAll();
        console.log(investments);

        const investment = await factory.read(investments[0].id);
        console.log(investment);

        await factory.update(investment.id, { value: 20000 });
        const updatedInvestment = await factory.read(investment.id);
        console.log(updatedInvestment);

        await factory.delete(updatedInvestment.id);
        const deletedInvestment = await factory.read(updatedInvestment.id);
        console.log(deletedInvestment);
    } catch (error) {
        console.error(error);
    }
}

const testInvestmentType = async () => {
    const factory = new InvestmentTypeController();
    const DistributionFactory = new DistributionController();
    const InvestmentFactory = new InvestmentController();

    try {

        const testInvestment = await InvestmentFactory.create({
            value: 10000,
            taxStatus: "NON_RETIREMENT"
        });

        await factory.create({
            name: "Fixed Income",
            description: "Fixed income investments pay a fixed rate of return on a fixed schedule.",
            expectedAnnualReturn: 0.05,
            expectedAnnualReturnDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
            expenseRatio: 0.01,
            expectedAnnualIncome: 1000,
            expectedAnnualIncomeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1000 }),
            taxability: true,
            investments: [testInvestment]
        });

        const investmentTypes = await factory.readAll();
        console.log(investmentTypes);

        const investmentType = await factory.read(investmentTypes[0].id);
        console.log(investmentType);

        await factory.update(investmentType.id, { name: "Equity" });
        const updatedInvestmentType = await factory.read(investmentType.id);
        console.log(updatedInvestmentType);

        await factory.delete(updatedInvestmentType.id);
        const deletedInvestmentType = await factory.read(updatedInvestmentType.id);
        console.log(deletedInvestmentType);
    } catch (error) {
        console.error(error);
    }
}

const testEvent = async () => {
    const factory = new EventController();
    const DistributionFactory = new DistributionController();
    const InvestmentFactory = new InvestmentController();
    const InvestmentTypeFactory = new InvestmentTypeController();

    try {
        const testInvestmentType = await InvestmentTypeFactory.create({
            name: "Fixed Income",
            description: "Fixed income investments pay a fixed rate of return on a fixed schedule.",
            expectedAnnualReturn: 0.05,
            expectedAnnualReturnDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
            expenseRatio: 0.01,
            expectedAnnualIncome: 1000,
            expectedAnnualIncomeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1000 }),
            taxability: true
        });

        const testInvestment1 = await InvestmentFactory.create({
            value: 10000,
            investmentType: testInvestmentType.id,
            taxStatus: "NON_RETIREMENT"
        });

        const testInvestment2 = await InvestmentFactory.create({
            value: 20000,
            investmentType: testInvestmentType.id,
            taxStatus: "NON_RETIREMENT"
        });

        const testInvestment3 = await InvestmentFactory.create({
            value: 30000,
            investmentType: testInvestmentType.id,
            taxStatus: "NON_RETIREMENT"
        });

        const RebalanceEvent = await factory.create("REBALANCE", {
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
        console.log(RebalanceEvent);

        const InvestEvent = await factory.create("INVEST", {
            name: "Invest",
            description: "Invest in the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 1,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            assetAllocationType: "FIXED",
            percentageAllocations: [[0.6], [0.5], [0.4]],
            allocatedInvestments: [testInvestment1, testInvestment2, testInvestment3],
            maximumCash: 1000,
        });
        console.log(InvestEvent);

        const IncomeEvent = await factory.create("INCOME", {
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
        console.log(IncomeEvent);

        const ExpenseEvent = await factory.create("EXPENSE", {
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
        console.log(ExpenseEvent);

        const events = await factory.readAll();
        console.log(events);

        const event = await factory.read(events[0].id);
        console.log(event);

        await factory.update(event.id, { name: "New Event" });
        const updatedEvent = await factory.read(event.id);
        console.log(updatedEvent);

        await factory.delete(updatedEvent.id);
        const deletedEvent = await factory.read(updatedEvent.id);
        console.log(deletedEvent);

        for (const event of await factory.readAll()) {
            await factory.delete(event.id);
        }
    } catch (error) {
        console.error(error);
    }
}

const testScenario = async () => {

    const factory = new ScenarioController();
    const DistributionFactory = new DistributionController();
    const InvestmentFactory = new InvestmentController();
    const InvestmentTypeFactory = new InvestmentTypeController();
    const EventFactory = new EventController();

    try {

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

        const testInvestmentType = await InvestmentTypeFactory.create({
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

        const testScenario = await factory.create({
            name: "Test Scenario",
            filingStatus: "SINGLE",
            userBirthYear: 1990,
            spouseBirthYear: 1990,
            userLifeExpectancy: 90,
            spouseLifeExpectancy: 90,
            investmentTypes: [testInvestmentType],
            events: [RebalanceEvent, InvestEvent, IncomeEvent, ExpenseEvent],
            inflationAssumption: 0.02,
            inflationAssumptionDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.02 }),
            annualPreTaxContributionLimit: 19500,
            annualPostTaxContributionLimit: 6000,
            financialGoal: 1000000,
            orderedSpendingStrategy: [IncomeEvent, ExpenseEvent],
            orderedExpenseWithdrawalStrategy: [testInvestment1, testInvestment2, testInvestment3],
            orderedRMDStrategy: [testInvestment1, testInvestment2, testInvestment3],
            orderedRothStrategy: [testInvestment1, testInvestment2, testInvestment3],
            startYearRothOptimizer: 2021,
            endYearRothOptimizer: 2021
        });
        console.log(testScenario);

        const scenarios = await factory.readAll();
        console.log(scenarios);

        const scenario = await factory.read(scenarios[0].id);
        console.log(scenario);

        await factory.update(scenario.id, { name: "New Scenario" });
        const updatedScenario = await factory.read(scenario.id);
        console.log(updatedScenario);

        await factory.delete(updatedScenario.id);
        const deletedScenario = await factory.read(updatedScenario.id);
        console.log(deletedScenario);
    } catch (error) {
        console.error(error);
    }
}

const testUser = async () => {
    const factory = new UserController();
    try {
        await factory.create({
            firstName: "John",
            lastName: "Doe",
            email: "",
            birthYear: 1990,
            googleId: "",
            picture: "",
            refreshToken: "",
            accessToken: "",
            permission: "GUEST",
            ownerScenarios: [],
            editorScenarios: [],
            viewerScenarios: [],
            userSpecificTaxes: [],
            userRuns: []
        });
    } catch (error) {
        console.error(error);
    }
}

const testRMDTable = async () => {

    const factory = new RMDTableController();

    try {
        const rmd = await factory.create({
            ages: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
            distributionPeriods: [27.4, 26.5, 25.6, 24.7, 23.8, 22.9, 22.0, 21.2, 20.3, 19.5]
        });
        console.log(rmd);

        let oneRmd = await factory.read();
        console.log(oneRmd);

        await factory.update({
            ages: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
            distributionPeriods: [27.4, 26.5, 25.6, 24.7, 23.8, 22.9, 22.0, 21.2, 20.3, 19.5, 18.7]
        });

        oneRmd = await factory.read();
        console.log(oneRmd);

    } catch (error) {
        console.error(error);
    }
}


const populateDB = async () => {
    // console.log('====================== Distribution Test ======================');
    // await testDistruibution();
    // console.log('====================== Distribution Test Done ======================');
    // console.log('====================== Investment Test =====================');
    // await testInvestment();
    // console.log('====================== Investment Test Done =====================');
    // console.log('====================== Investment Type Test =====================');
    // await testInvestmentType();
    // console.log('====================== Investment Type Test Done ======================');
    // console.log('====================== Event Test =====================');
    // await testEvent();
    // console.log('====================== Event Test Done =====================');
    // console.log('====================== Scenario Test =====================');
    // await testScenario();
    // console.log('====================== Scenario Test Done =====================');
    // console.log('====================== User Test =====================');
    // await testUser();
    // console.log('====================== User Test Done =====================');
    console.log('====================== RMD Table Test =====================');
    await testRMDTable();
    console.log('====================== RMD Table Test Done =====================');
};
