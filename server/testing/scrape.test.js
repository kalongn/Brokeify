
import { test, expect } from '@playwright/test';
import { scrapeFederalIncomeTaxBrackets, scrapeStandardDeductions, fetchCapitalGainsData, fetchRMDTable } from '../computation/scraper.js';
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

test.beforeAll(async () => {
    await connectToDatabase();
});
test.afterAll(async () => {
    await closeDatabaseConnection();
});

test('scrape federal income tax brackets', async () => {
    const res = await scrapeFederalIncomeTaxBrackets();
    
    //check that there are 4 tables
    expect(res.length).toBe(4);
    //check that rates are monotonically increasing
    for(const i in res.length){
        for(const j in res[i].length){
            if(j!==0){
                expect(res[i][j].rate).toBeGreaterThanOrEqual(res[i][j-1].rate);
            }
        }
    }
    //check that every high bound is greater than every low bound
    //check that the high bound of braxket x is 1 less than low bound of x+1 bracket
    for(const i in res.length){
        for(const j in res[i].length){
            
            expect(res[i][j].highBound).toBeGreaterThanOrEqual(res[i][j].lowBound);
            if(j!==0){
                expect(res[i][j].lowBound).toBe(res[i][j-1].highBound+1);
            }
        }
    }
});
test('scrape standard deductions', async () => {
    const res = await scrapeStandardDeductions();
    
    expect(res.length).toBe(3);
    for(const i in res.length){
        expect(res[i]).toHaveProperty("filingStatus");
        expect(res[i]).toHaveProperty("amount");
    }
});
test('scrape federal capital gains', async () => {
    const res = await fetchCapitalGainsData();
    //check that there are 4 tables
    expect(res.length).toBe(4);
    //check that rates are monotonically increasing
    for(const i in res.length){
        for(const j in res[i].length){
            if(j!==0){
                expect(res[i][j].rate).toBeGreaterThanOrEqual(res[i][j-1].rate);
            }
        }
    }
    //check that every high bound is greater than every low bound
    //check that the high bound of braxket x is 1 less than low bound of x+1 bracket
    for(const i in res.length){
        for(const j in res[i].length){
            
            expect(res[i][j].highBound).toBeGreaterThanOrEqual(res[i][j].lowBound);
            if(j!==0){
                expect(res[i][j].lowBound).toBe(res[i][j-1].highBound+1);
            }
        }
    }
});
test('scrape rmd table', async () => {
    const res = await fetchRMDTable();
    expect(res).toHaveProperty("ages");
    expect(res).toHaveProperty("distributions");
    expect(res.ages.length).toEqual(res.distributions.length);
});