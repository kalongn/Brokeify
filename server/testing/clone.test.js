

import { test, expect } from '@playwright/test';
import { sample, calculateTaxes,adjustEventAmount, updateTaxBracketsForInflation, updateContributionLimitsForInflation, shouldPerformRMD} from '../computation/simulator';
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
test('event clone test', () => {
    
});
test('simulation clone test', () => {
  
});