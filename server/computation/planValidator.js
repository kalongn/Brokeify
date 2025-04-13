//This component parses a user's request, calls to db or scraper to attain
//and compile RMD tables and Tax info, creates worker threads, then calls simulate()

//Note: This is not a very efficient approach, but it does make the code simpler
import * as fs from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
import { Worker } from 'worker_threads';
import path from 'path';

import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";

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

async function validate(scenarioID) {
    const scenario = await scenarioFactory.read(scenarioID);


    //ensures no circly dependancies for events
    for (const i in scenario.events) {
        let event = await eventFactory.read(scenario.events[i]);
        let dependancyID = null;

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

            if (dependancyID.toString() === event._id.toString()) {


                throw ("Circular Event Dependancies");
            }
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
            event = newEvent;
        }
    }
}

//TODO: add checking for the year value
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



export async function run(scenarioID, fedIncome, capitalGains, fedDeduction, stateIncome, rmdTable, csvFile, logFile) {
    //deep clone then run simulation then re-splice original scenario in simulation output
    const unmodifiedScenario = await scenarioFactory.read(scenarioID);
    let copiedScenario = await scenarioFactory.clone(unmodifiedScenario._id);
    let simulationResult = await simulate(copiedScenario, fedIncome, stateIncome, fedDeduction, capitalGains, rmdTable, csvFile, logFile);
    await scenarioFactory.deleteNotDistributions(copiedScenario._id);
    return simulationResult;
}

function runInWorker(data) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve('./computation/runWorker.js'), { workerData: data });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
            if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
        });
    });
}

//recives ID of scenario in db
export async function validateRun(scenarioID, numTimes, stateTaxIDArray, username, seed) {
    await validate(scenarioID);
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

    const compiledResults = await simulationFactory.create({
        scenario: scenario,
        results: []
    });

    const datetime = new Date();
    const csvFile = (await createSimulationCSV(username, datetime, "../logs")).toString();
    const logFile = await createEventLog(username, datetime, "../logs");
    scenarioID = scenarioID.toString();

    const promises = [];
    for (let i = 0; i < numTimes; i++) {
        promises.push(
            runInWorker({
                scenarioID,
                fedIncome,
                capitalGains,
                fedDeduction,
                stateTax,
                rmdTable,
                csvFile: i === 0 ? csvFile : null,
                logFile: i === 0 ? logFile : null
            })
        );
    }

    const results = await Promise.all(promises);
    for (const res of results) {
        if (res.error) throw new Error(res.error);
        compiledResults.results.push(res);
    }

    await simulationFactory.update(compiledResults._id, { results: compiledResults.results });
    return compiledResults;
}