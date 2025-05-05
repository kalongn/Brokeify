//This component parses a user's request, calls to db or scraper to attain
//and compile RMD tables and Tax info, creates worker threads, then calls simulate()

//Note: This is not a very efficient approach, but it does make the code simpler
import * as fs from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
import { Worker } from 'worker_threads';
import * as os from 'os';
import path from 'path';
import { fileURLToPath } from "url";

import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import DistributionController from '../db/controllers/DistributionController.js';
import RMDTableController from "../db/controllers/RMDTableController.js";
import TaxController from "../db/controllers/TaxController.js";
import SimulationController from "../db/controllers/SimulationController.js";

import { scrapeFederalIncomeTaxBrackets, scrapeStandardDeductions, fetchCapitalGainsData, fetchRMDTable } from "./scraper.js";
import { simulate } from "./simulator.js";

const scenarioFactory = new ScenarioController();
const eventFactory = new EventController();
const taxFactory = new TaxController();
const rmdFactory = new RMDTableController();
const simulationFactory = new SimulationController();
const distributionFactory = new DistributionController()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPath = decodeURIComponent(path.resolve(__dirname, "./runWorker.js"));

async function createSimulationCSV(user, datetime, folder) {
    const timestamp = format(datetime, 'yyyyMMdd_HHmmss');
    const filename = `${user}_${timestamp}.csv`;
    const filepath = join(folder, filename);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    let csvContent = `Year\n`;
    //write file
    fs.writeFileSync(filepath, csvContent, 'utf8');
    // console.log(`CSV log created: ${filepath}`);
    return filepath;
}

