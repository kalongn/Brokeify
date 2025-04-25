import { readFileSync, writeFileSync, existsSync, appendFileSync, fstat } from 'fs';
import seedrandom from 'seedrandom';
import mongoose from "mongoose";
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

import { updateCSV, updateLog } from './logHelpers.js';
import { logFile, csvFile } from './simulator.js';
let prng = Math.random;
export let invMap = new Map();
export async function sample(expectedValue, distributionID, seed) {

    if (seed !== undefined && seed !== null) {
        //reseed if a new seed is explicitly provided
        prng = seedrandom(seed.toString());
        return;
    }

    //sample from distribution

    const distribution = distributionID.distributionType!==undefined ? distributionID : await distributionFactory.read(distributionID);
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
        const startYear = await sample(0, event.startYearTypeDistribution);
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
        return cashInvestmentType.investments[0]; //assuming it has only one investment
    }

    //not found, create new Cash investment and investment type
    const newCashInvestment = await investmentFactory.create({
        value: 0,
        taxStatus: "CASH"
    });

    const newCashInvestmentType = await investmentTypeFactory.create({
        name: cashName,
        description: "Cash holdings",
        expectedAnnualReturn: 0,
        expectedAnnualReturnDistribution: await distributionFactory.create("FIXED_PERCENTAGE", { value: 0 }),
        expenseRatio: 0,
        expectedAnnualIncome: 0,
        expectedAnnualIncomeDistribution: await distributionFactory.create("FIXED_AMOUNT", { value: 0 }),
        taxability: false,
        investments: [newCashInvestment]
    });



    investmentTypes.push(newCashInvestmentType);

    return newCashInvestment;
}
export async function setupMap(scenarioID){
    const scenario = await scenarioFactory.read(scenarioID);
    //this function setsup the global map between an investment and it's type
    const newInvMap = new Map();
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        for (const investmentIndex in investmentType.investments) {
            newInvMap.set(investmentType.investments[investmentIndex].toString(), investmentType._id.toString());
            
        }

    }
    invMap = newInvMap;
    return invMap;
}

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
    await scenarioFactory.update(scenario._id, { annualPreTaxContributionLimit: scenario.annualPreTaxContributionLimit, annualPostTaxContributionLimit: scenario.annualPostTaxContributionLimit });
}
export async function adjustEventAmount(event, inflationRate, scenario, currentYear) {
    //adjusts event.amount for inflation and expected change
    if (event.eventType === "INVEST" || event.eventType === "REBALANCE") {
        return;
    }
    if (event.isinflationAdjusted) {
        event.amount = event.amount * (1 + inflationRate);
    }
    const realYear = new Date().getFullYear();
    if(event.startYear<=realYear+currentYear&&event.startYear+event.duration>=realYear+currentYear){
        let amountRate = await sample(event.expectedAnnualChange, event.expectedAnnualChangeDistribution);
        let distribution = await distributionFactory.read(event.expectedAnnualChangeDistribution);
        if(scenario.filingStatus==="SINGLE"){
            amountRate*=event.userContributions;
        }
        if (distribution.distributionType === "FIXED_AMOUNT" || distribution.distributionType === "UNIFORM_AMOUNT" || distribution.distributionType === "NORMAL_AMOUNT") {     
        }
        else {
            
            amountRate = (amountRate) * event.amount;
        }
        
        event.amount = Math.round((event.amount + amountRate)*100)/100;
    }
    await eventFactory.update(event._id, event);
    return event.amount;
}
export async function shouldPerformRMD(currentYear, birthYear, investments) {
    // If the user’s age is at least 74 and at the end of the previous
    // year, there is at least one investment with tax status = “pre-tax” 
    // and with a positive value
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;
    

    if (age < 74) {
        return false;
    }
    
    //if there is at least one pre-tax investment with a positive value
    const hasPreTaxInvestment = investments.some(inv =>
        inv.taxStatus === "PRE_TAX_RETIREMENT" && inv.value > 0
    );

    return hasPreTaxInvestment;
}
export async function processRMDs(rmdTable, currentYear, birthYear, scenario) {
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;

    //Batch fetch investment types and investments
    const investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    const investmentTypeMap = new Map(investmentTypes.map(type => [type._id.toString(), type]));

    const allInvestmentIds = investmentTypes.flatMap(type => type.investments);
    const allInvestments = await investmentFactory.readMany(allInvestmentIds);
    const investmentMap = new Map(allInvestments.map(inv => [inv._id.toString(), inv]));

    let index = rmdTable.ages.indexOf(age);
    if (index === -1) {
        index = rmdTable.ages.length - 1;
    }

    const distributionPeriod = rmdTable.distributionPeriods[index];
    if (!distributionPeriod) return 0;

    // Calculate sum of pretax investment values
    const preTaxInvestments = allInvestments.filter(inv => inv.taxStatus === "PRE_TAX_RETIREMENT");
    const s = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);
    if (s <= 0) return 0;
    const rmd = s / distributionPeriod;

    // Process RMD according to orderedRMDStrategy
    let remainingRMD = rmd;

    for (const investmentId of scenario.orderedRMDStrategy) {
        const investment = investmentId.hasOwnProperty('value') ? investmentId : investmentMap.get(investmentId.toString());
        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const withdrawAmount = Math.min(investment.value, remainingRMD);
        investment.value -= withdrawAmount;
        remainingRMD -= withdrawAmount;
        await investmentFactory.update(investment._id, { value: investment.value });

        // Find investment type of investment
        const investmentTypeId = invMap.get(investment._id.toString());
        const investmentType = investmentTypeMap.get(investmentTypeId);

        if (!investmentType) {
            throw ("In processRMD, investment type is null");
        }

        // Find a NON_RETIREMENT investment (or create one)
        let foundNonRetirement = false;
        for (const invId of investmentType.investments) {
            const inv = investmentMap.get(invId.toString());
            if (inv && inv.taxStatus === "NON_RETIREMENT") {
                await investmentFactory.update(inv._id, { value: inv.value + withdrawAmount });
                foundNonRetirement = true;
                break;
            }
        }

        if (!foundNonRetirement) {
            const createdInvestment = await investmentFactory.create({ taxStatus: "NON_RETIREMENT", value: withdrawAmount });
            investmentType.investments.push(createdInvestment._id);
            await investmentTypeFactory.update(investmentType._id, { investments: investmentType.investments });
            invMap.set(createdInvestment._id.toString(), investmentType._id.toString());
        }

        const eventDetails = `Year: ${currentYear} - RMD - Transfering $${Math.ceil(withdrawAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
        if (remainingRMD <= 0) break;
    }

    return rmd;
}
export async function updateInvestments(investmentTypes) {
    let curYearIncome = 0; //Track taxable income for 'non-retirement' investments

    //Batch fetch investments and distributions
    const allInvestmentIds = investmentTypes.flatMap(type => type.investments);
    const allInvestments = await investmentFactory.readMany(allInvestmentIds);
    const investmentMap = new Map(allInvestments.map(inv => [inv._id.toString(), inv]));

    const allDistributionIds = investmentTypes.map(type => type.expectedAnnualIncomeDistribution)
        .concat(investmentTypes.map(type => type.expectedAnnualReturnDistribution));
    const distributions = await distributionFactory.readMany(allDistributionIds);
    const distributionMap = new Map(distributions.map(dist => [dist._id.toString(), dist]));

    const updates = []; //array to hold update operations

    //Iterate through investment types
    for (const type of investmentTypes) {
        const expectedAnnualIncomeDistribution = distributionMap.get(type.expectedAnnualIncomeDistribution.toString());
        const expectedAnnualReturnDistribution = distributionMap.get(type.expectedAnnualReturnDistribution.toString());

        for (const investmentID of type.investments) {
            const investment = investmentMap.get(investmentID.toString());

            if (!investment) {
                console.warn(`Investment with ID ${investmentID} not found!`);
                continue;
            }

            //Calculate generated income
            let generatedIncome = await sample(type.expectedAnnualIncome, expectedAnnualIncomeDistribution);
            if (expectedAnnualIncomeDistribution.distributionType !== "FIXED_AMOUNT" &&
                expectedAnnualIncomeDistribution.distributionType !== "UNIFORM_AMOUNT" &&
                expectedAnnualIncomeDistribution.distributionType !== "NORMAL_AMOUNT") {
                generatedIncome = investment.value * (generatedIncome);
            }

            //Add income to curYearIncome if 'non-retirement' and 'taxable'
            if (investment.taxStatus === "NON_RETIREMENT" && type.taxability) {
                curYearIncome += generatedIncome;
            }

            investment.value += generatedIncome;

            //Calculate value change (growth) based on expected return
            let growth = await sample(type.expectedAnnualReturn, expectedAnnualReturnDistribution);
            if (expectedAnnualReturnDistribution.distributionType !== "FIXED_AMOUNT" &&
                expectedAnnualReturnDistribution.distributionType !== "UNIFORM_AMOUNT" &&
                expectedAnnualReturnDistribution.distributionType !== "NORMAL_AMOUNT") {
                investment.value *= (1 + growth);
            } else {
                investment.value += (growth);
            }

            //Calculate expenses using the average value over the year
            let avgValue = (investment.value + (investment.value / (1 + growth))) / 2;
            let expenses = avgValue * type.expenseRatio;

            //Subtract expenses
            investment.value -= expenses;
            investment.value = Math.round((investment.value) * 100) / 100;

            updates.push({
                updateOne: {
                    filter: { _id: investment._id },
                    update: { $set: { value: investment.value } },
                },
            });
        }
    }

    if (updates.length > 0) {
        await mongoose.model('Investment').bulkWrite(updates);
    }

    return curYearIncome;
}
export async function performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, birthYear, orderedRothStrategy, investmentTypes) {

    const age = currentYear - birthYear;
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;

    // Find the user's current tax bracket
    let taxBracket = federalIncomeTax.taxBrackets.find(bracket =>
        curYearFedTaxableIncome >= bracket.lowerBound && curYearFedTaxableIncome <= bracket.upperBound
    );

    if (!taxBracket) return { curYearIncome, curYearEarlyWithdrawals: 0 };

    const u = taxBracket.upperBound;
    let rc = u - curYearFedTaxableIncome;
    if (rc <= 0) return { curYearIncome, curYearEarlyWithdrawals: 0 };

    let remainingRC = rc;

    // Batch fetch investments and build a map for quick access
    const allInvestmentIds = orderedRothStrategy.map(id => typeof id === 'object' ? id._id : id).filter(id => id !== undefined);
    const investments = await investmentFactory.readMany(allInvestmentIds);
    const investmentMap = new Map(investments.map(inv => [inv._id.toString(), inv]));

    // Batch fetch all investments within investment types involved in the strategy
    const allPotentialAfterTaxInvestmentIds = [];
    for (const type of investmentTypes) {
        allPotentialAfterTaxInvestmentIds.push(...type.investments);
    }
    const allPotentialAfterTaxInvestments = await investmentFactory.readMany(allPotentialAfterTaxInvestmentIds);
    const allPotentialAfterTaxInvestmentsMap = new Map(allPotentialAfterTaxInvestments.map(inv => [inv._id.toString(), inv]));


    const investmentTypeMap = new Map(investmentTypes.map(type => [type._id.toString(), type]));


    const investmentUpdates = [];
    const investmentTypeUpdates = [];
    const newInvestments = [];

    for (const investmentId of orderedRothStrategy) {
        if (remainingRC <= 0) break;

        //Ensure investmentId is consistently the ID
        const investmentIdToUse = typeof investmentId === 'object' ? investmentId._id : investmentId;
        let investment = investmentMap.get(investmentIdToUse.toString());

        if (!investment) {
            // If investment is not found in the map, it might be the object itself
            if (investmentId.hasOwnProperty('value') && investmentId.hasOwnProperty('_id') && investmentId.taxStatus === "PRE_TAX_RETIREMENT") {
                investment = investmentId;
            } else {
                console.warn(`Investment with ID ${investmentIdToUse} not found!`);
                continue;
            }
        }

        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const investmentType = investmentTypeMap.get(invMap.get(investment._id.toString()));
        if (!investmentType) continue;
        let transferAmount = Math.min(investment.value, remainingRC);
        investment.value -= transferAmount;
        remainingRC -= transferAmount;

        // Find or create an equivalent "AFTER_TAX_RETIREMENT" investment
        let afterTaxInvestment = null;
        for (const invId of investmentType.investments) {
            const inv = allPotentialAfterTaxInvestmentsMap.get(invId.toString());
            if (inv && inv.taxStatus === "AFTER_TAX_RETIREMENT") {
                afterTaxInvestment = inv;
                break;
            }
        }

        if (afterTaxInvestment) {
            afterTaxInvestment.value += transferAmount;
            investmentUpdates.push({
                updateOne: {
                    filter: { _id: afterTaxInvestment._id },
                    update: { $set: { value: afterTaxInvestment.value } }
                }
            });

        } else {
            //Create a new after-tax retirement investment under the same type
            const newInvestment = {
                value: transferAmount,
                taxStatus: "AFTER_TAX_RETIREMENT"
            };
            const createdInvestment = await investmentFactory.create(newInvestment);
            newInvestments.push(createdInvestment._id);

            // Add the new investment to the investment type
            investmentType.investments.push(createdInvestment._id);
            investmentTypeUpdates.push({
                updateOne: {
                    filter: { _id: investmentType._id },
                    update: { $set: { investments: investmentType.investments } }
                }
            });

            invMap.set(createdInvestment._id.toString(), investmentType._id.toString());
        }

        //Update the original pre-tax investment
        investmentUpdates.push({
            updateOne: {
                filter: { _id: investment._id },
                update: { $set: { value: investment.value } }
            }
        });

        const eventDetails = `Year: ${currentYear} - ROTH - Transfering $${Math.ceil(transferAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
    }

    if (investmentUpdates.length) {
        await mongoose.model('Investment').bulkWrite(investmentUpdates);
    }
    if (investmentTypeUpdates.length) {
        await mongoose.model('InvestmentType').bulkWrite(investmentTypeUpdates);
    }

    //update current year income
    curYearIncome += rc - remainingRC;

    //update early withdrawals if the user is younger than 59
    let curYearEarlyWithdrawals = age < 59 ? rc - remainingRC : 0;

    return { curYearIncome, curYearEarlyWithdrawals };
}
export function calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction, curYearIncome, curYearSS, earlyWithdrawalAmount, lastYearGains, currentYear) {
    //given info, comes up with a single number
    let totalTax = 0;
    //The IRS imposes a 10% penalty on the portion of the distribution that's 
    // included in your gross income, in addition to the regular income tax owed on that amount
    totalTax += .1 * earlyWithdrawalAmount;
    let eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(totalTax * 100) / 100} in early withdrawl tax.\n`;
    updateLog(eventDetails);
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS - federalStandardDeduction;
    const curYearStateTaxableIncome = curYearIncome - curYearSS; //41 states do not tax SS income
    //calculate fed income taxes
    let fedIncomeTax = 0;
    for (const bracketIndex in federalIncomeTax.taxBrackets) {
        const bracket = federalIncomeTax.taxBrackets[bracketIndex];
        

        if (bracket.lowerBound > curYearFedTaxableIncome) {
            break;
        }
        else {
            if (bracket.upperBound < curYearFedTaxableIncome&& bracket.upperBound!==0) {

                fedIncomeTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
                
            }
            else {
                
                fedIncomeTax += (curYearFedTaxableIncome - bracket.lowerBound) * bracket.rate;
                
                break;
            }
        }
    }
    
    eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(fedIncomeTax * 100) / 100} in federal income tax.\n`;
    updateLog(eventDetails);
    totalTax += fedIncomeTax;

    let sIncomeTax = 0;
    //calculate state income taxes:
    for (const bracketIndex in stateIncomeTax.taxBrackets) {
        const bracket = stateIncomeTax.taxBrackets[bracketIndex];
        if (bracket.lowerBound > curYearStateTaxableIncome) {
            break;
        }
        else {
            if (bracket.upperBound < curYearStateTaxableIncome && bracket.upperBound!==0) {

                sIncomeTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else {
                sIncomeTax += (curYearStateTaxableIncome - bracket.lowerBound) * bracket.rate;
                break;
            }
        }
    }
    totalTax += sIncomeTax;
    eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(sIncomeTax * 100) / 100} in state income tax.\n`;
    updateLog(eventDetails);
    //calculate capital gains taxes
    let capitalTax = 0;
    for (const bracketIndex in capitalGainTax.taxBrackets) {
        const bracket = capitalGainTax.taxBrackets[bracketIndex];
        if (bracket.lowerBound > lastYearGains) {
            break;
        }
        else {
            if (bracket.upperBound < lastYearGains&& bracket.upperBound!==0) {

                capitalTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else {
                capitalTax += (lastYearGains - bracket.lowerBound) * bracket.rate;
            }
        }
    }
    eventDetails = `Year: ${currentYear} - TAX - Paying $${Math.ceil(capitalTax * 100) / 100} in capital gains tax.\n`;
    updateLog(eventDetails);
    totalTax += capitalTax;
    totalTax = Math.round((totalTax)*100)/100;
    earlyWithdrawalAmount = Math.round((earlyWithdrawalAmount)*100)/100;
    
    return { t: totalTax, e: .1 * earlyWithdrawalAmount };
}
export async function processExpenses(scenario, previousYearTaxes, currentYear) {
    // Pay all non-discretionary expenses and taxes
    // First: calculate value of all non-discretionary expenses:
    let totalExpenses = previousYearTaxes;
    const expenseBreakdown = [];

    // Batch fetch events
    const eventIds = scenario.events;
    const events = await eventFactory.readMany(eventIds);
    const eventsMap = new Map(events.map(event => [event._id.toString(), event]));

    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            console.warn(`Event with ID ${eventId} not found!`);
            continue;
        }

        const realYear = new Date().getFullYear();
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }

        if (event.eventType === "EXPENSE" && event.isDiscretionary === false) {
            totalExpenses += event.amount;
            let eventDetails = `Year: ${currentYear} - EXPENSE - Paying $${Math.ceil(event.amount * 100) / 100} due to event ${event.name}: ${event.description}.\n`;
            updateLog(eventDetails);
            expenseBreakdown.push({
                name: event.name,
                value: event.amount,
            });
        }
    }

    totalExpenses = Math.round((totalExpenses) * 100) / 100;
    let toReturn = { t: totalExpenses, c: 0, expenseBreakdown: expenseBreakdown };

    // Pay expenses, starting with cash and going to expense strategy:
    // Get cash investment:
    let cashInvestment;
    const investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    for (const investmentType of investmentTypes) {
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]); // Assuming it's the first one
            break;
        }
    }


    if (!cashInvestment) {
        console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processExpenses()");
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processExpenses()");
    }

    

    if (cashInvestment.value >= totalExpenses) {
        await investmentFactory.update(cashInvestment._id, { value: cashInvestment.value -= totalExpenses });
        totalExpenses = 0;
    }
    else {
        totalExpenses -= cashInvestment.value;
        await investmentFactory.update(cashInvestment._id, { value: 0 });
    }
        
    if (totalExpenses === 0) {
        return toReturn;
    }


    // Go in order of orderedExpenseWithdrawalStrategy
    const withdrawalStrategyInvestmentIds = scenario.orderedExpenseWithdrawalStrategy;
    const withdrawalStrategyInvestments = await investmentFactory.readMany(withdrawalStrategyInvestmentIds);
    const withdrawalStrategyInvestmentsMap = new Map(withdrawalStrategyInvestments.map(inv => [inv._id.toString(), inv]));

    const investmentUpdates = [];

    for (const investmentId of withdrawalStrategyInvestmentIds) {
        if (totalExpenses === 0) {
            break;
        }

        const investment = withdrawalStrategyInvestmentsMap.get(investmentId.toString());
        if (!investment) {
            console.warn(`Withdrawal strategy investment with ID ${investmentId} not found!`);
            continue;
        }


        let update = {
            updateOne: {
                filter: { _id: investment._id },
                update: {}
            }
        };

        if (investment.value > totalExpenses) {
            update.updateOne.update = { $set: { value: investment.value - totalExpenses } };
            totalExpenses = 0;
            toReturn.c += totalExpenses;
        } else {
            totalExpenses -= investment.value;
            toReturn.c += investment.value;
            update.updateOne.update = { $set: { value: 0 } };
        }
        investmentUpdates.push(update);
    }

    if (investmentUpdates.length > 0) {
        await mongoose.model('Investment').bulkWrite(investmentUpdates);
    }

    return toReturn;
}
export async function processDiscretionaryExpenses(scenario, currentYear) {
    // First: determine how much value you have above financial goal:

    // Find amount I want to pay:
    const expenseBreakdown = [];
    let totalExpenses = 0;

    // Batch fetch events
    const eventIds = scenario.events;
    const events = await eventFactory.readMany(eventIds);
    const eventsMap = new Map(events.map(event => [event._id.toString(), event]));


    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            console.warn(`Event with ID ${eventId} not found!`);
            continue;
        }

        const realYear = new Date().getFullYear();
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        if (event.eventType === "EXPENSE" && event.isDiscretionary === true) {
            totalExpenses += event.amount;
        }
    }
    // Find sum of value of investments:
    let totalValue = 0;
    const investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    const allInvestmentIds = investmentTypes.flatMap(type => type.investments);
    const investments = await investmentFactory.readMany(allInvestmentIds);
    for (const investment of investments) {
        totalValue += investment.value;
    }
    totalValue = Math.round((totalValue) * 100) / 100;

    // Calculate total in strategy
    let totalInStrategy = 0;
    const strategyInvestments = await investmentFactory.readMany(scenario.orderedExpenseWithdrawalStrategy);
    for (const investment of strategyInvestments) {
        totalInStrategy += investment.value;
    }
    totalInStrategy = Math.round((totalInStrategy) * 100) / 100;

    totalExpenses = Math.round((totalExpenses) * 100) / 100;
    let toReturn = { np: 0, p: totalExpenses, c: 0, expenseBreakdown: expenseBreakdown };
    let leftToPay = totalExpenses;
    let amountICanPay = Math.max(totalValue - scenario.financialGoal, totalInStrategy);


    

    amountICanPay = Math.max(totalValue - scenario.financialGoal, totalInStrategy);
    if (amountICanPay <= 0) {
        return { np: totalExpenses, p: 0, c: 0, expenseBreakdown: expenseBreakdown };
    }

    if (amountICanPay < totalExpenses) {
        toReturn = { np: totalExpenses - amountICanPay, p: amountICanPay, c: 0, expenseBreakdown: expenseBreakdown };
        leftToPay = amountICanPay;
    }

    // Determine the expenses you are 'going to pay' in order to log them
    let logToPay = amountICanPay;
    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            console.warn(`Event with ID ${eventId} not found!`);
            continue;
        }
        const realYear = new Date().getFullYear();
        if (logToPay <= 0) {
            break;
        }
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        if (event.eventType === "EXPENSE" && event.isDiscretionary === true) {
            let eventAmount = Math.min(logToPay, event.amount);
            let eventDetails = `Year: ${currentYear} - EXPENSE - Paying $${Math.ceil(eventAmount * 100) / 100} due to event ${event.name}: ${event.description}.\n`;
            updateLog(eventDetails);
            logToPay -= event.amount;
            expenseBreakdown.push({
                name: event.name,
                value: eventAmount,
            });
        }
    }

    // Start from cash:
    let cashInvestment;
    for (const investmentType of investmentTypes) {
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]); // Assuming it's the first one
            break;
        }
    }


    if (!cashInvestment) {
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
    }

    // Pay from cash:
    if (cashInvestment.value >= leftToPay) {
        await investmentFactory.update(cashInvestment._id, { value: Math.round((cashInvestment.value - leftToPay) * 100) / 100 });
        leftToPay = 0;
    } else {
        leftToPay -= cashInvestment.value;
        await investmentFactory.update(cashInvestment._id, { value: 0 });
    }

    // Go in order of orderedExpenseWithdrawalStrategy
    const orderedInvestments = await investmentFactory.readMany(scenario.orderedExpenseWithdrawalStrategy);
    for (const investment of orderedInvestments) {
        if (leftToPay === 0) {
            break;
        }

        //take out as much value as possible
        if (investment.value > leftToPay) {
            await investmentFactory.update(investment._id, { value: Math.round((investment.value - leftToPay) * 100) / 100 });
            leftToPay = 0;
            toReturn.c += leftToPay;
            break;
        } else {
            leftToPay -= investment.value;
            toReturn.c += investment.value;
            await investmentFactory.update(investment._id, { value: 0 });
        }
    }

    return toReturn;
}
export async function processInvestmentEvents(scenario, currentYear) {
    // Cannot include pre-tax-retirement
    // First, get cashInvestment to determine available amount to invest
    // Get the invest event (should only be 1)
    // Ensure that investing will not lead to a violation of annualPostTaxContributionLimit
    // If so, adjust asset allocation
    // Invest amounts

    const realYear = new Date().getFullYear();

    // Fetch cash investment
    let cashInvestment;
    const investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    for (const investmentType of investmentTypes) {
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]); // Assuming it's the first one
            break;
        }
    }

    if (!cashInvestment) {
        console.error("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processInvestmentEvents()");
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processInvestmentEvents()");
    }
    if (cashInvestment.value <= 0) {
        return;
    }
    // Fetch invest events
    const eventIds = scenario.events;
    const events = await eventFactory.readMany(eventIds);
    const eventsMap = new Map(events.map(event => [event._id.toString(), event]));

    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            console.log(`Event with ID ${eventId} not found!`);
            continue;
        }
        if (event.eventType !== "INVEST") {
            continue;
        }
        
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }

        let amountToInvest = cashInvestment.value - event.maximumCash;
        if (amountToInvest <= 0) {
            return;
        }

        // Fetch allocated investments
        const allocatedInvestmentIds = event.allocatedInvestments;
        const allocatedInvestments = await investmentFactory.readMany(allocatedInvestmentIds);
        const allocatedInvestmentsMap = new Map(allocatedInvestments.map(inv => [inv._id.toString(), inv]));

        // Check if all investments are limited
        let foundNonRetirement = false;
        for (const allocInv of allocatedInvestments) {
            if (allocInv.taxStatus === "NON_RETIREMENT") {
                foundNonRetirement = true;
                break;
            }
        }

        if (!foundNonRetirement) {
            // Change investment amount to be annualPostTaxContributionLimit
            amountToInvest = Math.max(scenario.annualPostTaxContributionLimit, amountToInvest);
        }

        await investmentFactory.update(cashInvestment._id, { value: Math.round((cashInvestment.value - amountToInvest) * 100) / 100 });

        // Determine percentage to invest in each:
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            proportions = { ...event.percentageAllocations };
        } else if (event.assetAllocationType === "GLIDE") {
            for (const bounds of event.percentageAllocations) {
                let ratio = ((realYear + currentYear - event.startYear) / (event.duration));
                let proportion = bounds[1] * ratio + bounds[0] * (1 - ratio);
                proportions.push(proportion);
            }
        }
        let tentativeInvestmentAmounts = [];
        for (const i in proportions) {
            const p = proportions[i];
            tentativeInvestmentAmounts.push(p * amountToInvest);
        }

        // Calculate B = sum of the amounts to buy of investments with tax status = “after-tax retirement”
        let b = 0;
        for (let i = 0; i < allocatedInvestments.length; i++) {
            const investment = allocatedInvestments[i];
            if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                b += tentativeInvestmentAmounts[i];
            }
        }

        if (b > scenario.annualPostTaxContributionLimit) {
            let lbRatio = scenario.annualPostTaxContributionLimit / b;
            // Scale down investments and determine proportion taken up by AFTER_TAX_RETIREMENT accounts
            let totalProportion = 0;
            for (let i = 0; i < allocatedInvestments.length; i++) {
                const investment = allocatedInvestments[i];
                if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                    tentativeInvestmentAmounts[i] *= lbRatio;
                    totalProportion += proportions[i][0];
                }
            }
            let amountToRedistribute = b - scenario.annualPostTaxContributionLimit;
            // Redistribute investments in NON_RETIREMENT investments
            if (totalProportion !== 0) {
                for (let i = 0; i < allocatedInvestments.length; i++) {
                    const investment = allocatedInvestments[i];
                    if (investment.taxStatus !== "AFTER_TAX_RETIREMENT") {
                        let pro = proportions[i][0] / (1 - totalProportion);
                        tentativeInvestmentAmounts[i] += pro * amountToRedistribute;
                    }
                }
            }
        }
        
        // Distribute to all investments
        const investmentUpdates = [];
        for (let i = 0; i < allocatedInvestments.length; i++) {
            const investment = allocatedInvestments[i];
            investmentUpdates.push({
                updateOne: {
                    filter: { _id: investment._id },
                    update: { $set: { value: Math.round((investment.value + tentativeInvestmentAmounts[i]) * 100) / 100 } }
                }
            });

            //get investment type:
            if (logFile !== null) {
                const investmentType = await investmentTypeFactory.read(invMap.get(investment._id.toString()));
                const eventDetails = `Year: ${currentYear} - INVEST - Investing $${Math.ceil(tentativeInvestmentAmounts[i] * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                updateLog(eventDetails);
            }
        }
        if (investmentUpdates.length > 0) {
            await mongoose.model('Investment').bulkWrite(investmentUpdates);
        }
    }
    return;
}
export async function rebalanceInvestments(scenario, currentYear) {
    // Returns capitalGains created

    const realYear = new Date().getFullYear();
    const events = await eventFactory.readMany(scenario.events);
    const eventsMap = new Map(events.map(event => [event._id.toString(), event]));
    // Fetch rebalance events in this time period:
    const eventIds = scenario.events.filter(eventId => {
        const event = eventsMap.get(eventId.toString());
        return event && event.eventType === "REBALANCE" &&
               event.startYear <= realYear + currentYear &&
               event.startYear + event.duration >= realYear + currentYear;
    });

    let totalCapitalGains = 0;

    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            //console.log(`Rebalance event with ID ${eventId} not found!`);
            continue;
        }

        // Fetch all investments involved in this rebalance event
        const investmentIds = event.allocatedInvestments;
        const investments = await investmentFactory.readMany(investmentIds);
        const investmentMap = new Map(investments.map(inv => [inv._id.toString(), inv]));

        // Calculate total value and actual values
        let totalValue = 0;
        const actualValues = investments.map(investment => {
            totalValue += investment.value;
            return investment.value;
        });

        // Determine target values
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            proportions = { ...event.percentageAllocations };
        } else if (event.assetAllocationType === "GLIDE") {
            for (const bounds of event.percentageAllocations) {
                let ratio = ((realYear + currentYear - event.startYear) / (event.duration));
                let proportion = bounds[1] * ratio + bounds[0] * (1 - ratio);
                proportions.push(proportion);
            }
        }
        const targetValues = [];
        for (const i in proportions) {
            const p = proportions[i];
            targetValues.push(p * totalValue);
        }
        const investmentUpdates = [];

        // Sell investments
        let amountSold = 0;
        for (let i = 0; i < investments.length; i++) {
            const investment = investmentMap.get(investments[i]._id.toString());
            if (targetValues[i] < actualValues[i]) {
                let sellValue = actualValues[i] - targetValues[i];
                amountSold += sellValue;

                investmentUpdates.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: Math.round(targetValues[i] * 100) / 100 } }
                    }
                });

                if (logFile !== null) {
                    const investmentType = await investmentTypeFactory.read(invMap.get(investment._id.toString()));
                    const eventDetails = `Year: ${currentYear} - REBALANCE - Selling $${Math.ceil(sellValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                    updateLog(eventDetails);
                }
            }
        }

        if (investmentUpdates.length > 0) {
            await mongoose.model('Investment').bulkWrite(investmentUpdates);
        }

        investmentUpdates.length = 0; // Clear for buy operations

        // Buy investments
        for (let i = 0; i < investments.length; i++) {
            const investment = investmentMap.get(investments[i]._id.toString());
            if (targetValues[i] > actualValues[i]) {
                investmentUpdates.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: Math.round(targetValues[i] * 100) / 100 } }
                    }
                });
                if (logFile !== null) {
                    const investmentType = await investmentTypeFactory.read(invMap.get(investment._id.toString()));
                    const buyValue = targetValues[i] - actualValues[i];
                    const eventDetails = `Year: ${currentYear} - REBALANCE - Buying $${Math.ceil(buyValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                    updateLog(eventDetails);
                }
            }
        }

        if (investmentUpdates.length > 0) {
            await mongoose.model('Investment').bulkWrite(investmentUpdates);
        }

        totalCapitalGains += amountSold;
    }

    return totalCapitalGains;
}