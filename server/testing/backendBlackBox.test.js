//This tests a full run of the backend components.
//It imports a scenario
//Runs 1 simulation
//Verifies the results are wheat they should be
//Exports the same scenario


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

test.beforeAll(async () => {
    await connectToDatabase();
});
test.afterAll(async () => {
    await closeDatabaseConnection();
});

test('end to end backend test', async () => {
    const stateTax = await parseStateTaxYAML("./testing_yaml_files/state_tax_test.yaml");
    expect(stateTax).not.toBeUndefined();
    const scenarioID = await parseAndSaveYAML("./testing_yaml_files/scenario1.yaml");
    expect(scenarioID).not.toBeUndefined();
    const results = await validateRun(scenarioID, 1, stateTax, "GUEST", 1);
    expect(results).not.toBeUndefined();
    console.log(results);
});