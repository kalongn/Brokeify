

import { test, expect } from '@playwright/test';
import { sample, calculateTaxes,adjustEventAmount, updateTaxBracketsForInflation, updateContributionLimitsForInflation, shouldPerformRMD} from '../computation/simulationHelper.js';
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
const SAMPLE_RUNS = 100;
test.beforeAll(async () => {
  await connectToDatabase();
});
test.afterAll(async () => {
  await closeDatabaseConnection();
});
test('sample fixed amount test', async () => {
  const a = await distributionFactory.create("FIXED_AMOUNT", { value: 100 });
  const result = await sample(0, a._id);
  expect(result).toBe(100);
});
test('sample fixed percentage test', async () => {
  const a = await distributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 });
  const result = await sample(0, a._id);
  expect(result).toBe(0.05);
});
test('sample uniform amount test', async () => {  //test SAMPLE_RUNS tests are in range
  const a = await distributionFactory.create("UNIFORM_AMOUNT", { lowerBound: 10, upperBound: 100});
  const result = await sample(0, a._id);
  expect(result).toBeGreaterThanOrEqual(10);
  expect(result).toBeLessThanOrEqual(100);
});
test('sample uniform percentage test', async() => {
  const a = await distributionFactory.create("UNIFORM_PERCENTAGE", { lowerBound: 0.01, upperBound: 0.03});
  const result = await sample(0, a._id);
  expect(result).toBeGreaterThanOrEqual(0.01);
  expect(result).toBeLessThanOrEqual(0.03);
});
//test that mean of SAMPLE_RUNS is mean +- 3 * σ/√n stddevs via central limit theorem
//the chance that it is outside of this range is ~0.03%
test('sample normal amount test', async () => { 
  const distribution = await distributionFactory.create("NORMAL_AMOUNT", { mean: 100, standardDeviation: 10});
  const results = [];
  //take sample
  for(let i=0;i<SAMPLE_RUNS;i++){
    const res =  await sample(0, distribution._id);
    results.push(res);
  }
  //get mean
  let sum = 0;
  for(const i in results){
    
    sum+=results[i];
  }
  const mean = sum / SAMPLE_RUNS;
  const buffer = 100 * (distribution.standardDeviation / Math.sqrt(SAMPLE_RUNS))
  const upperbound = distribution.mean + buffer;
  const lowerbound = distribution.mean - buffer;
  expect(mean).toBeGreaterThanOrEqual(lowerbound);
  expect(mean).toBeLessThanOrEqual(upperbound);

});

