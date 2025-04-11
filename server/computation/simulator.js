//the big boi

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

let csvFile, logFile;



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
            nameMap.set(inv._id, investmentType.name+":"+inv.taxStatus);
            invIds.push(inv._id)
        }

    }
    let headers = csvContent.length ? csvContent[0] : ['Year']; // First row is the header
    let investmentNames = investments.map(investment => nameMap.get(investment._id));

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

export async function sample(expectedValue, distributionID) {

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
        //console.log((Math.random() * (distribution.upperBound - distribution.lowerBound) + distribution.lowerBound));
        return (Math.random() * (distribution.upperBound - distribution.lowerBound) + distribution.lowerBound)
    }
    else if (distribution.distributionType === 'NORMAL_AMOUNT' || distribution.distributionType === 'NORMAL_PERCENTAGE') {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        //use Box-Muller transform
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        let toReturn = (num * distribution.standardDeviation) + distribution.mean;
        
        return toReturn;
    }

    return expectedValue;

}
async function chooseEventTimeframe(scenario) {
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

async function chooseLifeExpectancies(scenario){
    
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
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const distributionFactory = new DistributionController();


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
export async function adjustEventAmount(event, inflationRate, scenario) {
    //adjusts event.amount for inflation and expected change
    if (event.eventType === "INVEST" || event.eventType === "REBALANCE") {
        return;
    }
    if (event.isinflationAdjusted) {
        event.amount = event.amount * (1 + inflationRate);
    }

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
    const investmentTypes = [];
    const investments = [];
    for (const i in scenario.investmentTypes) {
        const investmentType = await investmentTypeFactory.read(scenario.investmentTypes[i]);
        investmentTypes.push(investmentType);
        for (const j in investmentType.investments) {
            investments.push(await investmentFactory.read(investmentType.investments[j]));
        }
    }
    
    let index = rmdTable.ages.indexOf(age);

    if (index === -1) {
        index = rmdTable.ages.length - 1;
    }

    const distributionPeriod = rmdTable.distributionPeriods[index];
    if (!distributionPeriod) return 0;

    //calculate sum of pretax investment values
    const preTaxInvestments = investments.filter(inv => inv.taxStatus === "PRE_TAX_RETIREMENT");
    const s = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);
    if (s <= 0) return 0;
    const rmd = s / distributionPeriod;

    //process RMD according to orderedRMDStrategy
    let remainingRMD = rmd;
    

    
    for (const investmentId of scenario.orderedRMDStrategy) {
        
        const investment = investmentId.hasOwnProperty('value') ? investmentId : await investmentFactory.read(investmentId);
        
        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const withdrawAmount = Math.min(investment.value, remainingRMD);
        investment.value -= withdrawAmount;
        remainingRMD -= withdrawAmount;
        await investmentFactory.update(investment._id, { value: investment.value });
        //find investment type of investment
        
        let investmentType = null;
        for (const j in investmentTypes) {
            
            for (const i in investmentTypes[j].investments) {
                
                if (investmentTypes[j].investments[i].toString() == investment._id.toString()) {
                    investmentType = investmentTypes[j];
                }
            }
        }
        //now that we have the investmentType, find a NON_RETIREMENT investment
        //create one if it doesn exist
        //deposit the right amount in there
        if (investmentType == null) {
            throw ("In processRMD, investment type is null");
        }
        let foundBool = false;
        for (const i in investmentType.investments) {
            const investment = await investmentFactory.read(investmentType.investments[i]);
            if (investment.taxStatus == "NON_RETIREMENT") {
                await investmentFactory.update(investment._id, { value: investment.value + withdrawAmount });
                foundBool = true;
            }
        }
        if (!foundBool) {
            const createdInvestment = await investmentFactory.create({ taxStatus: "NON_RETIREMENT", value: withdrawAmount });
            investmentType.investments.push(createdInvestment._id);
            await investmentTypeFactory.update(investmentType._id, { investments: investmentType.investments });
        }
        const eventDetails = `Year: ${currentYear} - RMD - Transfering $${Math.ceil(withdrawAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
        if (remainingRMD <= 0) break;
    }

    return rmd;

}
export async function updateInvestments(investmentTypes) {
    let curYearIncome = 0; // Track taxable income for 'non-retirement' investments
    //const investmentFactory = new InvestmentController(); // Initialize DB controller

    // Iterate through investment types
    for (const type of investmentTypes) {
        for (const investmentID of type.investments) {
            
            const investment = investmentID.hasOwnProperty('value') ? investmentID : await investmentFactory.read(investmentID);

            //investmentFactory.read(investmentID);
            //calculate generated income
            let generatedIncome = await sample(type.expectedAnnualIncome, type.expectedAnnualIncomeDistribution);
            //add the income to the investment value
            let distribution = await distributionFactory.read(type.expectedAnnualIncomeDistribution);
            if (distribution.distributionType === "FIXED_AMOUNT" || distribution.distributionType === "UNIFORM_AMOUNT" || distribution.distributionType === "NORMAL_AMOUNT") {
            }
            else {
                generatedIncome = investment.value * (generatedIncome);
            }
            //add income to curYearIncome if 'non-retirement' and 'taxable'
            if (investment.taxStatus === "NON_RETIREMENT" && type.taxability) {
                curYearIncome += generatedIncome;
            }

            investment.value +=generatedIncome


            //calculate value change (growth) based on expected return
            let growth = await sample(type.expectedAnnualReturn, type.expectedAnnualReturnDistribution);
            distribution = await distributionFactory.read(type.expectedAnnualReturnDistribution);
            if (distribution.distributionType === "FIXED_AMOUNT" || distribution.distributionType === "UNIFORM_AMOUNT" || distribution.distributionType === "NORMAL_AMOUNT") {
                investment.value += (growth);
            }
            else {
                investment.value *= (1 + growth);
            }

            //calculate expenses using the average value over the year
            let avgValue = (investment.value + (investment.value / (1 + growth))) / 2;
            let expenses = avgValue * type.expenseRatio;

            //subtract expens
            investment.value -= expenses;
            investment.value = Math.round((investment.value)*100)/100;
            await investmentFactory.update(investment._id, { value: investment.value });
        }
    }

    return curYearIncome;
}
export async function performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, birthYear, orderedRothStrategy, investmentTypes) {


    const age = currentYear - birthYear;

    //compute curYearFedTaxableIncome

    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;

    //find the user's current tax bracket
    
    let taxBracket = federalIncomeTax.taxBrackets.find(bracket =>
        curYearFedTaxableIncome >= bracket.lowerBound && curYearFedTaxableIncome <= bracket.upperBound
    );

    if (!taxBracket) return { curYearIncome, curYearEarlyWithdrawals: 0 }; // No valid tax bracket found

    //upper limit of tax bracket
    const u = taxBracket.upperBound;


    let rc = u - curYearFedTaxableIncome;
    if (rc <= 0) return { curYearIncome, curYearEarlyWithdrawals: 0 }; // No room for Roth conversion

    

    let remainingRC = rc;

    for (const investmentID of orderedRothStrategy) {
        if (remainingRC <= 0) break; // Stop once RC amount is satisfied

        //fetch the investment from DB if needed
        let investment = investmentID.hasOwnProperty('value') ? investmentID : await investmentFactory.read(investmentID);
        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        //find the corresponding investment type
        let investmentType = investmentTypes.find(type => type.investments.some(inv => inv._id.toString() === investment._id.toString()));
        if (!investmentType) continue;

        let transferAmount = Math.min(investment.value, remainingRC);
        investment.value -= transferAmount;
        remainingRC -= transferAmount;

        //find or create an equivalent "AFTER_TAX_RETIREMENT" investment
        let afterTaxInvestment = false;


        for (const investmentID2Index in investmentType.investments) {


            const investmentID2 = investmentType.investments[investmentID2Index];

            let investment2 = investmentID2.hasOwnProperty('value') ? investmentID2 : await investmentFactory.read(investmentID2);

            if (investment2.taxStatus == "AFTER_TAX_RETIREMENT") {
                afterTaxInvestment = investment2;

            }
        }

        if (afterTaxInvestment) {
            afterTaxInvestment.value += transferAmount;
            await investmentFactory.update(afterTaxInvestment._id, { value: afterTaxInvestment.value });
        } else {
            // Create a new after-tax retirement investment under the same type
            const newInvestment = await investmentFactory.create({
                value: transferAmount,
                taxStatus: "AFTER_TAX_RETIREMENT"
            });

            // Add the new investment to the investment type
            investmentType.investments.push(newInvestment._id);
            await investmentFactory.create(newInvestment._id, { value: newInvestment.value });
        }
        

        // Update the original pre-tax investment in DB

        await investmentFactory.update(investment._id, { value: investment.value });
        const eventDetails = `Year: ${currentYear} - ROTH - Transfering $${Math.ceil(transferAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
    }

    //update current year income
    curYearIncome += rc - remainingRC;

    // update early withdrawals if the user is younger than 59
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
            if (bracket.upperBound < curYearFedTaxableIncome) {

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
            if (bracket.upperBound < curYearStateTaxableIncome) {

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
            if (bracket.upperBound < lastYearGains) {

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
    //pay all non discretionary expenses and taxes
    //first: calculate value of all non discretionary expenses:
    let totalExpenses = previousYearTaxes;
    //go through events and add value of all events if type expense and non discretionary

    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        //check if event is in range:
        const realYear = new Date().getFullYear();
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear <= realYear + currentYear)) {
            continue;
        }

        if (event.eventType === "EXPENSE" && event.isDiscretionary === false) {
            totalExpenses += event.amount;
            let eventDetails = `Year: ${currentYear} - EXPENSE - Paying $${Math.ceil(event.amount * 100) / 100} due to event ${event.name}: ${event.description}.\n`;
            updateLog(eventDetails);
        }
    }
    totalExpenses = Math.round((totalExpenses)*100)/100;
    let toReturn = { t: totalExpenses, c: 0 };
    //pay expenses, starting with cash and going to expense strategy:
    //get cash investment:
    let cashInvestment;
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]);
        }

    }
    if (!cashInvestment) {
        console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processExpenses()");
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processExpenses()");
    }
    
    //pay from cash:
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

    //go in order of orderedExpenseWithdrawalStrategy
    for (const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy) {
        if (totalExpenses === 0) {
            return toReturn;
        }
        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);
        //take out as much value as posssible
        if (investment.value > totalExpenses) {
            await investmentFactory.update(investment._id, { value: investment.value -= totalExpenses });
            totalExpenses = 0;
            toReturn.c += totalExpenses;
            return toReturn;
        }
        else {
            totalExpenses -= investment.value;
            toReturn.c += investment.value;
            await investmentFactory.update(investment._id, { value: 0 });
        }

    }
    return toReturn;

    // const a = await investmentFactory.read(cashInvestment._id);
    // console.log(a.value);


}
export async function processDiscretionaryExpenses(scenario, currentYear) { //returns amount not paid
    //first: determine how much value you have above fincncial goal:

    //find amount I want to pay:
    let totalExpenses = 0;
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        const realYear = new Date().getFullYear();
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        if (event.eventType === "EXPENSE" && event.isDiscretionary === true) {
            totalExpenses += event.amount;
        }
    }
    //console.log(`TOTAL DISCRETIONARY EXPENSES: ${totalExpenses}`);
    //find sum of value of investments:
    totalExpenses = Math.round((totalExpenses)*100)/100;
    let totalValue = 0;
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        for (const investmentIndex in investmentType.investments) {
            const investment = await investmentFactory.read(investmentType.investments[investmentIndex]);
            totalValue += investment.value;
        }

    }
    totalValue = Math.round((totalValue)*100)/100;

    let totalInStrategy = 0;
    for (const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy) {

        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);
        
        totalInStrategy += investment.value;

    }
    totalInStrategy = Math.round((totalInStrategy)*100)/100;

    let amountICanPay = Math.max(totalValue - scenario.financialGoal, totalInStrategy);
    if (amountICanPay <= 0) {
        
        return { np: totalExpenses, p: 0, c:0 };
    }
    let toReturn = { np: 0, p: totalExpenses, c: 0 };
    let leftToPay = totalExpenses;
    if (amountICanPay < totalExpenses) {
        toReturn = { np: totalExpenses - amountICanPay, p: amountICanPay, c: 0 };
        leftToPay = amountICanPay;
    }

    
    //determine the expenses you are 'going to pay' in order to log them
    let logToPay = amountICanPay;
    if(logFile!==null){
        for (const eventIDIndex in scenario.events) {
            const eventID = scenario.events[eventIDIndex];
            const event = await eventFactory.read(eventID);
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
            }
        }
    }
    //start from cash:
    let cashInvestment;
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]);
        }

    }
    if (!cashInvestment) {
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
    }

    //pay from cash:
    if (cashInvestment.value >= leftToPay) {
        
        await investmentFactory.update(cashInvestment._id, { value: Math.round((cashInvestment.value - leftToPay)*100)/100 });
        leftToPay = 0;
    }
    else {
        leftToPay -= cashInvestment.value;
        await investmentFactory.update(cashInvestment._id, { value: 0 });

    }
    //go in order of orderedExpenseWithdrawalStrategy
    for (const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy) {
        if (leftToPay === 0) {
            break;
        }
        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);

        //take out as much value as posssible
        if (investment.value > leftToPay) {
            await investmentFactory.update(investment._id, { value: Math.round((investment.value - leftToPay)*100)/100 });
            leftToPay = 0;
            toReturn.c += leftToPay;
            break;
        }
        else {

            leftToPay -= investment.value;
            toReturn.c += investment.value;
            await investmentFactory.update(investment._id, { value: 0 });

        }


    }



    return toReturn;

}
export async function processInvestmentEvents(scenario, currentYear) {
    //cannot include pre-tax-retirement
    //first, get chashinvestment to determine avaliable amount to invest
    //get the invest event (should only be 1)
    //ensure that investing will not lead to a violation of annualPostTaxContributionLimit
    //if so, adjust asset allocation
    //invest amounts

    const realYear = new Date().getFullYear();
    let cashInvestment;
    for (const investmentTypeIDIndex in scenario.investmentTypes) {
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]);
        }

    }
    if (!cashInvestment) {
        console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
    }
    if (cashInvestment.value <= 0) {
        return;
    }

    //get invest event in this time period:
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);

        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }

        if (event.eventType !== "INVEST") {
            continue;
        }

        let amountToInvest = cashInvestment.value - event.maximumCash;
        if (amountToInvest <= 0) {
            return;
        }
        //check to see if all investment are limited, if so, lower total amount:
        let foundNonRetierment = false;
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if (investment.taxStatus === "NON_RETIREMENT") {
                foundNonRetierment = true;
            }
        }
        if (!foundNonRetierment) {
            //change investment amount to be annualPostTaxContributionLimit
            amountToInvest = Math.max(scenario.annualPostTaxContributionLimit, amountToInvest);

        }
        
        await investmentFactory.update(cashInvestment._id, { value: Math.round((cashInvestment.value - amountToInvest)*100)/100 });
        //determine percantage to invest in each:
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            proportions = { ...event.percentageAllocations };
        }
        else if (event.assetAllocationType === "GLIDE") {
            for (const boundsIndex in event.percentageAllocations) {
                let bounds = event.percentageAllocations[boundsIndex];
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


        //calculate B = sum of the amounts to buy of
        //investments with tax status = “after-tax retirement”
        let b = 0;
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                b += tentativeInvestmentAmounts[investmentIDIndex];
            }
        }
        
        if (b > scenario.annualPostTaxContributionLimit) {
            let lbRatio = scenario.annualPostTaxContributionLimit / b;
            //scale down investments and
            //determine proportion taken up by AFTER_TAX_RETIREMENT accounts
            let totalProportion = 0;
            for (const investmentIDIndex in event.allocatedInvestments) {
                const investmentID = event.allocatedInvestments[investmentIDIndex];
                const investment = await investmentFactory.read(investmentID);
                if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                    tentativeInvestmentAmounts[investmentIDIndex] *= lbRatio;
                    totalProportion += proportions[investmentIDIndex];
                }
            }

            let amountToRedistribute = b - scenario.annualPostTaxContributionLimit;
            //redistribute investments in NON_RETIREMENT investments
            for (const investmentIDIndex in event.allocatedInvestments) {
                const investmentID = event.allocatedInvestments[investmentIDIndex];
                const investment = await investmentFactory.read(investmentID);
                if (investment.taxStatus !== "AFTER_TAX_RETIREMENT") {
                    let pro = proportions[investmentIDIndex] / (1 - totalProportion);
                    tentativeInvestmentAmounts[investmentIDIndex] += pro * amountToRedistribute;
                }
            }



        }

        //distribute to all investments
        if(logFile!==null){
            for (const investmentIDIndex in event.allocatedInvestments) {
                const investmentID = event.allocatedInvestments[investmentIDIndex];
                const investment = await investmentFactory.read(investmentID);
                
                await investmentFactory.update(investment._id, { value: Math.round((investment.value + tentativeInvestmentAmounts[investmentIDIndex])*100)/100 });
                //get investment type:
                for (const investmentTypeIDIndex in scenario.investmentTypes) {
                    const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
                    const investmentType = await investmentTypeFactory.read(investmentTypeID);
                    
                    
                    for (const j in investmentType.investments) {
                        
                        
                        if (investmentType.investments[j].toString() == investmentID.toString()) {
                            let eventDetails = `Year: ${currentYear} - INVEST - Investing $${Math.ceil(tentativeInvestmentAmounts[investmentIDIndex] * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                            updateLog(eventDetails);
                            break;
                        }
                        
                    }
                    

                }

            }
        }
        return;
    }




}
export async function rebalanceInvestments(scenario, currentYear) {
    //returns capitalGains created

    //only one rebalance event per tax status

    const realYear = new Date().getFullYear();


    //get rebalance event in this time period:
    let toReturn = 0;
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);

        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }

        if (event.eventType !== "REBALANCE") {
            continue;
        }

        //get total value
        let totalValue = 0;
        const actualValues = []
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            totalValue += investment.value;
            actualValues.push(investment.value);
        }

        //get proportions:
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            proportions = { ...event.percentageAllocations };
        }
        else if (event.assetAllocationType === "GLIDE") {
            for (const boundsIndex in event.percentageAllocations) {
                let bounds = event.percentageAllocations[boundsIndex];
                let ratio = ((realYear + currentYear - event.startYear) / (event.duration));
                let proportion = bounds[1] * ratio + bounds[0] * (1 - ratio);
                proportions.push(proportion);
            }
        }
        //get target values:
        let targetValues = [];
        for (const i in proportions) {
            const p = proportions[i];
            targetValues.push(p * totalValue);
        }
        // console.log(`Actual: ${actualValues}`);
        // console.log(`Target: ${targetValues}`);




        //sell all (keep track of amount sold)
        let amountSold = 0;
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if (targetValues[investmentIDIndex] < actualValues[investmentIDIndex]) {
                //sell difference
                let sellValue = actualValues[investmentIDIndex] - targetValues[investmentIDIndex];
                amountSold += sellValue;

                //get investment type:
                if(logFile!==null){
                    for (const investmentTypeIDIndex in scenario.investmentTypes) {
                        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
                        const investmentType = await investmentTypeFactory.read(investmentTypeID);
                        for (const j in investmentType.investments) {
                            if (investmentType.investments[j].toString() == investmentID.toString()) {
                                let eventDetails = `Year: ${currentYear} - REBALANCE - Selling $${Math.ceil(sellValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                                updateLog(eventDetails);
                            }
                        }

                    }
                }


                investment.value = targetValues[investmentIDIndex];
                
                await investmentFactory.update(investment._id, { value: Math.round((investment.value)*100)/100 });
            }
        }



        //buy:
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if (targetValues[investmentIDIndex] > actualValues[investmentIDIndex]) {
                //buy difference
                let buyValue = targetValues[investmentIDIndex] - actualValues[investmentIDIndex];
                await investmentFactory.update(investment._id, { value: Math.round((targetValues[investmentIDIndex])*100)/100 });
                //get investment type:
                if(logFile!==null){
                    for (const investmentTypeIDIndex in scenario.investmentTypes) {
                        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
                        const investmentType = await investmentTypeFactory.read(investmentTypeID);
                        for (const j in investmentType.investments) {
                            
                            
                            if (investmentType.investments[j] == investmentID) {
                                let eventDetails = `Year: ${currentYear} - REBALANCE - Buying $${Math.ceil(buyValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                                console.log(eventDetails);
                                updateLog(eventDetails);
                            }
                        }

                    }
                }

            }
        }

        //increment toReturn
        toReturn += amountSold;
    }
    return toReturn;
}


export async function simulate(
    scenario,
    federalIncomeTaxArray,
    stateIncomeTaxArray,
    federalStandardDeductionObjectArray,
    capitalGainTaxArray,
    rmdTable,
    csvFileL,
    logFileL
) {
    let federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction;
    if(scenario.filingStatus==="SINGLE"){
        federalIncomeTax = federalIncomeTaxArray[0];
        stateIncomeTax = stateIncomeTaxArray[0];
        capitalGainTax = capitalGainTaxArray[0];
        federalStandardDeduction = federalStandardDeductionObjectArray[0];
    }
    else{
        federalIncomeTax = federalIncomeTaxArray[1];
        stateIncomeTax = stateIncomeTaxArray[1];
        capitalGainTax = capitalGainTaxArray[1];
        federalStandardDeduction = federalStandardDeductionObjectArray[1];
    }

    csvFile = csvFileL;
    logFile = logFileL;
    
    
    const eventTimeframeBool = await chooseEventTimeframe(scenario);
    const chooseLifeExpectanciesBool = await chooseLifeExpectancies(scenario);
    if(eventTimeframeBool===false){
        console.log("Event Selection Failed, returning failed");
        const results = await resultFactory.create({
            resultStatus : 'EVENT_ERROR',
            yearlyResults : []
        })
        return results;
    }
    if(chooseLifeExpectanciesBool===false){
        console.log("Life Expectancies Failed, returning failed");
        const results = await resultFactory.create({
            resultStatus : 'LIFE_ERROR',
            yearlyResults : []
        })
        return results;
    }
    scenario = await scenarioFactory.read(scenario._id);

    const results = await resultFactory.create({
        resultStatus : 'SUCCESS',
        yearlyResults : []
    })

    let currentYear = 0;
    const realYear = new Date().getFullYear();
    
    const endYear = scenario.userBirthYear + scenario.userLifeExpectancy - realYear;


    let investmentTypes = await Promise.all(
        scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
    );
    let cashInvestment = await getCashInvestment(investmentTypes);
    scenario.investmentTypes = investmentTypes.map(type => type._id);
    scenarioFactory.update(scenario._id, scenario);



    
    let investmentIds = investmentTypes.flatMap(type => type.investments);

    let investments = await Promise.all(
        investmentIds.map(async (id) => await investmentFactory.read(id))
    );
    


    let lastYearTaxes = 0;
    let thisYearTaxes = 0;
    let lastYearGains = 0;
    let thisYearGains = 0;
    let curYearIncome = 0;
    let curYearSS = 0;
    let lastYearIncome = 0;
    let lastYearSS = 0;
    let lastYearEarlyWithdrawl = 0;
    while (currentYear <= endYear) {
        curYearIncome = 0;
        curYearSS = 0;
        thisYearGains = 0;
        thisYearTaxes = 0;
        investmentTypes = await Promise.all(
            scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
        );
        investmentIds = investmentTypes.flatMap(type => type.investments);

        investments = await Promise.all(
            investmentIds.map(async (id) => await investmentFactory.read(id))
        );

        const inflationRate = await sample(scenario.inflationAssumption, scenario.inflationAssumptionDistribution);
        const inflationeEventDetails = `Year: ${currentYear} - INFLATION - ${Math.ceil(inflationRate * 1000) / 1000}\n`;
        updateLog(inflationeEventDetails);
        

        //Could change from married to single if spouse dies, so we have to maintain both
        updateTaxBracketsForInflation(federalIncomeTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(federalIncomeTaxArray[1], inflationRate);
        updateTaxBracketsForInflation(stateIncomeTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(stateIncomeTaxArray[1], inflationRate);
        updateTaxBracketsForInflation(capitalGainTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(capitalGainTaxArray[1], inflationRate);
        federalStandardDeductionObjectArray[0].standardDeduction *= (1 + inflationRate);
        federalStandardDeductionObjectArray[1].standardDeduction *= (1 + inflationRate);
        if(scenario.filingStatus==="SINGLE"){
            federalIncomeTax = federalIncomeTaxArray[0];
            stateIncomeTax = stateIncomeTaxArray[0];
            capitalGainTax = capitalGainTaxArray[0];
            federalStandardDeduction = federalStandardDeductionObjectArray[0];
        }
        else{
            federalIncomeTax = federalIncomeTaxArray[1];
            stateIncomeTax = stateIncomeTaxArray[1];
            capitalGainTax = capitalGainTaxArray[1];
            federalStandardDeduction = federalStandardDeductionObjectArray[0];
        }

        await updateContributionLimitsForInflation(scenario, inflationRate);

        

        const events = scenario.events;
        //update events
        for (const i of events) {
            
            const event = await eventFactory.read(i);
            
            if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {
                await adjustEventAmount(event, inflationRate, scenario);
            }
        }
        const incomeByEvent = [];
        
        for (const i of events) {
            
            const event = await eventFactory.read(i);
            if(event.eventType!=="INCOME"){
                
                continue;
            }

            const income = event.amount;

            if (!(event.startYear<=realYear+currentYear&&event.startYear+event.duration>=realYear+currentYear)) {
                continue;
            }

            const incomeEventDetails = `Year: ${currentYear} - INCOME - ${event.name}: ${event.description} - Amount is $${Math.ceil(income * 100) / 100}\n`;
            updateLog(incomeEventDetails);
            event.amount = income;
            
            incomeByEvent.push({
                name: event._id,
                values: income
            });
            
            const a = await investmentFactory.read(cashInvestment._id);

            await investmentFactory.update(cashInvestment._id, { value: a.value + income });



            curYearIncome += income;
            if (event.isSocialSecurity) {
                curYearSS += income;
            }
        }
        const reportedIncome = curYearIncome;


        //await processRMDs(rmdTable, currentYear, scenario.userBirthYear, scenario);
        const shouldPerformRMDs = await shouldPerformRMD(currentYear, scenario.userBirthYear, investments);
        if (shouldPerformRMDs) {
            
            const rmd = await processRMDs(rmdTable, currentYear, scenario.userBirthYear, scenario);

            curYearIncome += rmd;
        }


        curYearIncome += await updateInvestments(investmentTypes);


        const rothConversion = await performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, scenario.userBirthYear, scenario.orderedRothStrategy, investmentTypes);


        curYearIncome += rothConversion.curYearIncome;
        

        
        let earlyWithdrawalTaxPaid = 0;
        const calcTaxReturn = calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction.standardDeduction, lastYearIncome, lastYearSS, lastYearEarlyWithdrawl, lastYearGains, currentYear);
        thisYearTaxes = calcTaxReturn.t;
        earlyWithdrawalTaxPaid = calcTaxReturn.e;
        let nonDiscretionaryExpenses = 0;
        const expensesReturn = await processExpenses(scenario, lastYearTaxes);
        nonDiscretionaryExpenses = expensesReturn.t;
        thisYearGains += expensesReturn.c;    //if you sell investments

        lastYearTaxes = thisYearTaxes;
        //returns amount not paid, paid, and capital gains
        let discretionaryAmountIgnored, discretionaryAmountPaid;
        const processDiscretionaryResult = await processDiscretionaryExpenses(scenario, currentYear);
        discretionaryAmountIgnored = processDiscretionaryResult.np;
        discretionaryAmountPaid = processDiscretionaryResult.p;
        thisYearGains += processDiscretionaryResult.c;
        let totalExpenses = nonDiscretionaryExpenses + discretionaryAmountPaid;

        await processInvestmentEvents(scenario, currentYear);


        thisYearGains += await rebalanceInvestments(scenario, currentYear);
    
        lastYearGains = thisYearGains;
        thisYearGains = 0;


        investmentTypes = await Promise.all(
            scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
        );
        investmentIds = investmentTypes.flatMap(type => type.investments);
        investments = await Promise.all(
            investmentIds.map(async (id) => await investmentFactory.read(id))
        );
        let totalValue = 0;
        for (const investmentIndex in investments) {
            totalValue += investments[investmentIndex].value;
        }
        //console.log(`The net asset value of ${currentYear+realYear} is ${totalValue}`);
        let boolIsViolated = false;
        if (totalValue < scenario.financialGoal) {
            boolIsViolated = true;
        }
        //create array of touples of investment._id, investment.value
        const investmentValuesArray = [];
        for (const investmentIndex in investments) {
            const touple = { id: investments[investmentIndex]._id, value: investments[investmentIndex].value };
            investmentValuesArray.push(touple);
        }
        //create yearly results
        let discretionaryExpensesPercentage = discretionaryAmountPaid;
        if (discretionaryAmountIgnored + discretionaryAmountPaid != 0) {
            discretionaryExpensesPercentage = (discretionaryAmountPaid + 0.0) / (discretionaryAmountIgnored + discretionaryAmountPaid);
        }
        
        const yearlyRes = {
            year: currentYear + realYear,
            inflationRate: inflationRate,
            investmentValues: investmentValuesArray,
            incomeByEvent: incomeByEvent,
            totalIncome: reportedIncome,
            totalExpense: totalExpenses,
            totalTax: lastYearTaxes,    //actually is this year's taxes, but got updated
            earlyWithdrawalTax: earlyWithdrawalTaxPaid,
            totalDiscretionaryExpenses: discretionaryExpensesPercentage,
            isViolated: boolIsViolated
        };

        
        
        results.yearlyResults.push(yearlyRes);

        await resultFactory.update(results._id, { yearlyResults: results.yearlyResults });
        await updateCSV(currentYear, investments, scenario);
        lastYearIncome = curYearIncome;
        lastYearSS = curYearSS;
        lastYearEarlyWithdrawl = rothConversion.curYearEarlyWithdrawals;


        //finally, check if spouse has died (sad)
        //if so, update shared thingies, and tax to be paid
        if(scenario.filingStatus==="MARRIEDJOINT"){
            if(currentYear+realYear>scenario.spouseLifeExpectancy + scenario.spouseBirthYear){
                //spouse died
                const spouseDied = `Year: ${currentYear} - SPOUSE DIED\n`;
                updateLog(spouseDied);
                //update events
                for(const i in scenario.events){
                    const event = await eventFactory.read(scenario.events[i]);
                    if(event.eventType==="INCOME"||event.eventType==="EXPENSE"){
                        //if spouse was 100%, remove it completley
                        if(event.userContributions===0){
                            await eventFactory.delete(event._id);
                        }
                        else{
                            await eventFactory.update(event._id, {amount: event.amount*(event.userContributions)});
                        }
                    }
                }

                //update tax status
                await scenarioFactory.update(scenario._id, {filingStatus: "SINGLE"});

                

            }
        }



        scenario = await scenarioFactory.read(scenario);
        currentYear++;

    }

    
    console.log("Simulation complete.");
    return results;
}
