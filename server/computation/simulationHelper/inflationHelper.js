import seedrandom from 'seedrandom';
import mongoose from "mongoose";
import { cursorTo } from 'readline';
import { sample } from './sample.js';
import { investmentTypeFactory,
        investmentFactory,
        eventFactory,
        scenarioFactory,
        taxFactory,
        simulationFactory,
        distributionFactory,
        resultFactory,
} from './simulationHelper.js';
import { updateCSV, updateLog } from './logHelpers.js';
import { logFile, csvFile } from '../simulator.js';
import { invMap } from './simulationHelper.js';

export function updateTaxBracketsForInflation(taxData, inflationRate) {
    //Multiplies tax brackes by 1+inflationRate
    
    taxData.taxBrackets.forEach(bracket => {
        bracket.lowerBound = Math.floor(bracket.lowerBound * (1 + inflationRate));
        if (bracket.upperBound !== Infinity) {
            bracket.upperBound = Math.round(bracket.upperBound * (1 + inflationRate));
        }
    });


    
}
export async function updateContributionLimitsForInflation(scenario, inflationRate) {
    scenario.annualPreTaxContributionLimit = scenario.annualPreTaxContributionLimit * (1 + inflationRate);
    scenario.annualPostTaxContributionLimit = scenario.annualPostTaxContributionLimit * (1 + inflationRate);
    const res =  scenarioFactory.update(scenario.id, {annualPreTaxContributionLimit: scenario.annualPreTaxContributionLimit, annualPostTaxContributionLimit: scenario.annualPostTaxContributionLimit});
    return scenario;
}