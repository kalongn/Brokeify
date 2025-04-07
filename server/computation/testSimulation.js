//Hello reader
//This file tests the simulation algorithm
//This file in not essential to the program, you don't need to read it

import mongoose from "mongoose";
import 'dotenv/config'

import DistributionController from "../db/controllers/DistributionController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import InvestmentController from "../db/controllers/InvestmentController.js";
import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import UserController from "../db/controllers/UserController.js";

import RMDTableController from "../db/controllers/RMDTableController.js";
import TaxController from "../db/controllers/TaxController.js";
import ResultController from "../db/controllers/ResultController.js";
import SimulationController from "../db/controllers/SimulationController.js";

import { simulate } from "./simulator.js";
import { validateRun } from "./planValidator.js";
import { parseAndSaveYAML } from "../yaml_parsers/scenarioParser.js";
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
            value: 40000,
            taxStatus: "PRE_TAX_RETIREMENT"
        });
        const testInvestment3 = await InvestmentFactory.create({
            value: 50000,
            taxStatus: "AFTER_TAX_RETIREMENT"
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
            duration: 100,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            assetAllocationType: "GLIDE",
            percentageAllocations: [[0.3, 0.2], [0.5, 0.5], [0.2, 0.3]],
            allocatedInvestments: [testInvestment1, testInvestment2, testInvestment3],
            maximumCash: 1000,
            taxStatus: "NON_RETIREMENT"
        });

        const InvestEvent = await EventFactory.create("INVEST", {
            name: "Invest",
            description: "Invest in the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 100,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", {
                value:
                    1
            }),
            assetAllocationType: "GLIDE",
            percentageAllocations: [[0.3, 0.2], [0.5, 0.5], [0.2, 0.3]],
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
            amount: 10000,
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
            duration: 100,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            amount: 1000,
            expectedAnnualChange: 0.05,
            expectedAnnualChangeDistribution: await DistributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
            isinflationAdjusted: true,
            userContributions: 100,
            spouseContributions: 0,
            isDiscretionary: true
        });
        const ExpenseEvent2 = await EventFactory.create("EXPENSE", {
            name: "Expense2",
            description: "Expense from the portfolio",
            startYear: 2021,
            startYearTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
            duration: 100,
            durationTypeDistribution: await DistributionFactory.create("FIXED_AMOUNT", { value: 1 }),
            amount: 10,
            expectedAnnualChange: .05,
            expectedAnnualChangeDistribution: await DistributionFactory.create("NORMAL_PERCENTAGE", { mean: 0.05, standardDeviation: 0.02 }),
            isinflationAdjusted: true,
            userContributions: 100,
            spouseContributions: 0,
            isDiscretionary: false
        });

        const testScenario = await factory.create({
            name: "Test Scenario",
            filingStatus: "SINGLE",
            userBirthYear: 1990,
            spouseBirthYear: 1990,
            userLifeExpectancy: 90,
            spouseLifeExpectancy: 90,
            investmentTypes: [testInvestmentType],
            events: [RebalanceEvent, InvestEvent, IncomeEvent, ExpenseEvent, ExpenseEvent2],
            inflationAssumption: 0.02,
            inflationAssumptionDistribution: await DistributionFactory.create("UNIFORM_PERCENTAGE", { lowerBound: 0.01, upperBound: 0.03 }),
            annualPreTaxContributionLimit: 19500,
            annualPostTaxContributionLimit: 100,
            financialGoal: 1000000,
            orderedSpendingStrategy: [IncomeEvent, ExpenseEvent],
            orderedExpenseWithdrawalStrategy: [testInvestment1, testInvestment2, testInvestment3],
            orderedRMDStrategy: [testInvestment1, testInvestment2, testInvestment3],
            orderedRothStrategy: [testInvestment1, testInvestment2, testInvestment3],
            startYearRothOptimizer: 2021,
            endYearRothOptimizer: 2070
        });
        //console.log(testScenario);

        const scenarios = await factory.readAll();
        // console.log(scenarios);

        const scenario = await factory.read(scenarios[0].id);
        return scenario;
        // console.log(scenario);

        // await factory.update(scenario.id, { name: "New Scenario" });
        // const updatedScenario = await factory.read(scenario.id);
        // console.log(updatedScenario);

        // await factory.delete(updatedScenario.id);
        // const deletedScenario = await factory.read(updatedScenario.id);
        // console.log(deletedScenario);
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
        //console.log(rmd);

        let oneRmd = await factory.read();
        //console.log(oneRmd);
        return oneRmd;


    } catch (error) {
        console.error(error);
    }
}