async function createEventLog(user, datetime, folder) {
    const timestamp = format(datetime, 'yyyyMMdd_HHmmss');
    const filename = `${user}_${timestamp}.log`;
    const filepath = join(folder, filename);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    let logContent = `Simulation Log for ${user} - ${format(datetime, 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    // Write file
    fs.writeFileSync(filepath, logContent, 'utf8');
    //console.log(`Event log created: ${filepath}`);
    return filepath;
}

async function validate(scenarioID, explorationArray) {
    const scenario = await scenarioFactory.read(scenarioID);


    //ensures no circly dependancies for events
    for (const i in scenario.events) {
        let event = await eventFactory.read(scenario.events[i]);
        let seenIds = [event._id.toString()];
        let dependancyID = null;
        if(!event.startYearTypeDistribution && !event.startsWith && !event.startsAfter){
            throw("Event needs start information")
        }
        if (event.startsWith && event.startsAfter) {
            throw ("Event Cannot Start Both With And After");
        }
        if (event.startsWith !== undefined && event.startsWith !== null) {
            dependancyID = event.startsWith;

        }
        else if (event.startsAfter !== undefined && event.startsAfter !== null) {
            dependancyID = event.startsAfter;

        }
        while (dependancyID != null) {  //itarate through dependancies
            
            if (seenIds.includes(dependancyID.toString())) {
                throw ("Circular Event Dependancies");
            }
            seenIds.push(dependancyID.toString())
            const newEvent = await eventFactory.read(dependancyID.toString());
            if (!newEvent) {
                throw ("Referenced Event Does Not Exist");
            }
            if (newEvent.startsWith && newEvent.startsAfter) {
                throw ("Event Cannot Start Both With And After");
            }
            if (newEvent.startsWith !== undefined && newEvent.startsWith !== null) {
                dependancyID = newEvent.startsWith;
            }
            else if (newEvent.startsAfter !== undefined && newEvent.startsAfter !== null) {
                dependancyID = newEvent.startsAfter;
            }
            else {
                dependancyID = null;
            }
        }
    }

    if(explorationArray !== null && explorationArray !== undefined){
        /*
        Make sure that values of explorationArray are coherent:
        enum is one of the valid types
        eventID refers to evnt in scenario
        has lowerBound/upperBound (and lower is amaller than upper)
        if not ROTH_BOOLEAN, has postitive interger type

        [{
        type: Enum, one of ["ROTH_BOOLEAN", "START_EVENT", "DURATION_EVENT", "EVENT_AMOUNT", "INVEST_PERCENTAGE"]
        eventID: ObjectID
        lowerBound: Number
        upperBound: Number
        step: Number
        If the type is "ROTH_BOOLEAN", no step/eventID is required, and lower/upper bounds represnt the optimization years
        }]
        */

        for(const i in explorationArray){
            const explorationValue = explorationArray[i];
            if(explorationValue.type === "ROTH_BOOLEAN"){

            }
            else if(explorationValue.type === "START_EVENT"
                ||  explorationValue.type === "DURATION_EVENT"
                ||  explorationValue.type === "EVENT_AMOUNT"
                ||  explorationValue.type === "INVEST_PERCENTAGE"
            ){
                let found = false;
                for(const j in scenario.events){
                    if(scenario.events[j].toString()===explorationValue.eventID.toString()){
                        found=true;
                        break;
                    }
                }
                if(!found){
                    throw(`Event ID ${explorationValue.eventID} was not found in scenario`);
                }
                if(!Number.isInteger(explorationValue.upperBound)){
                    //throw("Upper Bound of scenario exploration must be Integer");
                }
                if(!Number.isInteger(explorationValue.lowerBound)){
                    //throw("Lower Bound of scenario exploration must be Integer");
                }
                if(!Number.isInteger(explorationValue.step)){
                    //throw("Step of scenario exploration must be Integer");
                }
                if(explorationValue.upperBound<=explorationValue.lowerBound){
                    throw("Upper bound of scenario exploration must be strictly larger than lower bound");
                }
                if(explorationValue.step>explorationValue.upperBound-explorationValue.lowerBound){
                    throw("Step size of scenario exploration is too large given bounds");
                }
                if(explorationValue.type === "INVEST_PERCENTAGE"){
                    if(explorationValue.upperBound>100||explorationValue.lowerBound<0){
                        throw("Bounds of invest percentage must be between 0-100");
                    }
                    //make sure event is only among 2 investments
                    const originalEvent = await eventFactory.read(explorationArray[i].eventID);
                    if(originalEvent.allocatedInvestments.length!==2){
                        throw("Number of investments in invest scenario exploration must be 2");
                    }
                }
            }
            else{
                throw(`Index ${i} of exploration array has an invalid type: ${explorationValue.type}`);
            }
        }
    }
}

async function removeOutOfDateTax(taxBracket){
    if(taxBracket){
        const realYear = new Date().getFullYear();
        if(taxBracket.year==realYear){
            return taxBracket;
        }
        else{
            await taxFactory.delete(taxBracket._id);
            return null;
        }
    }
    return null;

}

async function scrape() {
    //check to see if federalIncomeTax, federalStandardDeduction, capitalGains exist
    //scrape, parse, and save to DB if not

    const a = await taxFactory.readAll();

    //check if any of the returned taxes have FEDERAL_INCOME, scrape if not
    let federalIncomeSingle = null;
    let federalIncomeMarried = null;
    let capitalGainsSingle = null;
    let capitalGainsMarried = null;
    let federalDeductionSingle = null;
    let federalDeductionMarried = null;


    for (const i in a) {
        if (a[i].taxType === "FEDERAL_INCOME" && a[i].filingStatus === "SINGLE") {
            federalIncomeSingle = a[i];
        }
    }
    for (const i in a) {
        if (a[i].taxType === "FEDERAL_INCOME" && a[i].filingStatus === "MARRIEDJOINT") {
            federalIncomeMarried = a[i];
        }
    }

    //check if any of the returned taxes have CAPITAL_GAIN, scrape if not
    for (const i in a) {
        if (a[i].taxType === "CAPITAL_GAIN" && a[i].filingStatus === "SINGLE") {
            capitalGainsSingle = a[i];
        }
    }
    for (const i in a) {
        if (a[i].taxType === "CAPITAL_GAIN" && a[i].filingStatus === "MARRIEDJOINT") {
            capitalGainsMarried = a[i];
        }
    }

    //check if any of the returned taxes have FEDERAL_STANDARD, scrape if not
    for (const i in a) {
        if (a[i].taxType === "FEDERAL_STANDARD" && a[i].filingStatus === "SINGLE") {
            federalDeductionSingle = a[i];
        }
    }
    for (const i in a) {
        if (a[i].taxType === "FEDERAL_STANDARD" && a[i].filingStatus === "MARRIEDJOINT") {
            federalDeductionMarried = a[i];
        }
    }

    //determine if any of the taxes are out-of-date, remove if so

    federalIncomeSingle = await removeOutOfDateTax(federalIncomeSingle);
    federalIncomeMarried = await removeOutOfDateTax(federalIncomeMarried);
    capitalGainsSingle = await removeOutOfDateTax(capitalGainsSingle);
    capitalGainsMarried = await removeOutOfDateTax(capitalGainsMarried);
    federalDeductionSingle = await removeOutOfDateTax(federalDeductionSingle);
    federalDeductionMarried = await removeOutOfDateTax(federalDeductionMarried);

    


    if (federalIncomeSingle === null || federalIncomeMarried === null) {
        //scrape:
        const { year, taxBrackets } = await scrapeFederalIncomeTaxBrackets();

        //only care about single & married joint

        //first, parse single:
        if (federalIncomeSingle === null) {
            let singleFedTax = { filingStatus: "SINGLE", taxType: "FEDERAL_INCOME", taxBrackets: [] };
            for (const i in taxBrackets[0]) {
                const bracket = { lowerBound: taxBrackets[0][i].lowBound, upperBound: taxBrackets[0][i].highBound, rate: taxBrackets[0][i].rate / 100 };
                singleFedTax.taxBrackets.push(bracket);
            }
            //save to db

            await taxFactory.create("FEDERAL_INCOME", {
                filingStatus: singleFedTax.filingStatus,
                taxBrackets: singleFedTax.taxBrackets,
                year: year
            });
            federalIncomeSingle = singleFedTax;
        }
        if (federalIncomeMarried === null) {
            let marriedFedTax = { filingStatus: "MARRIEDJOINT", taxType: "FEDERAL_INCOME", taxBrackets: [] };
            for (const i in taxBrackets[0]) {
                const bracket = { lowerBound: taxBrackets[1][i].lowBound, upperBound: taxBrackets[1][i].highBound, rate: taxBrackets[1][i].rate / 100 };
                marriedFedTax.taxBrackets.push(bracket);
            }
            //save to db

            await taxFactory.create("FEDERAL_INCOME", {
                filingStatus: marriedFedTax.filingStatus,
                taxBrackets: marriedFedTax.taxBrackets,
                year: year
            });
            federalIncomeMarried = marriedFedTax;
        }

    }

    if (capitalGainsSingle === null || capitalGainsMarried === null) {
        const { year, taxBrackets } = await fetchCapitalGainsData();


        if (capitalGainsSingle === null) {
            let singleCapitalTax = { filingStatus: "SINGLE", taxType: "CAPITAL_GAIN", taxBrackets: [] };
            for (const i in taxBrackets[0]) {
                const bracket = { lowerBound: taxBrackets[0][i].lowBound, upperBound: taxBrackets[0][i].highBound, rate: taxBrackets[0][i].rate / 100 };
                singleCapitalTax.taxBrackets.push(bracket);
            }
            //save to db

            await taxFactory.create("CAPITAL_GAIN", {
                filingStatus: singleCapitalTax.filingStatus,
                taxBrackets: singleCapitalTax.taxBrackets,
                year: year
            });
            capitalGainsSingle = singleCapitalTax;
        }
        if (capitalGainsMarried === null) {
            let marriedCapitalTax = { filingStatus: "MARRIEDJOINT", taxType: "CAPITAL_GAIN", taxBrackets: [] };
            for (const i in taxBrackets[0]) {
                const bracket = { lowerBound: taxBrackets[1][i].lowBound, upperBound: taxBrackets[1][i].highBound, rate: taxBrackets[1][i].rate / 100 };
                marriedCapitalTax.taxBrackets.push(bracket);
            }
            //save to db
            await taxFactory.create("CAPITAL_GAIN", {
                filingStatus: marriedCapitalTax.filingStatus,
                taxBrackets: marriedCapitalTax.taxBrackets,
                year: year
            });
            capitalGainsMarried = marriedCapitalTax;
        }
    }

    if (federalDeductionSingle === null || federalDeductionMarried === null) {
        const { year, standardDeductions } = await scrapeStandardDeductions();


        if (federalDeductionSingle === null) {
            federalDeductionSingle = await taxFactory.create("FEDERAL_STANDARD", {
                filingStatus: "SINGLE",
                standardDeduction: standardDeductions[0].amount,
                year: year
            });
        }
        if (federalDeductionMarried === null) {
            federalDeductionMarried = await taxFactory.create("FEDERAL_STANDARD", {
                filingStatus: "MARRIEDJOINT",
                standardDeduction: standardDeductions[1].amount,
                year: year
            });
        }
    }


    //check for RMD table:
    let rmdTable = null;
    rmdTable = await rmdFactory.read();
    //console.log(rmdTable);
    if (rmdTable === null) {
        const rmdScrapeReturn = await fetchRMDTable();
        //console.log(rmdScrapeReturn);
        rmdTable = await rmdFactory.create({
            year: rmdScrapeReturn.year,
            ages: rmdScrapeReturn.ages,
            distributionPeriods: rmdScrapeReturn.distributions
        });
    }
    //return:
    return {
        federalIncomeSingle,
        federalIncomeMarried,
        capitalGainsSingle,
        capitalGainsMarried,
        federalDeductionSingle,
        federalDeductionMarried,
        rmdTable
    }




}



export async function run(
    scenarioID, 
    fedIncome, 
    capitalGains, 
    fedDeduction, 
    stateIncome, 
    rmdTable, 
    csvFile, 
    logFile,
    explorationArray,
    step1,
    step2,
    seed,
) {
    //deep clone then run simulation then re-splice original scenario in simulation output
    const unmodifiedScenario = await scenarioFactory.read(scenarioID);
    let copiedScenario = await scenarioFactory.clone(unmodifiedScenario._id);
    //depending on step1, step2, do exploration
    let newDists = [];
    let steps = [step1, step2];
    let trueValues = [];
    /**
     * We have created a clone scnario, and we have potentially been given an array
     * of exploration objects, as well as this specific run's given step.
     * 
     * Here, we modify the cloned scenario to be the values represented in the exploration
     * object and given steps.
     */

    for(const j in steps){
        const step = steps[j]
        if(step===undefined){
            continue;
        }
        //modify the scenario according to the step

        if(explorationArray[j].type==="ROTH_BOOLEAN"){
            //0 = off, 1 = on
            trueValues.push(step)
            if(step===-2){  // Roth -> -1 is roth, -2 not roth
                copiedScenario = await scenarioFactory.update(copiedScenario._id, {startYearRothOptimizer: null});
                copiedScenario.startYearRothOptimizer=undefined;
            }
            else{
                // Should already be in the scenario
                // copiedScenario.startYearRothOptimizer=explorationArray[j].lowerBound;
                // copiedScenario.endYearRothOptimizer=explorationArray[j].upperBound;
                // await scenarioFactory.update(copiedScenario._id, {
                //         startYearRothOptimizer: explorationArray[j].lowerBound, 
                //         endYearRothOptimizer: explorationArray[j].upperBound
                //     });
                
            }
        }
        else if(explorationArray[j].type==="START_EVENT"){
            trueValues.push(step+explorationArray[j].lowerBound)
            const diff = step;  //distance from lowerBound
            const originalEvent = await eventFactory.read(explorationArray[j].eventID);
            for(const i in copiedScenario.events){
                const copiedEvent = await eventFactory.read(copiedScenario.events[i]);
                if(copiedEvent.name.toString()===originalEvent.name.toString()){
                    const newDist1 = await distributionFactory.create("FIXED_AMOUNT", {value: diff+explorationArray[j].lowerBound});
                    newDists.push(newDist1);
                    await eventFactory.update(copiedEvent._id, {startYearTypeDistribution: newDist1._id, startsWith: null, startsAfter: null});
                }
            }

        }
        else if(explorationArray[j].type==="DURATION_EVENT"){
            trueValues.push(step+explorationArray[j].lowerBound)
            const diff = step;  //distance from lowerBound
            const originalEvent = await eventFactory.read(explorationArray[j].eventID);
            for(const i in copiedScenario.events){
                const copiedEvent = await eventFactory.read(copiedScenario.events[i]);
                if(copiedEvent.name.toString()===originalEvent.name.toString()){
                    const newDist1 = await distributionFactory.create("FIXED_AMOUNT", {value: diff+explorationArray[j].lowerBound});
                    newDists.push(newDist1);
                    await eventFactory.update(copiedEvent._id, {durationTypeDistribution: newDist1._id});
                }
            }
        }
        else if(explorationArray[j].type==="EVENT_AMOUNT"){
            trueValues.push(step+explorationArray[j].lowerBound)
            const diff = step;  //distance from lowerBound
            const originalEvent = await eventFactory.read(explorationArray[j].eventID);
            for(const i in copiedScenario.events){
                const copiedEvent = await eventFactory.read(copiedScenario.events[i]);
                if(copiedEvent.name.toString()===originalEvent.name.toString()){
                    await eventFactory.update(copiedEvent._id, {amount: explorationArray[j].lowerBound+diff});
                }
            }
        }
        else if(explorationArray[j].type==="INVEST_PERCENTAGE"){
            const firstInitial = ((step)+explorationArray[j].lowerBound)/100;  //distance from lowerBound
            trueValues.push(firstInitial)
            const secondInitial = 1-firstInitial;
            const originalEvent = await eventFactory.read(explorationArray[j].eventID);
            for(const i in copiedScenario.events){
                const copiedEvent = await eventFactory.read(copiedScenario.events[i]);
                if(copiedEvent.name.toString()===originalEvent.name.toString()){
                    await eventFactory.update(copiedEvent._id, {percentageAllocations: [
                        [firstInitial, copiedEvent.percentageAllocations[0][1]],
                        [secondInitial, copiedEvent.percentageAllocations[1][1]],
                    ]});

                }
            }
        }

    }
    const simulationResult = await simulate(
        copiedScenario, 
        fedIncome, 
        stateIncome,
        fedDeduction, 
        capitalGains, 
        rmdTable, 
        csvFile, 
        logFile,
        trueValues[0],
        trueValues[1],
        seed,
    );
    await scenarioFactory.deleteNotDistributions(copiedScenario._id);
    for(const i in newDists){
        if(newDists[i]!==undefined){
            await distributionFactory.delete(newDists[i]._id);
        }
    }
    return simulationResult;
}

function runInWorker(data) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(execPath, { workerData: data });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
            if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
        });
    });
}

//recives ID of scenario in db
/**
 * 
 * @param {ID of scenario} scenarioID 
 * @param {Number of times to run scenario} numTimes 
 * @param {Array of 2 for state tax of [single, married]} stateTaxIDArray 
 * @param {string used for log files} username 
 * @param {
 * Can be null/undefined, but if not, [{
    type: Enum, one of ["ROTH_BOOLEAN", "START_EVENT", "DURATION_EVENT", "EVENT_AMOUNT", "INVEST_PERCENTAGE"]
    eventID: ObjectID
    lowerBound: Number
    upperBound: Number
    step: Number
    If the type is "ROTH_BOOLEAN", no step/eventID is required, and lower/upper bounds represnt the optimization years
    }]
 * } explorationArray 
 * @returns 
 */
export async function validateRun(scenarioID, numTimes, stateTaxIDArray, username, explorationArray) {
    await validate(scenarioID, explorationArray);
    const scrapeReturn = await scrape();
    const scenario = await scenarioFactory.read(scenarioID);


    const fedIncome = [
        JSON.parse(JSON.stringify(scrapeReturn.federalIncomeSingle)),
        JSON.parse(JSON.stringify(scrapeReturn.federalIncomeMarried))
    ];

    const capitalGains = [
        JSON.parse(JSON.stringify(scrapeReturn.capitalGainsSingle)),
        JSON.parse(JSON.stringify(scrapeReturn.capitalGainsMarried))
    ];

    const fedDeduction = [
        JSON.parse(JSON.stringify(scrapeReturn.federalDeductionSingle)),
        JSON.parse(JSON.stringify(scrapeReturn.federalDeductionMarried))
    ];

    const rmdTable = JSON.parse(JSON.stringify(scrapeReturn.rmdTable));

    const stateTax = [
        JSON.parse(JSON.stringify(await taxFactory.read(stateTaxIDArray[0]))),
        JSON.parse(JSON.stringify(await taxFactory.read(stateTaxIDArray[1]))),
    ];
    let simulationType, paramOneType, paramTwoType, paramOne, paramTwo, paramOneSteps, paramTwoSteps;
    if(!explorationArray){
        simulationType = "NORMAL";
    }
    else if(explorationArray.length>=1){
        simulationType = "1D";
        paramOneType = explorationArray[0].type;
        paramOneSteps = [];
        if(explorationArray[0].type==="ROTH_BOOLEAN"){
            paramOne = undefined;
            paramOneSteps = [-1, -2];
        }
        else{
            paramOne = explorationArray[0].eventID;
            let currentValue = explorationArray[0].lowerBound;
            while(currentValue<=explorationArray[0].upperBound){
                paramOneSteps.push(currentValue);
                currentValue+=explorationArray[0].step;
            }
        }
        
    }
    if(explorationArray && explorationArray.length===2){
        simulationType = "2D";
        paramTwoType = explorationArray[1].type;
        paramTwoSteps = [];
        if(explorationArray[1].type==="ROTH_BOOLEAN"){
            paramTwo = undefined;
            paramTwoSteps = [-1, -2];
        }
        else{
            paramTwo = explorationArray[1].eventID;
            let currentValue = explorationArray[1].lowerBound;
            while(currentValue<=explorationArray[1].upperBound){
                paramTwoSteps.push(currentValue);
                currentValue+=explorationArray[1].step;
            }
        }
    }
    const compiledResults = await simulationFactory.create({
        scenario: scenario,
        results: [],
        simulationType: simulationType,
        paramOneType: paramOneType,
        paramTwoType: paramTwoType,
        paramOne: paramOne,
        paramTwo: paramTwo,
        paramOneSteps: paramOneSteps,
        paramTwoSteps: paramTwoSteps
    });

    const datetime = new Date();
    const csvFile = (await createSimulationCSV(username, datetime, "../logs")).toString();
    const logFile = await createEventLog(username, datetime, "../logs");
    scenarioID = scenarioID.toString();

    const promiseParameters = [];
    /**
     * First, create an array of parameters that will be ran
     * 
     * For 1/2D explorations, numTimes serves as the floor
     */
    let randomString = (Math.random() + 1).toString(36).substring(7);  //generate seed
    for (let i = 0; i < numTimes; ) {
        //if explorationArray is in play, create and run each combo
        if(explorationArray==null||explorationArray==undefined){
            promiseParameters.push(
                {
                    scenarioID,
                    fedIncome,
                    capitalGains,
                    fedDeduction,
                    stateTax,
                    rmdTable,
                    csvFile: i === 0 ? csvFile : null,
                    logFile: i === 0 ? logFile : null,
                }
            );
            i++;
        }
        else if(explorationArray.length===1){
            let numSteps1;
            if(explorationArray[0].type==="ROTH_BOOLEAN"){
                numSteps1 = 2;
            }
            else{
                numSteps1 = Math.floor((explorationArray[0].upperBound-explorationArray[0].lowerBound)/explorationArray[0].step) + 1;
            }
            for(let s = 0; s<numSteps1;s++){
                promiseParameters.push(
                    {
                        scenarioID,
                        fedIncome,
                        capitalGains,
                        fedDeduction,
                        stateTax,
                        rmdTable,
                        csvFile: s+i === 0 ? csvFile : null,
                        logFile: s+i === 0 ? logFile : null,
                        explorationArray: explorationArray,
                        step1: explorationArray[0].step !== undefined ? s*explorationArray[0].step: s-2,
                        seed: randomString,
                    }
                );
                i++;
            }
            
        }
        else if(explorationArray.length===2){
            let numSteps1;
            if(explorationArray[0].type==="ROTH_BOOLEAN"){
                numSteps1 = 2;
            }
            else{
                numSteps1 = Math.floor((explorationArray[0].upperBound-explorationArray[0].lowerBound)/explorationArray[0].step) + 1;
            }
            for(let s = 0; s<numSteps1;s++){
                let numSteps2;
                if(explorationArray[1].type==="ROTH_BOOLEAN"){
                    numSteps2 = 2;
                }
                else{
                    numSteps2 = Math.floor((explorationArray[1].upperBound-explorationArray[1].lowerBound)/explorationArray[1].step) + 1;
                }
                for(let s2 = 0; s2<numSteps2;s2++){
                    promiseParameters.push(
                        {
                            scenarioID,
                            fedIncome,
                            capitalGains,
                            fedDeduction,
                            stateTax,
                            rmdTable,
                            csvFile: s2+s+i === 0 ? csvFile : null,
                            logFile: s2+s+i === 0 ? logFile : null,
                            explorationArray: explorationArray,
                            step1: explorationArray[0].step !== undefined ? s*explorationArray[0].step : s-2,   // Roth -> -1 is roth, -2 not roth
                            step2: explorationArray[1].step !== undefined ? s2*explorationArray[1].step : s2-2,
                            seed: randomString,
                        }
                    );
                    i++;
                }
                
            }
        }
        else{
            throw("explorationArray.length is bad");
        }
    }



    //Figure out how many worker threads to run at once:
    const cpuCount = os.cpus().length;
    let parallel = cpuCount - 4;
    if (1 > parallel) {
        parallel = 2; // have a minimum of 2
    }
    parallel = Math.min(promiseParameters.length, parallel);


    const tasksPerWorker = Math.ceil(promiseParameters.length / parallel);
    const taskBatches = [];
    for (let i = 0; i < parallel; i++) {
        const start = i * tasksPerWorker;
        const end = start + tasksPerWorker;
        const batch = promiseParameters.slice(start, end);
        if (batch.length > 0) {
            taskBatches.push(batch);
        }
    }
    parallel = taskBatches.length;


    console.log(`Dividing ${promiseParameters.length} tasks into ${parallel} batches for parallel execution.`);

    const allWorkerPromises = [];

    for (let i = 0; i < parallel; i++) {
        const batch = taskBatches[i];
        const workerIndex = i;

        const workerPromise = runInWorker({
            tasksBatch: batch,      
            workerIndex: workerIndex 
        })
        .then(batchResults => {
            // Worker should return an array of results, one per task in its batch
            if (!Array.isArray(batchResults)) {
                // Handle case where worker returned an error object instead of array
                if (batchResults && batchResults.error) {
                    throw new Error(`Worker ${workerIndex} execution failed: ${batchResults.error}`);
                } else {
                    throw new Error(`Worker ${workerIndex} returned invalid data type: ${typeof batchResults}`);
                }
            }
            console.log(`Worker ${workerIndex} finished processing batch of ${batch.length} tasks.`);
            return batchResults; // Return the array of results from this batch
        })
        .catch(error => {
            console.error(`Error processing batch in worker ${workerIndex}:`, error);
            // Return an array containing error placeholders for this batch's results
            // Or re-throw if you want Promise.all to reject immediately
            return batch.map(task => ({ error: `Worker failed: ${error.message}` })); // Match result structure potentially
        });
        allWorkerPromises.push(workerPromise);
    }

    // Wait for all workers (batches) to complete
    console.log("All workers launched. Waiting for all batches to complete...");
    const resultsFromAllBatches = await Promise.all(allWorkerPromises);
    console.log("All workers finished.");

    // Flatten the results from all batches into a single array
    const resultsAccumulator = resultsFromAllBatches.flat();
    console.log(`Collected ${resultsAccumulator.length} total results from ${parallel} workers.`);
    // Update compiled results with the accumulated results
    compiledResults.results = resultsAccumulator; // Assign the collected results

    // The original code below this point (saving results) remains the same
    // await simulationFactory.update(compiledResults._id, { results: compiledResults.results }); // This line might be redundant now

    await simulationFactory.update(compiledResults._id, { results: resultsAccumulator });
    return compiledResults;
}