test('calculate taxes', () => {
  //setup fed & state income taxes
  const federalIncomeTax = {
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
  }
  const stateIncomeTax = {
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
  };
  const capitalGainTax = {
    filingStatus: "SINGLE",
    taxBrackets: [
      { lowerBound: 0, upperBound: 40000, rate: 0 },
      { lowerBound: 40001, upperBound: 441450, rate: 0.15 },
      { lowerBound: 441451, upperBound: Infinity, rate: 0.2 }
    ]
  };
  const federalStandardDeduction = 12400;
  const curYearIncome = 100000;
  const curYearSS = 50000;
  const earlyWithdrawalAmount = 10000;
  const lastYearGains = 50000;
  //total taxes should be:
  //10000 * .1 = 1000 from early withdrawl
  // federal taxable income is 100000 - (50000 * .15) - 12400= 80100
  //with this, we expect full taxation of the first 2 brackets, 39974 on the 3rd
  // this is (9875*.1) + (30249*.12) + (39974*.22) = 13411.66
  //for state taxes, we do the same:
  //taxable state income is 100000 - 50000 = 50,000
  // (8544*.01) + ((20255-8545) * 0.02) + ((31969-20256) * 0.04) + ((44377-31970) * 0.06) + ((50000-44378) * 0.08) = 1982.34
  //for capital gains taxes:
  //10000 *  0.15 = 1500
  //total is 1000 + 13411.66 + 1500 + 1982.34 = 17894
  const result = calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction, curYearIncome, curYearSS, earlyWithdrawalAmount, lastYearGains, 0)
  expect(result.t).toBeGreaterThanOrEqual(17893); //allow some error
  expect(result.t).toBeLessThanOrEqual(17895);
});
test('test updating tax brackets for inflation', () => {
  const federalIncomeTax = {
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
  }
  const cloneTax = {
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
  }
  const inflationRate = .1;


  updateTaxBracketsForInflation(federalIncomeTax, inflationRate);
  

  for(const i in federalIncomeTax.taxBrackets){
    expect(federalIncomeTax.taxBrackets[i].lowerBound).toBeGreaterThanOrEqual((cloneTax.taxBrackets[i].lowerBound * (1+inflationRate))-2)//should be close
    if(federalIncomeTax.taxBrackets[i].upperBound!==Infinity){
      expect(federalIncomeTax.taxBrackets[i].upperBound).toBeGreaterThanOrEqual((cloneTax.taxBrackets[i].upperBound * (1+inflationRate))-2)
    }
  }
  
});
test('test update Contribution Limits For Inflation', async () => {
  let ptl = 19500;
  let atl = 100;
  const testScenario = await scenarioFactory.create({
    annualPostTaxContributionLimit: atl,
  });
  const inflationRate = .1;
  await updateContributionLimitsForInflation(testScenario, inflationRate);
  const res = await scenarioFactory.read(testScenario._id);
  
  expect(res.annualPostTaxContributionLimit).toBeCloseTo(atl*(1+inflationRate), 1);
});
test('test should perform rmd true', async() => {
  const currentYear = 0;
  const birthYear = 1950;

  const inv = {
    value: 10000,
    taxStatus: "NON_RETIREMENT"
  }
  const inv2 = {
    value: 10000,
    taxStatus: "PRE_TAX_RETIREMENT"
  }
  const invArray = [];
  invArray.push(inv);
  invArray.push(inv2);
  const ret = await shouldPerformRMD(currentYear, birthYear, invArray);
  expect(ret).toBeTruthy();
});
test('test should perform rmd false due to age', async () => {
  const currentYear = 0;
  const birthYear = 2020;

  const inv = {
    value: 10000,
    taxStatus: "NON_RETIREMENT"
  }
  const inv2 = {
    value: 10000,
    taxStatus: "PRE_TAX_RETIREMENT"
  }
  const invArray = [];
  invArray.push(inv);
  invArray.push(inv2);
  const ret = await shouldPerformRMD(currentYear, birthYear, invArray);
  expect(ret).toBeFalsy();
});
test('test should perform rmd false due to investments', async () => {
  const currentYear = 0;
  const birthYear = 1950;

  const inv = {
    value: 10000,
    taxStatus: "NON_RETIREMENT"
  }
  const inv2 = {
    value: 0,
    taxStatus: "PRE_TAX_RETIREMENT"
  }
  const inv3 = {
    value: 0,
    taxStatus: "AFTER_TAX_RETIREMENT"
  }
  const invArray = [];
  invArray.push(inv);
  invArray.push(inv2);
  invArray.push(inv3);
  const ret = await shouldPerformRMD(currentYear, birthYear, invArray);
  expect(ret).toBeFalsy();
});
test('test update event amount', async () => {
  const event = await eventFactory.create("INCOME", {
    name: "Income",
    description: "Income from the portfolio",
    startYear: 2021,
    startYearTypeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 2021 }),
    duration: 1000,
    durationTypeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 1000 }),
    amount: 10000,
    expectedAnnualChange: 0.05,
    expectedAnnualChangeDistribution: await distributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 }),
    isinflationAdjusted: true,
    userContributions: 1,
    spouseContributions: 0,
    isSocialSecurity: true
  });
  const initialAmount = event.amount;
  const inflationRate = .1;
  const testScenario = await scenarioFactory.create({
    filingStatus: "SINGLE",
  });


  await adjustEventAmount(event, inflationRate, testScenario, 1);
  const res = await eventFactory.read(event._id);
  const expected = initialAmount * (1+event.expectedAnnualChange) *(1+inflationRate);
  expect(res.amount).toBeGreaterThanOrEqual(expected-1);
  expect(res.amount).toBeLessThanOrEqual(expected+1);
});

