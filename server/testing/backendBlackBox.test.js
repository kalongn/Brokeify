//This tests a full run of the backend components.
//It imports a scenario
//Runs 1 simulation
//Verifies the results are wheat they should be
//Exports the same scenario


import { test, expect } from '@playwright/test';
import { connectToDatabase,closeDatabaseConnection } from './utils.js';
import { parseStateTaxYAML } from '../yaml_parsers/stateTaxParser.js';
import { validateRun } from '../computation/planValidator.js';
import { parseAndSaveYAML } from '../yaml_parsers/scenarioParser.js';
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

test('end to end backend test', async () => {
    const stateTax = await parseStateTaxYAML("./testing_yaml_files/state_tax_test.yaml");
    expect(stateTax).not.toBeUndefined();
    // const sT = await taxFactory.read(stateTax[0]);
    // console.log(sT)
    const scenarioID = await parseAndSaveYAML("./testing_yaml_files/scenario1.yaml");
    expect(scenarioID).not.toBeUndefined();
    // const scenario = await scenarioFactory.read(scenarioID);
    // console.log(scenario)
    const results = await validateRun(scenarioID, 1, stateTax, "GUEST", 1);
    expect(results).not.toBeUndefined();
    //console.log(results)
    const simulationCalculations = await resultFactory.read(results.results[0]);
    console.log(simulationCalculations)

    /**
     * Time for math:
     * 
     * We have the following income
     * 7400, 7300, 7200, 7100, 7000, 6900, 6800, 6700, 6600, 6500
     * 
     * Tax should be
     * 0 (first year always 0), 150, 148, 146, 144, 142, 140, 138, 136, 134
     * 
     * 
     * Following non discretionary expense:
     * 5000, 5150, 5304.5, 5463.635, 5627.54405, 5796.3703715, 5970.26148264, 6149.36932712, 6333.85040694, 6523.86591915
     * A constant 2000 discretionary expense
     * 
     * We have tax-exempt bonds starting at 10,000, with a 5% return
     */
    const expectedTax = [0, 150, 148, 146, 144, 142, 140, 138, 136, 134];
    const expectedNonDiscretionary = [5000, 5150, 5304.5, 5463.635, 5627.54405, 5796.3703715, 5970.26148264, 6149.36932712, 6333.85040694, 6523.86591915];

    for(let i=0;i<10;i++){
        //console.log(simulationCalculations.yearlyResults[i])
        const totalExpense = expectedTax[i]+ expectedNonDiscretionary[i] + 2000;
        expect(simulationCalculations.yearlyResults[i].totalIncome).toBe(7500-(i*100));
        expect(simulationCalculations.yearlyResults[i].totalTax).toBe(expectedTax[i]);
        expect(simulationCalculations.yearlyResults[i].totalExpense).toBeCloseTo(totalExpense, 2);
        
    }

});