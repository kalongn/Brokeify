//This tests a full run of the backend components.
//It imports a scenario
//Runs 1 simulation
//Verifies the results are wheat they should be
//Exports the same scenario

/*
 npx c8 --reporter=lcov npx playwright test --workers 1 --config=testing/playwright.config.js
 npx c8 report --reporter=text

*/
import fs from 'fs';
import yaml from 'js-yaml';
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
const taxController = new TaxController();
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


test.beforeAll(async () => {
    await connectToDatabase();
});
test.afterAll(async () => {
    await closeDatabaseConnection();
});

test('end to end deterministic backend test', async () => {
    const taxfileContents = fs.readFileSync(path.resolve(__dirname, "./testing_yaml_files/state_tax_test.yaml"));
    const parsedTax = yaml.load(taxfileContents);
    const parseBrackets = (brackets) => {
        return brackets.map(({ lowerBound, upperBound, rate }) => ({
            lowerBound: Number(lowerBound),
            upperBound: upperBound === 'Infinity' ? Infinity : Number(upperBound),
            rate: Number(rate)
        }));
    };
    const { year, state, filingStatus, rates } = parsedTax;

    const taxID = await taxController.create("STATE_INCOME", {
        year: Number(year),
        state: state,
        filingStatus: filingStatus,
        taxBrackets: parseBrackets(rates)
    });
    const stateTax = [taxID, taxID];
    
    expect(stateTax).not.toBeUndefined();
    const fileContents = fs.readFileSync(path.resolve(__dirname, "./testing_yaml_files/scenario1.yaml"));
    const parsed = yaml.load(fileContents);
    const scenarioID = await parseAndSaveYAML(parsed, null);
    expect(scenarioID).not.toBeUndefined();
    // const scenario = await scenarioFactory.read(scenarioID);
    // console.log(scenario)
    const results = await validateRun(scenarioID, 1, stateTax, "GUEST");
    expect(results).not.toBeUndefined();
    //console.log(results)
    const simulationCalculations = await resultFactory.read(results.results[0]);
    //console.log(simulationCalculations)

    /**
     * Time for math:
     * 
     * We have the following income
     *  7000, 6900, 6800, 6700, 6600, 6500,...
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
    const expectedTax = [0, 138, 136, 134, 132, 130, 128, 126, 124, 122, 120];
    const expectedNonDiscretionary = [5000, 5150, 5304.5, 5463.635, 5627.54405, 5796.3703715, 5970.26148264, 6149.36932712, 6333.85040694, 6523.86591915, 6719.581896];

    for(let i=0;i<10;i++){
        //console.log(simulationCalculations.yearlyResults[i])
        const maxExpense = expectedTax[i+1]+ expectedNonDiscretionary[i+1] + 2000;
        expect(simulationCalculations.yearlyResults[i].totalIncome).toBe(7000-((i+1)*100));
        expect(simulationCalculations.yearlyResults[i].totalTax).toBe(expectedTax[i]);
        expect(simulationCalculations.yearlyResults[i].totalExpense).toBeLessThanOrEqual(maxExpense+4);
        expect(simulationCalculations.yearlyResults[i].totalExpense).toBeGreaterThan(maxExpense-2001);
        if(simulationCalculations.yearlyResults[i].isViolated){
            const inv = (simulationCalculations.yearlyResults[i].investmentValues[1].value);
            expect(inv).toBeLessThan(10000);
            expect(simulationCalculations.yearlyResults[i].totalDiscretionaryExpenses).toBeLessThan(1);
        }
        else{
            const inv = (simulationCalculations.yearlyResults[i].investmentValues[1].value);
            expect(inv).toBeGreaterThanOrEqual(10000);
            
        }
        if(simulationCalculations.yearlyResults[i].investmentValues[1].value<=10000){
            expect(simulationCalculations.yearlyResults[i].totalDiscretionaryExpenses).toBeLessThan(1);
        }
        else{
            expect(simulationCalculations.yearlyResults[i].totalDiscretionaryExpenses).toBe(1);
        }
    }

});
//Asked Gemini 2.5 Pro to create this test based on previous one
test('end to end touch everything test', async () => {
    // --- Configuration ---
    const scenarioFilePath = path.resolve(__dirname, "./testing_yaml_files/scenario2.yaml");
    const numberOfRuns = 1;
    const testUsername = "GUEST_MULTI_RUN";
    const taxfileContents = fs.readFileSync(path.resolve(__dirname, "./testing_yaml_files/state_tax_test.yaml"), 'utf8');
    const parsedTax = yaml.load(taxfileContents);
    const parseBrackets = (brackets) => {
        return brackets.map(({ lowerBound, upperBound, rate }) => ({
            lowerBound: Number(lowerBound),
            upperBound: upperBound === 'Infinity' ? Infinity : Number(upperBound),
            rate: Number(rate)
        }));
    };
    const { year, state, filingStatus, rates } = parsedTax;
    const taxID = await taxController.create("STATE_INCOME", {
        year: Number(year),
        state: state,
        filingStatus: filingStatus,
        taxBrackets: parseBrackets(rates)
    });
    // Ensure stateTax is an array of two IDs
    const stateTax = [taxID, taxID]; // Use the same ID for both single and married for this test setup

    expect(stateTax).not.toBeUndefined();
    expect(stateTax.length).toBe(2); // Verify it's an array of two

    if (!fs.existsSync(scenarioFilePath)) {
        throw new Error(`Scenario file not found at: ${scenarioFilePath}. Please provide the correct path.`);
    }
    const fileContents = fs.readFileSync(scenarioFilePath, 'utf8');
    const parsedScenario = yaml.load(fileContents);
    const scenarioID = await parseAndSaveYAML(parsedScenario, null); 
    expect(scenarioID).not.toBeUndefined();

    // --- Run Simulation Multiple Times ---
    console.log(`Starting ${numberOfRuns} simulation runs for scenario: ${scenarioID}`);
    // validateRun handles running the simulation, potentially using worker threads
    const compiledResults = await validateRun(scenarioID, numberOfRuns, stateTax, testUsername);
    expect(compiledResults).not.toBeUndefined();

    // --- Assertions (Invariants) ---

    // 1. Check Number of Results
    expect(compiledResults.results).toBeInstanceOf(Array);
    expect(compiledResults.results.length).toBe(numberOfRuns); // Ensure we got exactly 100 results
    console.log(`Received ${compiledResults.results.length} results.`);

    // 2. Check Result Structure (Basic)
    // Check the first result as a sample
    if (compiledResults.results.length > 0) {
        const firstResultId = compiledResults.results[0];
        expect(firstResultId).not.toBeNull(); // Ensure the ID is valid
        // Optionally read the full result object if needed for deeper checks
        // const firstResultData = await resultFactory.read(firstResultId);
        // expect(firstResultData).toHaveProperty('yearlyResults');
        // expect(firstResultData.yearlyResults).toBeInstanceOf(Array);
    }

    // 3. Check Results "Make Sense" (Add specific invariant checks here)
    // This is highly dependent on YOUR scenario and expected outcomes.
    // Example Invariant: Check if 'isViolated' flag behaves consistently or within expected bounds across runs.
    let violationCount = 0;
    let successfulRunsData = []; // Store data from non-error runs if needed
    for (const resultId of compiledResults.results) {
        const resultData = await resultFactory.read(resultId);
        expect(resultData).not.toBeNull(); // Ensure result exists in DB

        // Check for simulation errors first
        expect(resultData.resultStatus).toBe("SUCCESS");
        
        successfulRunsData.push(resultData); // Keep track of successful ones
        // Example: Check if the 'isViolated' flag exists in the last year's result
        if (resultData.yearlyResults && resultData.yearlyResults.length > 0) {
            const lastYearResult = resultData.yearlyResults[resultData.yearlyResults.length - 1];
            expect(lastYearResult).toHaveProperty('isViolated'); // Basic structure check
            if (lastYearResult.isViolated) {
                violationCount++;
            }  
            // - Is the final total value always positive?
            const finalValue = lastYearResult.investmentValues.reduce((sum, inv) => sum + inv.value, 0);
            expect(finalValue).toBeGreaterThanOrEqual(0);
            
        } else {
            console.warn(`Simulation run ${resultId} was successful but had no yearly results.`);
        }
         
    }


    console.log(`Found ${violationCount} runs ending in violation out of ${successfulRunsData.length} successful runs.`);
    // Add assertions based on expected violation counts/ratios if applicable
    // expect(violationCount).toBeLessThan(numberOfRuns * 0.1); // Example: Less than 10% violations expected

    let logContent = '';
    let foundRothKeyword = false;
    let latestLogFile = null;

    try {
        // Define the logs directory relative to the current test file's directory
        const logsDir = path.resolve(__dirname, '../../logs'); 
        console.log(`Looking for logs in: ${logsDir}`);

        if (!fs.existsSync(logsDir)) {
            throw new Error(`Logs directory not found: ${logsDir}`);
        }

        const logFiles = fs.readdirSync(logsDir)
                           .filter(file => file.endsWith('.log')); // Get only .log files

        if (logFiles.length === 0) {
            throw new Error(`No .log files found in ${logsDir}`);
        }

        // Find the most recently modified log file
        latestLogFile = logFiles.reduce((latest, current) => {
            const latestPath = path.join(logsDir, latest);
            const currentPath = path.join(logsDir, current);
            const latestStat = fs.statSync(latestPath);
            const currentStat = fs.statSync(currentPath);
            return currentStat.mtimeMs > latestStat.mtimeMs ? current : latest;
        });

        const latestLogPath = path.join(logsDir, latestLogFile);
        console.log(`Most recent log file found: ${latestLogPath}`);

        logContent = fs.readFileSync(latestLogPath, 'utf8');
        foundRothKeyword = logContent.includes('- ROTH -'); // Check for the specific keyword format

        console.log(`Keyword "- ROTH -" ${foundRothKeyword ? 'found' : 'not found'} in log file.`);

    } catch (error) {
        console.error(`Error finding or checking log file:`, error);
        // Fail the test if finding/reading the log file fails
        expect(false, `Failed to find or check log file: ${error.message}`).toBe(true);
    }

    // Add an assertion based on whether you expect "ROTH" to be in the log.
    // Adjust this expectation based on the scenario you are testing.
    expect(latestLogFile).not.toBeNull(); // Ensure a log file was actually found
    expect(foundRothKeyword, `Expected "- ROTH -" keyword to be present in the log file: ${latestLogFile}`).toBe(true);

});

test('exploration test', async () => {
    // --- Configuration ---
    const scenarioFilePath = path.resolve(__dirname, "./testing_yaml_files/scenario2.yaml");
    const numberOfRuns = 1;
    const testUsername = "GUEST_MULTI_RUN";
    const taxfileContents = fs.readFileSync(path.resolve(__dirname, "./testing_yaml_files/state_tax_test.yaml"), 'utf8');
    const parsedTax = yaml.load(taxfileContents);
    const parseBrackets = (brackets) => {
        return brackets.map(({ lowerBound, upperBound, rate }) => ({
            lowerBound: Number(lowerBound),
            upperBound: upperBound === 'Infinity' ? Infinity : Number(upperBound),
            rate: Number(rate)
        }));
    };
    const { year, state, filingStatus, rates } = parsedTax;
    const taxID = await taxController.create("STATE_INCOME", {
        year: Number(year),
        state: state,
        filingStatus: filingStatus,
        taxBrackets: parseBrackets(rates)
    });
    // Ensure stateTax is an array of two IDs
    const stateTax = [taxID, taxID]; // Use the same ID for both single and married for this test setup

    expect(stateTax).not.toBeUndefined();
    expect(stateTax.length).toBe(2); // Verify it's an array of two

    if (!fs.existsSync(scenarioFilePath)) {
        throw new Error(`Scenario file not found at: ${scenarioFilePath}. Please provide the correct path.`);
    }
    const fileContents = fs.readFileSync(scenarioFilePath, 'utf8');
    const parsedScenario = yaml.load(fileContents);
    const scenarioID = await parseAndSaveYAML(parsedScenario, null); 
    expect(scenarioID).not.toBeUndefined();

    const scenario = await scenarioFactory.read(scenarioID);
    expect(scenario.events.length).toBeGreaterThan(0); // Ensure there's at least one event
    const firstEventId = scenario.events[0]; // Get the ID of the first event
    // --- Define 2D Exploration Array ---
    const startYearLowerBound = new Date().getFullYear() + 1; // e.g., 2026
    const startYearUpperBound = startYearLowerBound + 10; // e.g., 2036
    const startYearStep = 5; // Steps: 2026, 2031, 2036 -> 3 steps

    const durationLowerBound = 1; // Duration in years
    const durationUpperBound = 5; // Duration in years
    const durationStep = 2; // Steps: 1, 3, 5 -> 3 steps

    const explorationArray = [
        {
            type: "START_EVENT", // Modifies start year distribution
            eventID: firstEventId.toString(),
            lowerBound: startYearLowerBound,
            upperBound: startYearUpperBound,
            step: startYearStep,
        },
        {
            type: "DURATION_EVENT", // Modifies duration distribution
            eventID: firstEventId.toString(),
            lowerBound: durationLowerBound,
            upperBound: durationUpperBound,
            step: durationStep,
        }
    ];
    const expectedStartSteps = [];
    for (let yr = startYearLowerBound; yr <= startYearUpperBound; yr += startYearStep) {
        expectedStartSteps.push(yr);
    }
    const expectedDurationSteps = [];
     for (let dur = durationLowerBound; dur <= durationUpperBound; dur += durationStep) {
        expectedDurationSteps.push(dur);
    }
    const expectedNumRuns = expectedStartSteps.length * expectedDurationSteps.length;
    expect(expectedNumRuns).toBeGreaterThan(1);


    // validateRun handles running the simulation, potentially using worker threads
    const compiledResults = await validateRun(scenarioID, numberOfRuns, stateTax, testUsername, explorationArray);
    expect(compiledResults).not.toBeUndefined();
    expect(compiledResults.simulationType).toBe("2D");
    expect(compiledResults.paramOneType).toBe("START_EVENT");
    expect(compiledResults.paramTwoType).toBe("DURATION_EVENT");
    expect(compiledResults.paramOne.toString()).toBe(firstEventId.toString()); // Compare IDs as strings
    expect(compiledResults.paramTwo.toString()).toBe(firstEventId.toString());
    expect(compiledResults.paramOneSteps).toEqual(expectedStartSteps);
    expect(compiledResults.paramTwoSteps).toEqual(expectedDurationSteps);
    expect(compiledResults.results).toBeInstanceOf(Array);
    expect(compiledResults.results.length).toBe(expectedNumRuns); 

    const foundSteps = [];
    const expectedStepsSet = new Set(); // Use a Set for efficient checking

    // Generate expected combinations
    for (const startStep of expectedStartSteps) {
        for (const durationStep of expectedDurationSteps) {
             expectedStepsSet.add(`${startStep},${durationStep}`); // Store as "start,duration" string
        }
    }

    // Collect actual step combinations from results
    for (const resultId of compiledResults.results) {
        const resultData = await resultFactory.read(resultId);
        expect(resultData).not.toBeNull();
        expect(resultData.resultStatus).toBe("SUCCESS"); // Expect simulations to succeed
        expect(resultData.yearlyResults.length).toBeGreaterThan(0); // Expect some yearly results

        // Get step1 and step2 from the first year's result (added by simulator.js)
        const firstYear = resultData.yearlyResults[0];
        expect(firstYear).toHaveProperty('step1');
        expect(firstYear).toHaveProperty('step2');

        const step1Value = firstYear.step1; // This should be the actual start year used
        const step2Value = firstYear.step2; // This should be the actual duration used

        // Check if the values are within the expected ranges
        expect(expectedStartSteps).toContain(step1Value);
        expect(expectedDurationSteps).toContain(step2Value);

        foundSteps.push(`${step1Value},${step2Value}`); // Store as string for comparison
    }

    // 3. Verify All Expected Combinations Were Run
    const foundStepsSet = new Set(foundSteps);

    expect(foundStepsSet.size).toBe(expectedStepsSet.size); // Ensure the number of unique combinations matches
    for (const expectedPair of expectedStepsSet) {
        expect(foundStepsSet.has(expectedPair)).toBe(true); // Ensure every expected combination was found
    }
    // --- Assertions (Invariants) ---

    // 1. Check Number of Results
    console.log(`Received ${compiledResults.results.length} results.`);

    // 2. Check Result Structure (Basic)
    // Check the first result as a sample
    if (compiledResults.results.length > 0) {
        const firstResultId = compiledResults.results[0];
        expect(firstResultId).not.toBeNull(); // Ensure the ID is valid
        // Optionally read the full result object if needed for deeper checks
        // const firstResultData = await resultFactory.read(firstResultId);
        // expect(firstResultData).toHaveProperty('yearlyResults');
        // expect(firstResultData.yearlyResults).toBeInstanceOf(Array);
    }

    // 3. Check Results "Make Sense" (Add specific invariant checks here)
    // This is highly dependent on YOUR scenario and expected outcomes.
    // Example Invariant: Check if 'isViolated' flag behaves consistently or within expected bounds across runs.
    let violationCount = 0;
    let successfulRunsData = []; // Store data from non-error runs if needed
    for (const resultId of compiledResults.results) {
        const resultData = await resultFactory.read(resultId);
        expect(resultData).not.toBeNull(); // Ensure result exists in DB

        // Check for simulation errors first
        expect(resultData.resultStatus).toBe("SUCCESS");
        
        successfulRunsData.push(resultData); // Keep track of successful ones
        // Example: Check if the 'isViolated' flag exists in the last year's result
        if (resultData.yearlyResults && resultData.yearlyResults.length > 0) {
            const lastYearResult = resultData.yearlyResults[resultData.yearlyResults.length - 1];
            expect(lastYearResult).toHaveProperty('isViolated'); // Basic structure check
            if (lastYearResult.isViolated) {
                violationCount++;
            }  
            // - Is the final total value always positive?
            const finalValue = lastYearResult.investmentValues.reduce((sum, inv) => sum + inv.value, 0);
            expect(finalValue).toBeGreaterThanOrEqual(0);
            
        } else {
            console.warn(`Simulation run ${resultId} was successful but had no yearly results.`);
        }
         
    }


    console.log(`Found ${violationCount} runs ending in violation out of ${successfulRunsData.length} successful runs.`);
    // Add assertions based on expected violation counts/ratios if applicable
    // expect(violationCount).toBeLessThan(numberOfRuns * 0.1); // Example: Less than 10% violations expected

    let logContent = '';
    let foundRothKeyword = false;
    let latestLogFile = null;

    try {
        // Define the logs directory relative to the current test file's directory
        const logsDir = path.resolve(__dirname, '../../logs'); 
        console.log(`Looking for logs in: ${logsDir}`);

        if (!fs.existsSync(logsDir)) {
            throw new Error(`Logs directory not found: ${logsDir}`);
        }

        const logFiles = fs.readdirSync(logsDir)
                           .filter(file => file.endsWith('.log')); // Get only .log files

        if (logFiles.length === 0) {
            throw new Error(`No .log files found in ${logsDir}`);
        }

        // Find the most recently modified log file
        latestLogFile = logFiles.reduce((latest, current) => {
            const latestPath = path.join(logsDir, latest);
            const currentPath = path.join(logsDir, current);
            const latestStat = fs.statSync(latestPath);
            const currentStat = fs.statSync(currentPath);
            return currentStat.mtimeMs > latestStat.mtimeMs ? current : latest;
        });

        const latestLogPath = path.join(logsDir, latestLogFile);
        console.log(`Most recent log file found: ${latestLogPath}`);

        logContent = fs.readFileSync(latestLogPath, 'utf8');
        foundRothKeyword = logContent.includes('- ROTH -'); // Check for the specific keyword format

        console.log(`Keyword "- ROTH -" ${foundRothKeyword ? 'found' : 'not found'} in log file.`);

    } catch (error) {
        console.error(`Error finding or checking log file:`, error);
        // Fail the test if finding/reading the log file fails
        expect(false, `Failed to find or check log file: ${error.message}`).toBe(true);
    }

    // Add an assertion based on whether you expect "ROTH" to be in the log.
    // Adjust this expectation based on the scenario you are testing.
    expect(latestLogFile).not.toBeNull(); // Ensure a log file was actually found
    expect(foundRothKeyword, `Expected "- ROTH -" keyword to be present in the log file: ${latestLogFile}`).toBe(true);

});