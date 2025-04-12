//Parse state tax files in designated format, save to DB
import yaml from 'js-yaml';
import fs from 'fs';
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
const distributionFactory = new DistributionController();
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();
const taxFactory = new TaxController()
import { TAX_TYPE, FILING_STATUS } from '../db/models/Enums.js';




/*
Used ChatGPT for the following function:
Prompt:
Please write the function parseStateTaxYAML(filepath) which takes in a filepath to a yaml file and goes from the following format of a yaml file:
{Copy/pasted NY state YAML file}

To save it in a databae, where the tax schema is:
{Tax schema from DB}

And use controllwers from:
{Tax controller file}
*/

export async function parseStateTaxYAML(filePath){
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.load(fileContents);

        const { state, single, married } = parsed;

        const parseBrackets = (brackets) => {
            return brackets.map(({ lowerBound, upperBound, rate }) => ({
                lowerBound: Number(lowerBound),
                upperBound: upperBound === 'Infinity' ? Infinity : Number(upperBound),
                rate: Number(rate)
            }));
        };

        const singleEntry = {
            state: state,
            filingStatus: "SINGLE",
            taxBrackets: parseBrackets(single)
        };

        const marriedEntry = {
            state: state,
            filingStatus: "MARRIEDJOINT",
            taxBrackets: parseBrackets(married)
        };
        
        const sing = await taxFactory.create("STATE_INCOME", singleEntry);
        const mar = await taxFactory.create("STATE_INCOME", marriedEntry);
        //console.log(`State income tax for ${state} successfully imported.`);
        return [sing._id, mar._id];
        
    } catch (err) {
        throw(err);
    }

}
