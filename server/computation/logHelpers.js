

import { readFileSync, writeFileSync, existsSync, appendFileSync, fstat } from 'fs';
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
import { cursorTo } from 'readline';
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();
const taxFactory = new TaxController();
const simulationFactory = new SimulationController();
const distributionFactory = new DistributionController();
const resultFactory = new ResultController();

import { logFile, csvFile } from './simulator.js';

export async function updateCSV(currentYear, investments, scenario) {
    //takes in current year of simulation and a list of investments
    //if an investment's id is not in the title row, it adds it at the end
    //inserts a row and puts currentYear, followed by investment values
    
    if (csvFile === null || csvFile === undefined) {
        return;
    }
    
    let csvContent = [];
    if (existsSync(csvFile)) {
        csvContent = readFileSync(csvFile, 'utf8').trim().split('\n').map(row => row.split(','));
    }
    const nameMap = new Map();
    const invIds = []
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        for (const j in investmentType.investments) {
            const inv = await investmentFactory.read(investmentType.investments[j])
            nameMap.set(inv._id.toString(), investmentType.name+":"+inv.taxStatus);
            invIds.push(inv._id)
        }

    }
    let headers = csvContent.length ? csvContent[0] : ['Year']; // First row is the header
    let investmentNames = investments.map(investment => nameMap.get(investment._id.toString()));

    //check for missing investment IDs and add them to the headers
    let missingIDs = investmentNames.filter(id => !headers.includes(id));
    if (missingIDs.length) {
        headers.push(...missingIDs);
    }

    //prepare new row
    let newRow = [currentYear];
    
    for (let i = 1; i < headers.length; i++) {
        const inv = await investmentFactory.read(invIds[i-1]);
        if(inv==null){
            newRow.push(0);
        }
        else{
            newRow.push(inv.value || 0);
        }
    }

    csvContent.push(newRow);

    //convert back to CSV format and write to file
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    writeFileSync(csvFile, csvString, 'utf8');
}
export function updateLog(eventDetails) {
    //const EVENT_TYPE = ['INCOME', 'EXPENSE', 'ROTH', 'RMD', 'TAX', 'INVEST', 'REBALANCE'];
    //details has data based on event type
    if (logFile === null || logFile === undefined) {
        return;
    }
    appendFileSync(logFile, eventDetails);


}
