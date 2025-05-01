import seedrandom from 'seedrandom';
import mongoose from "mongoose";
import { cursorTo } from 'readline';
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
let prng = Math.random;
let distMap = new Map();
export async function sample(expectedValue, distributionID, seed) {

    if (seed !== undefined && seed !== null) {
        //reseed if a new seed is explicitly provided
        prng = seedrandom(seed.toString());
        return;
    }

    let distribution;
    if(distributionID.distributionType!==undefined){
        distribution = distributionID
    }
    else if((distribution = distMap.get(distributionID.toString()))!==undefined){
        //distributuion set in if statement
    }
    else{
        distribution = await distributionFactory.read(distributionID);
        distMap.set(distributionID.toString(), distribution);
    }
    //sample from distribution

    if (distribution === null) {

        return expectedValue;
    }
    
    //depends on distribution type:
    if (distribution.distributionType === 'FIXED_AMOUNT' || distribution.distributionType === 'FIXED_PERCENTAGE') {
        return distribution.value;
    }
    else if (distribution.distributionType === 'UNIFORM_AMOUNT' || distribution.distributionType === 'UNIFORM_PERCENTAGE') {
        return (prng() * (distribution.upperBound - distribution.lowerBound) + distribution.lowerBound)
    }
    else if (distribution.distributionType === 'NORMAL_AMOUNT' || distribution.distributionType === 'NORMAL_PERCENTAGE') {
        let u = 0, v = 0;
        while (u === 0) u = prng();
        while (v === 0) v = prng();
        //use Box-Muller transform
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        let toReturn = (num * distribution.standardDeviation) + distribution.mean;
        
        return toReturn;
    }

    return expectedValue;

}