
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


export async function parseStateTaxYAML(yamlStr, userId) {
    try {
        const { year, state, filingStatus, rates } = yamlStr;
        const parseBrackets = (brackets) => {
            return brackets.map(({ lowerBound, upperBound, rate }) => ({
                lowerBound: Number(lowerBound),
                upperBound: upperBound === 'Infinity' ? Infinity : Number(upperBound),
                rate: Number(rate)
            }));
        };
        const user = await userController.readWithTaxes(userId);
        if (!user.userSpecificTaxes) {
            user.userSpecificTaxes = [];
        }

        if (user.userSpecificTaxes.some(t => t.state === state && t.filingStatus === filingStatus && t.year === year)) {
            return 1; // Tax already exists
        }

        const taxId = await taxController.create("STATE_INCOME", {
            year: Number(year),
            state: state,
            filingStatus: filingStatus,
            taxBrackets: parseBrackets(rates)
        });

        user.userSpecificTaxes.push(taxId);
        await userController.update(userId, user);

        return 0;
    } catch (err) {
        throw (err);
    }
}

export async function exportStateTaxToYAML(taxId) {
    try {
        const tax = await taxController.read(taxId);

        const { year, state, filingStatus, taxBrackets } = tax;
        const formatBrackets = (brackets) => {
            return brackets.map(({ lowerBound, upperBound, rate }) => ({
                lowerBound: lowerBound,
                upperBound: upperBound === Infinity ? 'Infinity' : upperBound,
                rate: rate
            }));
        };

        const taxObject = {
            year: year,
            state: state,
            filingStatus: filingStatus,
            rates: formatBrackets(taxBrackets)
        }

        const yamlStr = yaml.dump(taxObject)
        const fileName = `state-tax_${state}_${filingStatus}_${year}`;

        return { yamlStr, fileName };
    } catch (err) {
        throw (err);
    }
}
