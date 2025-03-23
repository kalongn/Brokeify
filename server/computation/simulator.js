//the big boi

import { readFileSync, writeFileSync, existsSync, appendFileSync,fstat } from 'fs';
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
async function updateCSV(currentYear, investments){
    //takes in current year of simulation and a list of investments
    //if an investment's id is not in the title row, it adds it at the end
    //inserts a row and puts currentYear, followed by investment values
    //console.log(filepath);
    if(csvFile===null||csvFile===undefined){
        return;
    }
    //console.log(currentYear);
    let csvContent = [];
    if (existsSync(csvFile)) {
        csvContent = readFileSync(csvFile, 'utf8').trim().split('\n').map(row => row.split(','));
    }
    
    let headers = csvContent.length ? csvContent[0] : ['Year']; // First row is the header
    let investmentIDs = investments.map(investment=>investment.id);

    //check for missing investment IDs and add them to the headers
    let missingIDs = investmentIDs.filter(id => !headers.includes(id));
    if (missingIDs.length) {
        headers.push(...missingIDs);
    }
    
    //prepare new row
    let newRow = [currentYear];
    for (let i = 1; i < headers.length; i++) {
        const inv = await investmentFactory.read(headers[i]);

        newRow.push(inv.value || 0);
    }

    csvContent.push(newRow);

    //convert back to CSV format and write to file
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    writeFileSync(csvFile, csvString, 'utf8');
}
async function updateLog(eventDetails){
    //const EVENT_TYPE = ['INCOME', 'EXPENSE', 'ROTH', 'RMD', 'TAX', 'INVEST', 'REBALANCE'];
    //details has data based on event type
    if(logFile===null||logFile===undefined){
        return;
    }
    appendFileSync(logFile, eventDetails);

    
}




export async function sample(expectedValue, distributionID) {

    //sample from distribution
    
    const distribution = distributionID.hasOwnProperty('id')? distributionID:await distributionFactory.read(distributionID);
    // console.log(distribution);
    if (distribution === null) {

        return expectedValue;
    }
    // console.log("dist:");
    // console.log(distribution);
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
        //use this weird function i found to approximate normal curve with mean 0 stddev 1
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        let toReturn = (num * distribution.standardDeviation) + distribution.mean;
        // console.log(toReturn);
        // throw("eee");
        return toReturn;
    }

    return expectedValue;

}


