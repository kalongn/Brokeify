//Parse state tax files in designated format, save to DB
import yaml from 'js-yaml';
import fs from 'fs';

import TaxController from "../db/controllers/TaxController.js";
const taxController = new TaxController()

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

export async function parseStateTaxYAML(filePath) {
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

        const sing = await taxController.create("STATE_INCOME", singleEntry);
        const mar = await taxController.create("STATE_INCOME", marriedEntry);
        //console.log(`State income tax for ${state} successfully imported.`);
        return [sing._id, mar._id];

    } catch (err) {
        throw (err);
    }

}
