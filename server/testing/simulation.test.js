

import { test, expect } from '@playwright/test';
import { sample } from '../computation/simulator';
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
  const result = await sample(0, a.id);
  expect(result).toBe(100);
});
test('sample fixed percentage test', async () => {
  const a = await distributionFactory.create("FIXED_PERCENTAGE", { value: 0.05 });
  const result = await sample(0, a.id);
  expect(result).toBe(0.05);
});
test('sample uniform amount test', async () => {  //test SAMPLE_RUNS tests are in range
  const a = await distributionFactory.create("UNIFORM_AMOUNT", { lowerBound: 10, upperBound: 100});
  const result = await sample(0, a.id);
  expect(result).toBeGreaterThanOrEqual(10);
  expect(result).toBeLessThanOrEqual(100);
});
test('sample uniform percentage test', async() => {
  const a = await distributionFactory.create("UNIFORM_PERCENTAGE", { lowerBound: 0.01, upperBound: 0.03});
  const result = await sample(0, a.id);
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
    const res =  await sample(0, distribution.id);
    results.push(res);
  }
  //get mean
  const sum = results.reduce((acc, num) => acc + num, 0);
  const mean = sum / results.length;
  const buffer = 3 * (distribution.standardDeviation / Math.sqrt(distribution.mean))
  const upperbound = distribution.mean + buffer;
  const lowerbound = distribution.mean - buffer;
  expect(mean).toBeGreaterThanOrEqual(lowerbound);
  expect(mean).toBeLessThanOrEqual(upperbound);

});
test('sample normal percentage test', async () => {
  const distribution = await distributionFactory.create("NORMAL_PERCENTAGE", { mean: .05, standardDeviation: .02});
  const results = [];
  //take sample
  for(let i=0;i<SAMPLE_RUNS;i++){
    const res =  await sample(0, distribution.id);
    results.push(res);
  }
  //get mean
  const sum = results.reduce((acc, num) => acc + num, 0);
  const mean = sum / results.length;
  const buffer = 3 * (distribution.standardDeviation / Math.sqrt(distribution.mean))
  const upperbound = distribution.mean + buffer;
  const lowerbound = distribution.mean - buffer;
  expect(mean).toBeGreaterThanOrEqual(lowerbound);
  expect(mean).toBeLessThanOrEqual(upperbound);
});
test('calculate taxes', () => {
  
});
test('test updating tax brackets for inflation', () => {
  
});
test('test update Contribution Limits For Inflation', () => {
  
});
test('test should perform rmd', () => {
  
});
test('test update event amount', () => {
  
});

