//Hello reader
//This file tests the simulation algorithm
//This file in not essential to the program, you don't need to read it

import mongoose from "mongoose";
import 'dotenv/config'
import fs from 'fs';
import yaml from 'js-yaml';
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

import { simulate } from "./simulator.js";
import { validateRun } from "./planValidator.js";
import { parseAndSaveYAML } from "../yaml_parsers/scenarioParser.js";
import { parseStateTaxYAML } from "../yaml_parsers/stateTaxParser.js";
import { exportScenarioAsYAML } from "../yaml_parsers/scenarioExporter.js";

// Connect to MongoDB
const DB_ADDRESS = `${process.env.DB_ADDRESS}`;

mongoose.connect(DB_ADDRESS);
const connection = mongoose.connection;

connection.on('connected', () => {
    console.log('Connected to MongoDB');
});


connection.once('open', async () => {
    await populateDB();
    connection.close();
    process.exit();
});




const testTax = async (i) => {

    const factory = new TaxController();

    try {
        if (i == 1) {
            const federalIncomeTax = await factory.create("FEDERAL_INCOME", {
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
            });
            //console.log(federalIncomeTax);
            return federalIncomeTax;
        }
        else if (i == 2) {

            const stateIncomeTax = await factory.create("STATE_INCOME", {
                filingStatus: "SINGLE",
                state: "CA",
                year: 2024,
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
            });
            //console.log(stateIncomeTax);
            return stateIncomeTax;
        }
        else if (i == 3) {
            const federalStandardDeduction = await factory.create("FEDERAL_STANDARD", {
                filingStatus: "SINGLE",
                standardDeduction: 12400
            });
            //console.log(federalStandardDeduction);
            return federalStandardDeduction;
        }
        else if (i == 4) {
            return null;
        }

        else if (i == 5) {
            const capitalGainTax = await factory.create("CAPITAL_GAIN", {
                filingStatus: "SINGLE",
                taxBrackets: [
                    { lowerBound: 0, upperBound: 40000, rate: 0 },
                    { lowerBound: 40001, upperBound: 441450, rate: 0.15 },
                    { lowerBound: 441451, upperBound: Infinity, rate: 0.2 }
                ]
            });
            //console.log(capitalGainTax);
            return capitalGainTax;
        }



    } catch (error) {
        console.error(error);
    }
}



const populateDB = async () => {
    const factory = new ScenarioController();
    const taxfactory = new TaxController();
    const eventFactory = new EventController();
    //const stateTax = await parseStateTaxYAML("../yaml_files/state_taxes/state_tax_NY.yaml")
    //console.log(stateTax)
    //const s = await taxfactory.read(stateTax[0]);
    const fileContents = fs.readFileSync("../yaml_files/scenarios/testScenario4.yaml", 'utf8');
    const parsed = yaml.load(fileContents);
    
    const scenarioID = await parseAndSaveYAML(parsed, null);
    const scenario = await factory.read(scenarioID);
    //console.log(scenario1);
    
    
    //const RMDTable = await testRMDTable();


    //const federalIncomeTax = await testTax(1);
    const stateIncomeTax = await testTax(2);
    //const federalStandardDeduction = await testTax(3);
    //const capitalGainTax = await testTax(5);
    // const scenario = await testScenario();
    //const scenario = await testScenario();
    //const s = await eventFactory.create("INCOME", {name: "t"});
    const explorationArray = [
        {
            type: "ROTH_BOOLEAN",
            lowerBound: 11,
            upperBound: 100,
        },
        {
            type: "START_EVENT",
            eventID: scenario.events[0],
            lowerBound: 15,
            upperBound: 100,
            step: 10,
        }
    ]
    console.log('====================== Simulation Test =====================');
    //await simulate(scenario, federalIncomeTax, stateIncomeTax, federalStandardDeduction, stateStandardDeduction, capitalGainTax, RMDTable);
    try {
        const r = await validateRun(scenario._id, 10, [stateIncomeTax._id, stateIncomeTax._id], "GUEST");
        console.log(r.results.length);
    }
    catch (err) {
        const res = await connection.dropDatabase();
        throw (err);
    }
    //drop all objects in database
    //const res = await connection.dropDatabase();
    //console.log(res);
};