const testTax = async (i) => {

    const factory = new TaxController();

    try {
        if (i == 1) {
            const federalIncomeTax = await factory.create("FEDERAL_INCOME", {
                filingStatus: "SINGLE",
                taxBrackets: [
                    { lowerBound: 0, upperBound: 9875, rate: 0.1 },
                    { lowerBound: 9876, upperBound: 40125, rate: 0.12 },
                    { lowerBound: 40126, upperBound: 85525, rate: 0.22 },
                    { lowerBound: 85526, upperBound: 163300, rate: 0.24 },
                    { lowerBound: 163301, upperBound: 207350, rate: 0.32 },
                    { lowerBound: 207351, upperBound: 518400, rate: 0.35 },
                    { lowerBound: 518401, upperBound: Infinity, rate: 0.37 }
                ]
            });
            //console.log(federalIncomeTax);
            return federalIncomeTax;
        }
        else if (i == 2) {

            const stateIncomeTax = await factory.create("STATE_INCOME", {
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
            //console.log(stateIncomeTax);
            return stateIncomeTax;
        }
        else if (i == 3) {
            const federalStandardDeduction = await factory.create("FEDERAL_STANDARD", {
                filingStatus: "SINGLE",
                standardDeduction: 12400
            });
            //console.log(federalStandardDeduction);
            return federalStandardDeduction;
        }
        else if (i == 4) {
            const stateStandardDeduction = await factory.create("STATE_STANDARD", {
                filingStatus: "SINGLE",
                state: "CA",
                standardDeduction: 4601
            });
            ///console.log(stateStandardDeduction);
            return stateStandardDeduction;
        }

        else if (i == 5) {
            const capitalGainTax = await factory.create("CAPITAL_GAIN", {
                filingStatus: "SINGLE",
                taxBrackets: [
                    { lowerBound: 0, upperBound: 40000, rate: 0 },
                    { lowerBound: 40001, upperBound: 441450, rate: 0.15 },
                    { lowerBound: 441451, upperBound: Infinity, rate: 0.2 }
                ]
            });
            //console.log(capitalGainTax);
            return capitalGainTax;
        }



    } catch (error) {
        console.error(error);
    }
}



const populateDB = async () => {
    const factory = new ScenarioController();
    
    const scenarioID = await parseAndSaveYAML("../yaml_files/scenario.yaml");
    const scenario1 = await factory.read(scenarioID);
    console.log(scenario1);
    const res1 = await connection.dropDatabase();
    return;
    const RMDTable = await testRMDTable();

    const federalIncomeTax = await testTax(1);
    const stateIncomeTax = await testTax(2);
    const federalStandardDeduction = await testTax(3);
    const capitalGainTax = await testTax(5);
    const scenario = await testScenario();
    //const scenario = await testScenario();
    //console.log(scenario);

    console.log('====================== Simulation Test =====================');
    //await simulate(scenario, federalIncomeTax, stateIncomeTax, federalStandardDeduction, stateStandardDeduction, capitalGainTax, RMDTable);
    try {
        await validateRun(scenario.id, 1, stateIncomeTax.id, "GUEST");
    }
    catch (err) {
        const res = await connection.dropDatabase();
        throw (err);
    }
    //drop all objects in database
    const res = await connection.dropDatabase();
    console.log(res);
};
