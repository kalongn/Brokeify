

import { test, expect } from '@playwright/test';
import { connectToDatabase,closeDatabaseConnection } from './utils.js';

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
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();
const taxFactory = new TaxController();
const simulationFactory = new SimulationController();
const distributionFactory = new DistributionController();
const resultFactory = new ResultController();
const SAMPLE_RUNS = 1000;
test.beforeAll(async () => {
    await connectToDatabase();
});
test.afterAll(async () => {
    await closeDatabaseConnection();
});
test('investment clone test', async () => {
    const testInvestment1 = await investmentFactory.create({
        value: 10000,
        taxStatus: "NON_RETIREMENT"
    });
    const clonedID = await investmentFactory.clone(testInvestment1.id);
    const clonedInv = await investmentFactory.read(clonedID);
    expect(testInvestment1.id).not.toEqual(clonedInv.id);
    expect(testInvestment1.value).toEqual(clonedInv.value);
    expect(testInvestment1.taxStatus).toEqual(clonedInv.taxStatus);
});
test('investment type clone test', async () => {
    
    const testInvestmentType = await investmentTypeFactory.create({
        name: "Fixed Income",
        description: "Fixed income investments pay a fixed rate of return on a fixed schedule.",
        expectedAnnualReturn: 0.05,
        expectedAnnualReturnDistribution: await distributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
        expenseRatio: 0.01,
        expectedAnnualIncome: 1000,
        expectedAnnualIncomeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 1000 }),
        taxability: true,
        investments: []
    });
    const clonedID = await investmentTypeFactory.clone(testInvestmentType.id);
    const clonedInv = await investmentTypeFactory.read(clonedID);
    expect(testInvestmentType.id).not.toEqual(clonedInv.id);
    expect(testInvestmentType.name).toEqual(clonedInv.name);
    expect(testInvestmentType.description).toEqual(clonedInv.description);
    expect(testInvestmentType.expectedAnnualReturn).toEqual(clonedInv.expectedAnnualReturn);
    expect(testInvestmentType.expectedAnnualReturnDistribution.id.toString()).toEqual(clonedInv.expectedAnnualReturnDistribution.toString());
    expect(testInvestmentType.expenseRatio).toEqual(clonedInv.expenseRatio);
    expect(testInvestmentType.expectedAnnualIncome).toEqual(clonedInv.expectedAnnualIncome);
    expect(testInvestmentType.expectedAnnualIncomeDistribution.id.toString()).toEqual(clonedInv.expectedAnnualIncomeDistribution.toString());
    expect(testInvestmentType.taxability).toEqual(clonedInv.taxability);
    expect(testInvestmentType.investments).toEqual(clonedInv.investments);

});
test('event clone test', async () => {
    const event = await eventFactory.create("REBALANCE", {
        name: "Rebalance",
        description: "Rebalance the portfolio",
        startYear: 2021,
        startYearTypeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
        duration: 100,
        durationTypeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 1 }),
        assetAllocationType: "GLIDE",
        percentageAllocations: [[0.3, 0.2], [0.5, 0.5], [0.2, 0.3]],
        allocatedInvestments: [],
        taxStatus: "NON_RETIREMENT"
    });
    
    const clonedID = await eventFactory.clone(event.id);
    const clonedEvent = await eventFactory.read(clonedID);
    expect(event.id).not.toEqual(clonedEvent.id);
    expect(event.name).toEqual(clonedEvent.name);
    expect(event.description).toEqual(clonedEvent.description);
    expect(event.startYear).toEqual(clonedEvent.startYear);
    expect(event.startYearTypeDistribution.id.toString()).toEqual(clonedEvent.startYearTypeDistribution.toString());
    expect(event.duration).toEqual(clonedEvent.duration);
    expect(event.durationTypeDistribution.id.toString()).toEqual(clonedEvent.durationTypeDistribution.toString());
    expect(event.assetAllocationType).toEqual(clonedEvent.assetAllocationType);
    expect(event.percentageAllocations).toEqual(clonedEvent.percentageAllocations);
    expect(event.allocatedInvestments).toEqual(clonedEvent.allocatedInvestments);
    expect(event.taxStatus).toEqual(clonedEvent.taxStatus);
});
test('scenario clone test', async () => {
    const testInvestment1 = await investmentFactory.create({
        value: 10000,
        taxStatus: "NON_RETIREMENT"
    });
    const testInvestmentType = await investmentTypeFactory.create({
        name: "Fixed Income",
        description: "Fixed income investments pay a fixed rate of return on a fixed schedule.",
        expectedAnnualReturn: 0.05,
        expectedAnnualReturnDistribution: await distributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
        expenseRatio: 0.01,
        expectedAnnualIncome: 1000,
        expectedAnnualIncomeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 1000 }),
        taxability: true,
        investments: [testInvestment1]
    });
    const InvestEvent = await eventFactory.create("INVEST", {
        name: "Invest",
        description: "Invest in the portfolio",
        startYear: 2021,
        startYearTypeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
        duration: 100,
        durationTypeDistribution: await distributionFactory.create("FIXED_AMOUNT", {
            value:
                1
        }),
        assetAllocationType: "FIXED",
        percentageAllocations: [1.0],
        allocatedInvestments: [testInvestment1],
        maximumCash: 1000,
    });
    const testScenario = await scenarioFactory.create({
        name: "Test Scenario",
        filingStatus: "SINGLE",
        userBirthYear: 1990,
        spouseBirthYear: 1990,
        userLifeExpectancy: 90,
        spouseLifeExpectancy: 90,
        investmentTypes: [testInvestmentType],
        events: [InvestEvent],
        inflationAssumption: 0.02,
        inflationAssumptionDistribution: await distributionFactory.create("UNIFORM_PERCENTAGE", { lowerBound: 0.01, upperBound: 0.03 }),
        annualPreTaxContributionLimit: 19500,
        annualPostTaxContributionLimit: 100,
        financialGoal: 1000000,
        orderedSpendingStrategy: [],
        orderedExpenseWithdrawalStrategy: [testInvestment1],
        orderedRMDStrategy: [testInvestment1],
        orderedRothStrategy: [testInvestment1],
        startYearRothOptimizer: 2021,
        endYearRothOptimizer: 2070
    });
    const clonedID = await scenarioFactory.clone(testScenario.id);
    const clonedScenario = await scenarioFactory.read(clonedID);


    //need to check all values are equal, but investment IDs are different

    //first: check all values are right:
    expect(testScenario.id).not.toEqual(clonedScenario.id);
    expect(`${testScenario.name.toString()} CLONE`).toEqual(`${clonedScenario.name}`);
    expect(testScenario.filingStatus).toEqual(clonedScenario.filingStatus);
    expect(testScenario.userBirthYear).toEqual(clonedScenario.userBirthYear);
    expect(testScenario.spouseBirthYear).toEqual(clonedScenario.spouseBirthYear);
    expect(testScenario.userLifeExpectancy).toEqual(clonedScenario.userLifeExpectancy);
    expect(testScenario.inflationAssumption).toEqual(clonedScenario.inflationAssumption);
    expect(testScenario.inflationAssumptionDistribution.id.toString()).toEqual(clonedScenario.inflationAssumptionDistribution.toString());
    expect(testScenario.annualPreTaxContributionLimit).toEqual(clonedScenario.annualPreTaxContributionLimit);
    expect(testScenario.annualPostTaxContributionLimit).toEqual(clonedScenario.annualPostTaxContributionLimit);
    expect(testScenario.financialGoal).toEqual(clonedScenario.financialGoal);
    expect(testScenario.startYearRothOptimizer).toEqual(clonedScenario.startYearRothOptimizer);
    expect(testScenario.endYearRothOptimizer).toEqual(clonedScenario.endYearRothOptimizer);
    

    //now, check that referenced events, investment types, and investments are different

    //check events and investments in events:
    for(const i in clonedScenario.events){
        expect(testScenario.events[i].id.toString()).not.toEqual(clonedScenario.events[i].toString());
        //check each investment if event is rebalance or invest
        
        const originalEvent = await eventFactory.read(testScenario.events[i].id);
        const clonedEvent = await eventFactory.read(clonedScenario.events[i]);
        //console.log(originalEvent)

        if(originalEvent.eventType=="INVEST"||originalEvent.eventType=="REBALANCE"){
            for(const i in originalEvent.allocatedInvestments){
                expect(originalEvent.allocatedInvestments[i]).not.toEqual(clonedEvent.allocatedInvestments[i]);
            }
        }
    }
    //check similar for investment types
    for(const i in clonedScenario.investmentTypes){
        expect(testScenario.investmentTypes[i].id.toString()).not.toEqual(clonedScenario.investmentTypes[i].toString());
        //check each investment if event is rebalance or invest
        
        const original = await investmentTypeFactory.read(testScenario.investmentTypes[i].id);
        const cloned = await investmentTypeFactory.read(clonedScenario.investmentTypes[i]);
        for(const i in original.investments){
            expect(original.investments[i]).not.toEqual(cloned.investments[i]);
        }
        
    }
    //check orderedSpendingStrategy:
    for(const i in clonedScenario.orderedSpendingStrategy){
        expect(testScenario.orderedSpendingStrategy[i].id.toString()).not.toEqual(clonedScenario.orderedSpendingStrategy[i].toString());
        //check each investment if event is rebalance or invest
        
        const originalEvent = await eventFactory.read(testScenario.orderedSpendingStrategy[i].id);
        const clonedEvent = await eventFactory.read(clonedScenario.orderedSpendingStrategy[i]);
        
        if(originalEvent.eventType=="INVEST"||originalEvent.eventType=="REBALANCE"){
            for(const i in originalEvent.allocatedInvestments){
                expect(originalEvent.allocatedInvestments[i]).not.toEqual(clonedEvent.allocatedInvestments[i]);
            }
        }
    }
    //check orderedExpenseWithdrawalStrategy
    for(const i in clonedScenario.orderedExpenseWithdrawalStrategy){
        expect(testScenario.orderedExpenseWithdrawalStrategy[i].id.toString()).not.toEqual(clonedScenario.orderedExpenseWithdrawalStrategy[i].toString());
    }
    //check orderedRMDStrategy
    for(const i in clonedScenario.orderedRMDStrategy){
        expect(testScenario.orderedRMDStrategy[i].id.toString()).not.toEqual(clonedScenario.orderedRMDStrategy[i].toString());
    }
    //check orderedRothStrategy
    for(const i in clonedScenario.orderedRothStrategy){
        expect(testScenario.orderedRothStrategy[i].id.toString()).not.toEqual(clonedScenario.orderedRothStrategy[i].toString());
    }
    





});