async function getCashInvestment(investmentTypes) {
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

async function createSimulation(scenario) {


    try {

        const simulation = await simulationFactory.create({
            scenario: scenario,
            results: [await resultFactory.create({
                yearlyResults: []
            })]
        });

        return simulation;
    } catch (error) {
        console.error(error);

    }

}
function updateTaxBracketsForInflation(taxData, inflationRate) {
    //Multiplies tax brackes by 1+inflationRate
    //console.log(taxData);
    taxData.taxBrackets.forEach(bracket => {
        bracket.lowerBound = Math.floor(bracket.lowerBound * (1 + inflationRate));
        if (bracket.upperBound !== Infinity) {
            bracket.upperBound = Math.round(bracket.upperBound * (1 + inflationRate));
        }
    });


    //console.log(taxData);
}
async function updateContributionLimitsForInflation(scenario, inflationRate) {
    scenario.annualPreTaxContributionLimit = scenario.annualPreTaxContributionLimit * (1 + inflationRate);
    scenario.annualPostTaxContributionLimit = scenario.annualPostTaxContributionLimit * (1 + inflationRate);
    await scenarioFactory.update(scenario.id, { annualPreTaxContributionLimit: scenario.annualPreTaxContributionLimit, annualPostTaxContributionLimit: scenario.annualPostTaxContributionLimit });
}
async function adjustEventAmount(event, inflationRate) {
    //adjusts event.amount for inflation and expected change
    if (event.eventType === "INVEST" || event.eventType === "REBALANCE") {
        return;
    }
    if (event.isinflationAdjusted) {
        event.amount = event.amount * (1 + inflationRate);
    }

    const amountRate = await sample(event.expectedAnnualChange, event.expectedAnnualChangeDistribution);
    event.amount = event.amount * (1 + amountRate);

    await eventFactory.update(event.id, event);
    return event.amount;
}
async function shouldPerformRMD(currentYear, birthYear, rmdTable, investments) {
    // If the user’s age is at least 74 and at the end of the previous
    // year, there is at least one investment with tax status = “pre-tax” 
    // and with a positive value
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;
    //console.log(investments);

    if (age < 74) {
        return false;
    }
    //console.log(investments);
    //if there is at least one pre-tax investment with a positive value
    const hasPreTaxInvestment = investments.some(inv =>
        inv.taxStatus === "PRE_TAX_RETIREMENT" && inv.value > 0
    );

    return hasPreTaxInvestment;
}
async function processRMDs(rmdTable, currentYear, birthYear, scenario) {
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;
    const investmentTypes = [];
    const investments = [];
    for(const i in scenario.investmentTypes){
        const investmentType = await investmentTypeFactory.read(scenario.investmentTypes[i]);
        investmentTypes.push(investmentType); 
        for(const j in investmentType.investments){
            investments.push(await investmentFactory.read(investmentType.investments[j]));
        }
    }
    //console.log(investmentTypes);
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
    //console.log(`RMD must transfer: ${rmd}`);
    
    //console.log(investmentTypes);
    for (const investmentId of scenario.orderedRMDStrategy) {
        //console.log(investmentId);
        const investment = investmentId.hasOwnProperty('value') ? investmentId : await investmentFactory.read(investmentId);
        //console.log(investment);
        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const withdrawAmount = Math.min(investment.value, remainingRMD);
        investment.value -= withdrawAmount;
        remainingRMD -= withdrawAmount;
        await investmentFactory.update(investment.id, { value: investment.value });
        //find investment type of investment
        //console.log("here");
        let investmentType = null;
        for(const j in investmentTypes){
            //console.log(j);
            for(const i in investmentTypes[j].investments){
                // console.log(investment.id.toString());
                // console.log(investmentTypes[j].investments[i].toString());
                if(investmentTypes[j].investments[i].toString()==investment.id.toString()){
                    investmentType = investmentTypes[j];
                }
            }
        }
        //now that we have the investmentType, find a NON_RETIREMENT investment
        //create one if it doesn exist
        //deposit the right amount in there
        if(investmentType==null){
            throw("In processRMD, investment type is null");
        }
        let foundBool = false;
        for(const i in investmentType.investments){
            const investment = await investmentFactory.read(investmentType.investments[i]);
            if(investment.taxStatus=="NON_RETIREMENT"){
                await investmentFactory.update(investment.id, {value: investment.value+withdrawAmount});
                foundBool = true;
            }
        }
        if(!foundBool){
            const createdInvestment = await investmentFactory.create({taxStatus: "NON_RETIREMENT", value:withdrawAmount});
            investmentType.investments.push(createdInvestment.id);
            await investmentTypeFactory.update(investmentType.id, {investments: investmentType.investments});
        }
        const eventDetails = `Year: ${currentYear} - RMD Event - Transfering $${Math.ceil(withdrawAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
        if (remainingRMD <= 0) break;
    }
    
    return rmd;

}
async function updateInvestments(investmentTypes, inflationRate) {
    let curYearIncome = 0; // Track taxable income for 'non-retirement' investments
    //const investmentFactory = new InvestmentController(); // Initialize DB controller

    // Iterate through investment types
    for (const type of investmentTypes) {
        for (const investmentID of type.investments) {
            //console.log(investmentID);
            const investment = investmentID.hasOwnProperty('value') ? investmentID : await investmentFactory.read(investmentID);

            //investmentFactory.read(investmentID);
            //calculate generated income
            let generatedIncome = await sample(type.expectedAnnualIncome, type.expectedAnnualIncomeDistribution);

            //add income to curYearIncome if 'non-retirement' and 'taxable'
            if (investment.taxStatus === "NON_RETIREMENT" && type.taxability) {
                curYearIncome += generatedIncome;
            }

            //add the income to the investment value
            let distribution = await distributionFactory.read(type.expectedAnnualIncomeDistribution);
            if(distribution.distributionType==="FIXED_AMOUNT"||distribution.distributionType==="UNIFORM_AMOUNT"||distribution.distributionType==="NORMAL_AMOUNT"){
                investment.value += (generatedIncome);
            }
            else{
                investment.value *= (1 + generatedIncome);
            }
            

            //calculate value change (growth) based on expected return
            let growth = await sample(type.expectedAnnualReturn, type.expectedAnnualReturnDistribution);
            distribution = await distributionFactory.read(type.expectedAnnualReturnDistribution);
            if(distribution.distributionType==="FIXED_AMOUNT"||distribution.distributionType==="UNIFORM_AMOUNT"||distribution.distributionType==="NORMAL_AMOUNT"){
                investment.value += (growth);
            }
            else{
                investment.value *= (1 + growth);
            }

            //calculate expenses using the average value over the year
            let avgValue = (investment.value + (investment.value / (1 + growth))) / 2;
            let expenses = avgValue * type.expenseRatio;

            //subtract expens
            investment.value -= expenses;

            await investmentFactory.update(investment._id, { value: investment.value });
        }
    }

    return curYearIncome;
}
async function performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, birthYear, orderedRothStrategy, investmentTypes) {


    const age = currentYear - birthYear;

    //compute curYearFedTaxableIncome

    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;

    //find the user's current tax bracket
    //console.log(federalIncomeTax.taxBrackets);
    let taxBracket = federalIncomeTax.taxBrackets.find(bracket =>
        curYearFedTaxableIncome >= bracket.lowerBound && curYearFedTaxableIncome <= bracket.upperBound
    );

    if (!taxBracket) return { curYearIncome, curYearEarlyWithdrawals: 0 }; // No valid tax bracket found

    //upper limit of tax bracket
    const u = taxBracket.upperBound;


    let rc = u - curYearFedTaxableIncome;
    if (rc <= 0) return { curYearIncome, curYearEarlyWithdrawals: 0 }; // No room for Roth conversion
    // console.log("curYearFedTaxableIncome");
    // console.log(curYearFedTaxableIncome);

    //console.log(`Roth converting ${rc}`);

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
            investmentType.investments.push(newInvestment.id);
            await investmentFactory.create(newInvestment._id, { value: newInvestment.value });
        }
        //console.log(investmentTypes);

        // Update the original pre-tax investment in DB

        await investmentFactory.update(investment._id, { value: investment.value });
        const eventDetails = `Year: ${currentYear} - Roth Event - Transfering $${Math.ceil(transferAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
    }

    //update current year income
    curYearIncome += rc - remainingRC;

    // update early withdrawals if the user is younger than 59
    let curYearEarlyWithdrawals = age < 59 ? rc - remainingRC : 0;

    return { curYearIncome, curYearEarlyWithdrawals };
}
function calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction, stateStandardDeduction, curYearIncome, curYearSS, earlyWithdrawalAmount, lastYearGains, currentYear) {
    //given info, comes up with a single number
    let totalTax = 0;
    //The IRS imposes a 10% penalty on the portion of the distribution that's 
    // included in your gross income, in addition to the regular income tax owed on that amount
    totalTax += .1 * earlyWithdrawalAmount;
    let eventDetails = `Year: ${currentYear} - Tax Event - Paying $${Math.ceil(totalTax * 100) / 100} in early withdrawl tax.\n`;
    updateLog(eventDetails);
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS - federalStandardDeduction;
    //TODO: Check if this is right?
    const curYearStateTaxableIncome = curYearIncome - curYearSS - stateStandardDeduction; //41 states do not tax SS income

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
    eventDetails = `Year: ${currentYear} - Tax Event - Paying $${Math.ceil(fedIncomeTax * 100) / 100} in federal income tax.\n`;
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
    eventDetails = `Year: ${currentYear} - Tax Event - Paying $${Math.ceil(sIncomeTax * 100) / 100} in state income tax.\n`;
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
    eventDetails = `Year: ${currentYear} - Tax Event - Paying $${Math.ceil(capitalTax * 100) / 100} in capital gains tax.\n`;
    updateLog(eventDetails);
    totalTax += capitalTax;

    //console.log(`The total tax for this year is ${totalTax}`);
    return { t: totalTax, e: .1 * earlyWithdrawalAmount };
}
async function processExpenses(scenario, previousYearTaxes, currentYear) {
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
            let eventDetails = `Year: ${currentYear} - Expense Event - Paying $${Math.ceil(event.amount * 100) / 100} due to event ${event.name}: ${event.description}.\n`;
            updateLog(eventDetails);
        }
    }
    let toReturn = {t: totalExpenses, c: 0};
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
    //console.log(cashInvestment);
    // console.log(`Before cash withdrawl: ${totalExpenses}`);
    // console.log(`Before cash withdrawl: ${cashInvestment.value}`);
    //pay from cash:
    if (cashInvestment.value >= totalExpenses) {
        await investmentFactory.update(cashInvestment.id, { value: cashInvestment.value -= totalExpenses });
        totalExpenses = 0;
    }
    else {
        totalExpenses -= cashInvestment.value;
        await investmentFactory.update(cashInvestment.id, { value: 0 });

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
            await investmentFactory.update(investment.id, { value: investment.value -= totalExpenses });
            totalExpenses = 0;
            toReturn.c += totalExpenses;
            return toReturn;
        }
        else {
            totalExpenses -= investment.value;
            toReturn.c += investment.value;
            await investmentFactory.update(investment.id, { value: 0 });
        }

    }
    return toReturn;

    // const a = await investmentFactory.read(cashInvestment.id);
    // console.log(a.value);


}
async function processDiscretionaryExpenses(scenario, currentYear) { //returns amount not paid
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
    let totalValue = 0;
    for(const investmentTypeIDIndex in scenario.investmentTypes){
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        for(const investmentIndex in investmentType.investments){
            const investment = await investmentFactory.read(investmentType.investments[investmentIndex]);
            totalValue +=  investment.value;
        }
        
    }


    let totalInStrategy = 0;
    for(const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy){
        
        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);
        //console.log(investment);
        totalInStrategy+=investment.value;
        
    }
    
    
    let amountICanPay = Math.max(totalValue - scenario.financialGoal, totalInStrategy);
    if(amountICanPay<=0){
        //console.log("No discretionary expenses paid, all incurred");
        //console.log(totalValue);
        return {np: totalExpenses, p: 0};
    }
    let toReturn = { np: 0, p: totalExpenses, c:0 };
    let leftToPay = totalExpenses;
    if (amountICanPay < totalExpenses) {
        toReturn = { np: totalExpenses - amountICanPay, p: amountICanPay, c:0 };
        leftToPay = amountICanPay;
    }
    
    //console.log(`toReturn.p: ${toReturn.p}`);
    //determine the expenses you are 'going to pay' in order to log them
    let logToPay = amountICanPay;
    for (const eventIDIndex in scenario.events) {
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        const realYear = new Date().getFullYear();
        if(logToPay<=0){
            break;
        }
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        if (event.eventType === "EXPENSE" && event.isDiscretionary === true) {
            let eventAmount = Math.min(logToPay, event.amount);
            let eventDetails = `Year: ${currentYear} - Expense Event - Paying $${Math.ceil(eventAmount * 100) / 100} due to event ${event.name}: ${event.description}.\n`;
            updateLog(eventDetails);
            logToPay-=event.amount;
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
    if(!cashInvestment){
        //console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
        throw("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
    }

    //pay from cash:
    if (cashInvestment.value >= leftToPay) {
        await investmentFactory.update(cashInvestment.id, { value: cashInvestment.value -= leftToPay });
        leftToPay = 0;
    }
    else {
        leftToPay -= cashInvestment.value;
        await investmentFactory.update(cashInvestment.id, { value: 0 });

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
            await investmentFactory.update(investment.id, { value: investment.value -= leftToPay });
            leftToPay = 0;
            toReturn.c +=leftToPay;
            break;
        }
        else {

            leftToPay -= investment.value;
            toReturn.c +=investment.value;
            await investmentFactory.update(investment.id, { value: 0 });

        }


    }



    return toReturn;

}
async function processInvestmentEvents(scenario, currentYear) {
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
        await investmentFactory.update(cashInvestment.id, { value: cashInvestment.value - amountToInvest });
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
        //console.log(`b is ${b}`);
        //console.log(scenario.annualPostTaxContributionLimit);
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
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            await investmentFactory.update(investment.id, { value: investment.value += tentativeInvestmentAmounts[investmentIDIndex] });
            //get investment type:
            for (const investmentTypeIDIndex in scenario.investmentTypes) {
                const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
                const investmentType = await investmentTypeFactory.read(investmentTypeID);
                for(const j in investmentType.investments){
                    if(investmentType.investments[j]==investmentID){
                        let eventDetails = `Year: ${currentYear} - Invest Event - Investing $${Math.ceil(tentativeInvestmentAmounts[investmentIDIndex] * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                        updateLog(eventDetails);
                    }
                }
        
            }
            
        }
        return;
    }




}
async function rebalanceInvestments(scenario, currentYear) {
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
                for (const investmentTypeIDIndex in scenario.investmentTypes) {
                    const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
                    const investmentType = await investmentTypeFactory.read(investmentTypeID);
                    for(const j in investmentType.investments){
                        if(investmentType.investments[j]==investmentID){
                            let eventDetails = `Year: ${currentYear} - Rebalance Event - Selling $${Math.ceil(sellValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                            updateLog(eventDetails);
                        }
                    }
            
                }

                
                investment.value = targetValues[investmentIDIndex];
                await investmentFactory.update(investment.id, { value: investment.value });
            }
        }



        //buy:
        for (const investmentIDIndex in event.allocatedInvestments) {
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if (targetValues[investmentIDIndex] > actualValues[investmentIDIndex]) {
                //buy difference
                let buyValue = targetValues[investmentIDIndex] - actualValues[investmentIDIndex];
                await investmentFactory.update(investment.id, { value: targetValues[investmentIDIndex] });
                //get investment type:
                for (const investmentTypeIDIndex in scenario.investmentTypes) {
                    const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
                    const investmentType = await investmentTypeFactory.read(investmentTypeID);
                    for(const j in investmentType.investments){
                        if(investmentType.investments[j]==investmentID){
                            let eventDetails = `Year: ${currentYear} - Rebalance Event - Buying $${Math.ceil(buyValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                            updateLog(eventDetails);
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
    inputScenario,
    federalIncomeTax,
    stateIncomeTax,
    federalStandardDeductionObject,
    stateStandardDeductionObject,
    capitalGainTax,
    rmdTable,
    csvFileL,
    logFileL
) {
    csvFile = csvFileL;
    logFile = logFileL;
    //console.log(csvFile);
    // console.log(rmdTable);
    let federalStandardDeduction = federalStandardDeductionObject.standardDeduction;
    let stateStandardDeduction = stateStandardDeductionObject.standardDeduction;

    const simulation = await createSimulation(inputScenario);
    //console.log(simulation);

    let currentYear = 0;
    const realYear = new Date().getFullYear();
    const endYear = simulation.scenario.userBirthYear + simulation.scenario.userLifeExpectancy - realYear;


    let investmentTypes = await Promise.all(
        simulation.scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
    );
    let cashInvestment = await getCashInvestment(investmentTypes);
    simulation.scenario.investmentTypes = investmentTypes.map(type => type.id);
    scenarioFactory.update(simulation.scenario.id, simulation.scenario);



    //console.log(investmentTypes);
    //return;
    let investmentIds = investmentTypes.flatMap(type => type.investments);

    let investments = await Promise.all(
        investmentIds.map(async (id) => await investmentFactory.read(id))
    );
    const events = await Promise.all(
        simulation.scenario.events.map(async (id) => await eventFactory.read(id))
    );


    let lastYearTaxes = 0;
    let thisYearTaxes = 0;
    let lastYearGains = 0;
    let thisYearGains = 0;
    while (currentYear <= endYear) {
        //console.log(`Simulating year: ${currentYear}`);



        const inflationRate = await sample(simulation.scenario.inflationAssumption, simulation.scenario.inflationAssumptionDistribution);
        const inflationeEventDetails = `Year: ${currentYear} - Inflation Rate: ${Math.ceil(inflationRate * 1000) / 1000}\n`;
        updateLog(inflationeEventDetails);
        
        updateTaxBracketsForInflation(federalIncomeTax, inflationRate);
        updateTaxBracketsForInflation(stateIncomeTax, inflationRate);
        await updateContributionLimitsForInflation(simulation.scenario, inflationRate);
        
        federalStandardDeduction*=(1+inflationRate);
        stateStandardDeduction*=(1+inflationRate);

        let curYearIncome = 0;
        let curYearSS = 0;
        //update events
        for (const event of events) {
            if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {
                await adjustEventAmount(event, inflationRate);
            }
        }
        const incomeByEvent = [];
        for (const event of events.filter(e => e.eventType === "INCOME")) {
            const income = event.amount;
            if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear <= realYear + currentYear)) {
                continue;
            }
            const incomeEventDetails = `Year: ${currentYear} - INCOME Event. ${event.name}: ${event.description} - Amount is $${Math.ceil(income * 100) / 100}\n`;
            updateLog(incomeEventDetails);
            event.amount = income;
            incomeByEvent.push({
                name: event.id,
                values: income
            });
            //console.log(`Cash investment: ${cashInvestment.id}`);
            const a = await investmentFactory.read(cashInvestment.id);

            await investmentFactory.update(cashInvestment.id, { value: a.value + income });



            curYearIncome += income;
            if (event.isSocialSecurity) {
                curYearSS += income;
            }
        }
        const reportedIncome = curYearIncome;


        //await processRMDs(rmdTable, currentYear, simulation.scenario.userBirthYear, simulation.scenario);
        if (await shouldPerformRMD(currentYear, simulation.scenario.userBirthYear, rmdTable, investments)) {
            //console.log("PERFORMING RMDS");
            const rmd = await processRMDs(rmdTable, currentYear, simulation.scenario.userBirthYear, simulation.scenario);

            curYearIncome += rmd;
        }


        curYearIncome += await updateInvestments(investmentTypes, inflationRate);


        const rothConversion = await performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, simulation.scenario.userBirthYear, simulation.scenario.orderedRothStrategy, investmentTypes);


        curYearIncome += rothConversion.curYearIncome;
        //console.log(investmentTypes);

        let thisYearTaxes = 0;
        let earlyWithdrawalTaxPaid = 0;
        const calcTaxReturn = calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction, stateStandardDeduction, curYearIncome, curYearSS, rothConversion.curYearEarlyWithdrawals, lastYearGains, currentYear);
        thisYearTaxes = calcTaxReturn.t;
        earlyWithdrawalTaxPaid = calcTaxReturn.e;
        let nonDiscretionaryExpenses = 0;
        const expensesReturn = await processExpenses(simulation.scenario, lastYearTaxes);
        nonDiscretionaryExpenses = expensesReturn.t;
        thisYearGains+=expensesReturn.c;    //if you sell investments

        lastYearTaxes = thisYearTaxes;
        //returns amount not paid
        let discretionaryAmountIgnored, discretionaryAmountPaid;
        const processDiscretionaryResult = await processDiscretionaryExpenses(simulation.scenario, currentYear);
        discretionaryAmountIgnored = processDiscretionaryResult.np;
        discretionaryAmountPaid = processDiscretionaryResult.p;
        thisYearGains+=processDiscretionaryResult.c;
        let totalExpenses = nonDiscretionaryExpenses + discretionaryAmountPaid;

        await processInvestmentEvents(simulation.scenario, currentYear);


        thisYearGains += await rebalanceInvestments(simulation.scenario, currentYear);
        //console.log(thisYearGains);
        lastYearGains = thisYearGains;
        thisYearGains = 0;


        investmentTypes = await Promise.all(
            simulation.scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
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
        if (totalValue < simulation.scenario.financialGoal) {
            boolIsViolated = true;
        }
        //create array of touples of investment.id, investment.value
        const investmentValuesArray = [];
        for (const investmentIndex in investments) {
            const touple = { id: investments[investmentIndex].id, value: investments[investmentIndex].value };
            investmentValuesArray.push(touple);
        }
        //create yearly results
        let discretionaryExpensesPercentage = discretionaryAmountPaid;
        if(discretionaryAmountIgnored+discretionaryAmountPaid!=0){
            discretionaryExpensesPercentage=(discretionaryAmountPaid+0.0)/(discretionaryAmountIgnored+discretionaryAmountPaid);
        }
        //console.log(discretionaryAmountPaid);
        const yearlyRes = {
            year: currentYear + realYear,
            investmentValues: investmentValuesArray,
            incomeByEvent: incomeByEvent,
            totalIncome: reportedIncome,
            totalExpense: totalExpenses,
            totalTax: lastYearTaxes,    //actually is this year's taxes, but got updated
            earlyWithdrawalTax: earlyWithdrawalTaxPaid,
            totalDiscretionaryExpenses: discretionaryExpensesPercentage,
            isViolated: boolIsViolated
        };

        //console.log(`YEAR: ${currentYear}`);
        //console.log(yearlyRes);
        
        //const results = await resultFactory.read()
        //console.log(simulation.results[0].yearlyResults);
        simulation.results[0].yearlyResults.push(yearlyRes);

        await resultFactory.update(simulation.results.id, { yearlyResults: simulation.results.yearlyResults });
        await updateCSV(currentYear, investments);
        currentYear++;

    }
    
    //console.log(simulation.results[0].yearlyResults);

    console.log("Simulation complete.");
    return simulation.results[0];
}
