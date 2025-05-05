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

export async function chooseEventTimeframe(scenario) {
    //select timeframes for events
    //check whether invest events overlap, or rebalance events of smae type overlap
    //if so, return false
    //otherwise, return true

    //determine starts/durartions for all events that are not 'start with/after'
    let startWithOrAfterEvents = 0;
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        
        //if it has start year distribution, choose it
        if(event.startYearTypeDistribution===undefined){
            startWithOrAfterEvents++;
            continue;
        }
        const realYear = new Date().getFullYear();
        let startYear = await sample(0, event.startYearTypeDistribution);
        startYear = Math.max(startYear, realYear)
        const duration  = await sample(0, event.durationTypeDistribution);
        
        await eventFactory.update(event._id, {startYear: startYear, duration: duration});

    
    
    }
    //now, choose startWithOrAfterEvents 
    while(startWithOrAfterEvents>0){
        for (const eventIDIndex in scenario.events) {
            const eventID = scenario.events[eventIDIndex];
            const event = await eventFactory.read(eventID);
            
            if(!(event.startsWith!==undefined||event.startsAfter!==undefined)){
                continue;
            }
            //starts with or starts after
            if(event.startsWith!==undefined){
                const refedEvent = await eventFactory.read(event.startsWith);
                const duration  = await sample(0, event.durationTypeDistribution);
                await eventFactory.update(event._id, {startYear: refedEvent.startYear, duration: duration});
            }
            else if(event.startsAfter!==undefined){
                const refedEvent = await eventFactory.read(event.startsAfter);
                const duration  = await sample(0, event.durationTypeDistribution);
                await eventFactory.update(event._id, {startYear: refedEvent.startYear+refedEvent.duration+1, duration: duration});
            }
            startWithOrAfterEvents--;
        
        }
    }




    //finally, do verification for invest events and rebalance events

    //first: invest
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        
        if(event.eventType!=="INVEST"){
            continue;
        }
        for (const eventIDIndex2 in scenario.events) {
            const eventID2 = scenario.events[eventIDIndex2];
            const event2 = await eventFactory.read(eventID2);
            
            if(event2._id.toString()===event._id.toString()){
                continue;
            }
            if(event2.eventType!=="INVEST"){
                continue;
            }

            //check if overlap
            
            if(!(event2.startYear+event2.duration<event.startYear||event.startYear+event.duration<event2.startYear)){   
                return false;
            }
        }
    }
    //next, rebalance:
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        
        if(event.eventType!=="REBALANCE"){
            continue;
        }

        for (const eventIDIndex2 in scenario.events) {
            const eventID2 = scenario.events[eventIDIndex2];
            const event2 = await eventFactory.read(eventID2);
            if(event2._id.toString()===event._id.toString()){
                continue;
            }
            if(event2.eventType!=="REBALANCE"){
                continue;
            }
            if(event2.taxStatus!=event.taxStatus){
                continue;
            }

            //check if overlap
            
            if(!(event2.startYear+event2.duration<event.startYear||event.startYear+event.duration<event2.startYear)){   
                return false;
            }
        }
    }
    return true;


}

export async function chooseLifeExpectancies(scenario){
    
    const userLife = await sample(0, scenario.userLifeExpectancyDistribution);

    if(userLife<0){
        return false;
    }
    await scenarioFactory.update(scenario._id, {userLifeExpectancy: userLife});
    if(scenario.filingStatus==="MARRIEDJOINT"){
        const spouseLife = await sample(0, scenario.spouseLifeExpectancyDistribution);
        if(spouseLife<0){
            return false;
        }
        await scenarioFactory.update(scenario._id, {spouseLifeExpectancy: spouseLife});
    }
    return true;
}
export async function getCashInvestment(investmentTypes) {
    const cashName = "Cash";


    let cashInvestmentType = investmentTypes.find(type => type.name === cashName);

    if (cashInvestmentType) {
        //found, return its associated investment
        const res =  await investmentFactory.read(cashInvestmentType.investments[0]); //assuming it has only one investment
        return {cashInvestment: res, investmentTypes: investmentTypes};
    }
    //not found, create new Cash investment and investment type
    const newCashInvestment = await investmentFactory.create({
        value: 0,
        purchasePrice: 0,
        taxStatus: "CASH"
    });
    const d1 = await distributionFactory.create("FIXED_PERCENTAGE", { value: 0 });
    const d2 = await distributionFactory.create("FIXED_AMOUNT", { value: 0 });

    const newCashInvestmentType = await investmentTypeFactory.create({
        name: cashName,
        description: "Cash holdings",
        expectedAnnualReturn: 0,
        expectedAnnualReturnDistribution: d1._id,
        expenseRatio: 0,
        expectedAnnualIncome: 0,
        expectedAnnualIncomeDistribution: d2._id,
        taxability: false,
        investments: [newCashInvestment._id]
    });



    investmentTypes.push(newCashInvestmentType);

    return {cashInvestment: newCashInvestment, investmentTypes: investmentTypes};
}
export async function setupMap(scenarioID){
    const scenario = await scenarioFactory.read(scenarioID);
    //this function setsup the global map between an investment and it's type
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        for (const investmentIndex in investmentType.investments) {
            invMap.set(investmentType.investments[investmentIndex].toString(), investmentType._id.toString());
            
        }

    }
    return invMap;
}
