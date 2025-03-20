//the big boi
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

async function sample(expectedValue, distributionID){
    
    //sample from distribution
    const factory = new DistributionController();
    const distribution = await factory.read(distributionID);
    // if(distribution===null){
    //     return expectedValue;
    // }
    console.log(distribution);
    //depends on distribution type:
    if(distribution.distributionType==='FIXED_AMOUNT'||distribution.distributionType=== 'FIXED_PERCENTAGE'){
        return distribution.value;
    }
    else if(distribution.distributionType==='UNIFORM_AMOUNT'||distribution.distributionType=== 'UNIFORM_PERCENTAGE'){
        //console.log((Math.random() * (distribution.upperBound - distribution.lowerBound) + distribution.lowerBound));
        return (Math.random() * (distribution.upperBound - distribution.lowerBound) + distribution.lowerBound)
    }
    else if(distribution.distributionType==='NORMAL_AMOUNT'||distribution.distributionType=== 'NORMAL_PERCENTAGE'){
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random(); 
        //use this weird function i found to approximate normal curve with mean 0 stddev 1
        const num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        let toReturn =  (num * distribution.standardDeviation) + distribution.mean;
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

async function createSimulation(scenario){
    const factory = new SimulationController();
    const ResultFactory = new ResultController();
    try {
        
        const simulation = await factory.create({
            scenario: scenario,
            results: [await ResultFactory.create({
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
function updateContributionLimitsForInflation(scenario, inflationRate) {
    scenario.annualPreTaxContributionLimit = scenario.annualPreTaxContributionLimit * (1+inflationRate);
    scenario.annualPostTaxContributionLimit = scenario.annualPostTaxContributionLimit * (1+inflationRate);
}
async function adjustEventAmount(event, inflationRate) {
    //adjusts event.amount for inflation and expected change
    if(event.isinflationAdjusted){
        event.amount = event.amount*(1+inflationRate);
    }
    
    const amountRate = await sample(event.expectedAnnualChange, event.expectedAnnualChangeDistribution);
    event.amount = event.amount*(1+amountRate);
    const eventFactory = new EventController();
    await eventFactory.update(event.id, event);
    return event.amount;
}
async function shouldPerformRMD(currentYear, birthYear, rmdTable, investments) {
    // If the user’s age is at least 74 and at the end of the previous
    // year, there is at least one investment with tax status = “pre-tax” 
    // and with a positive value
    const realYear = new Date().getFullYear();
    const age =  realYear + currentYear - birthYear;
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
async function processRMDs(investments, rmdTable, currentYear, birthYear, orderedRMDStrategy) {
    const realYear = new Date().getFullYear();
    const age =  realYear + currentYear - birthYear;

    
    let index = rmdTable.ages.indexOf(age);
    
    if (index === -1){
        index = rmdTable.ages.length-1;
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
    for (const investmentId of orderedRMDStrategy) {
        const investment = investments.find(inv => inv._id.toString() === investmentId.toString());
        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const withdrawAmount = Math.min(investment.value, remainingRMD);
        investment.value -= withdrawAmount;
        remainingRMD -= withdrawAmount;

        if (remainingRMD <= 0) break; 
    }

    return rmd; 

}
async function updateInvestments(investmentTypes, inflationRate) {
    let curYearIncome = 0; // Track taxable income for 'non-retirement' investments
    const investmentFactory = new InvestmentController(); // Initialize DB controller

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
            investment.value += generatedIncome;

            //calculate value change (growth) based on expected return
            let growth = await sample(type.expectedAnnualReturn, type.expectedAnnualReturnDistribution);
            investment.value *= (1 + growth);

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
    
    const investmentFactory = new InvestmentController();
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
        
        
        for(const investmentID2Index in investmentType.investments){
            
            
            const investmentID2 = investmentType.investments[investmentID2Index];
            
            let investment2 = investmentID2.hasOwnProperty('value') ? investmentID2 : await investmentFactory.read(investmentID2);
            
            if(investment2.taxStatus=="AFTER_TAX_RETIREMENT"){
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
    }

    //update current year income
    curYearIncome += rc-remainingRC;

    // update early withdrawals if the user is younger than 59
    let curYearEarlyWithdrawals = age < 59 ? rc-remainingRC : 0;

    return { curYearIncome, curYearEarlyWithdrawals };
}
function calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction, stateStandardDeduction, curYearIncome, curYearSS, earlyWithdrawalAmount, lastYearGains) {
    //given info, comes up with a single number
    let totalTax = 0;
    //The IRS imposes a 10% penalty on the portion of the distribution that's 
    // included in your gross income, in addition to the regular income tax owed on that amount
    totalTax+=.1*earlyWithdrawalAmount;
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS - federalStandardDeduction;
    //TODO: Check if this is right?
    const curYearStateTaxableIncome = curYearIncome - curYearSS - stateStandardDeduction; //41 states do not tax SS income
    
    //calculate fed income taxes
    let fedIncomeTax = 0;
    for(const bracketIndex in federalIncomeTax.taxBrackets){
        const bracket = federalIncomeTax.taxBrackets[bracketIndex];
        
        if(bracket.lowerBound>curYearFedTaxableIncome){
            break;
        }
        else{
            if(bracket.upperBound<curYearFedTaxableIncome){
                
                fedIncomeTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else{
                
                fedIncomeTax += (curYearFedTaxableIncome - bracket.lowerBound) * bracket.rate;
            }
        }
    }
    totalTax+=fedIncomeTax;
    
    let sIncomeTax = 0;
    //calculate state income taxes:
    for(const bracketIndex in stateIncomeTax.taxBrackets){
        const bracket = stateIncomeTax.taxBrackets[bracketIndex];
        if(bracket.lowerBound>curYearStateTaxableIncome){
            break;
        }
        else{
            if(bracket.upperBound<curYearStateTaxableIncome){
                
                sIncomeTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else{
                sIncomeTax += (curYearStateTaxableIncome - bracket.lowerBound) * bracket.rate;
            }
        }
    }
    totalTax+=sIncomeTax;
    
    //calculate capital gains taxes
    let capitalTax = 0;
    for(const bracketIndex in capitalGainTax.taxBrackets){
        const bracket = capitalGainTax.taxBrackets[bracketIndex];
        if(bracket.lowerBound>lastYearGains){
            break;
        }
        else{
            if(bracket.upperBound<lastYearGains){
                
                capitalTax += (bracket.upperBound - bracket.lowerBound) * bracket.rate;
            }
            else{
                capitalTax += (lastYearGains - bracket.lowerBound) * bracket.rate;
            }
        }
    }
    totalTax+=capitalTax;

    //console.log(`The total tax for this year is ${totalTax}`);
    return {t: totalTax, e: .1*earlyWithdrawalAmount};
}
async function processExpenses(scenario, previousYearTaxes, currentYear) {
    //pay all non discretionary expenses and taxes
    //first: calculate value of all non discretionary expenses:
    let totalExpenses = previousYearTaxes;
    //go through events and add value of all events if type expense and non discretionary
    const eventFactory = new EventController();
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    for(const eventIDIndex in scenario.events){
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        //check if event is in range:
        const realYear = new Date().getFullYear();
        if(!(event.startYear<=realYear+currentYear&&event.duration+event.startYear<=realYear+currentYear)){
            continue;
        }

        if(event.eventType === "EXPENSE" && event.isDiscretionary === false){
            totalExpenses+=event.amount;
        }   
    }
    let toReturn = totalExpenses;
    //pay expenses, starting with cash and going to expense strategy:
    //get cash investment:
    let cashInvestment;
    for(const investmentTypeIDIndex in scenario.investmentTypes){
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        if(investmentType.name === "Cash"){
            cashInvestment = await investmentFactory.read(investmentType.investments[0]);
        }
        
    }
    if(!cashInvestment){
        console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processExpenses()");
        throw("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processExpenses()");
    }
    //console.log(cashInvestment);
    // console.log(`Before cash withdrawl: ${totalExpenses}`);
    // console.log(`Before cash withdrawl: ${cashInvestment.value}`);
    //pay from cash:
    if(cashInvestment.value>=totalExpenses){
        await investmentFactory.update(cashInvestment.id, {value: cashInvestment.value-=totalExpenses});
        totalExpenses =0;
    }
    else{
        totalExpenses -=cashInvestment.value;
        await investmentFactory.update(cashInvestment.id, {value: 0});
        
    }
    if(totalExpenses === 0){
        return toReturn;
    }
    
    //go in order of orderedExpenseWithdrawalStrategy
    for(const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy){
        if(totalExpenses === 0){
            return toReturn;
        }
        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);
        //take out as much value as posssible
        if(investment.value>totalExpenses){
            await investmentFactory.update(investment.id, {value: investment.value-=totalExpenses});
            totalExpenses =0;
            return toReturn;
        }
        else{
            totalExpenses -=investment.value;
            await investmentFactory.update(investment.id, {value: 0});
        }
        
    }
    return toReturn;

    // const a = await investmentFactory.read(cashInvestment.id);
    // console.log(a.value);


}
async function processDiscretionaryExpenses(scenario, currentYear) { //returns amount not paid
    //first: determine how much value you have above fincncial goal:
    const eventFactory = new EventController();
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    //find amount I want to pay:
    let totalExpenses = 0;
    for(const eventIDIndex in scenario.events){
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        const realYear = new Date().getFullYear();
        if(!(event.startYear<=realYear+currentYear&&event.duration+event.startYear>=realYear+currentYear)){
            continue;
        }
        if(event.eventType === "EXPENSE" && event.isDiscretionary === true){
            totalExpenses+=event.amount;
        }   
    }
    //console.log(`TOTAL DISCRETIONARY EXPENSES: ${totalExpenses}`);
    //find sum of value of investments:
    let totalValue = 0;
    for(const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy){
        
        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);
        
        totalValue+=investment.value;
        
    }
    
    let amountICanPay = totalValue - scenario.financialGoal;
    if(amountICanPay<=0){
        //console.log("No discretionary expenses paid, all incurred");
        return {np: totalExpenses, p: 0};
    }
    let toReturn = {np: 0, p: totalExpenses};
    let leftToPay = totalExpenses;
    if(amountICanPay<totalExpenses){
        toReturn = {np: totalExpenses - amountICanPay, p: amountICanPay};
        leftToPay = amountICanPay;
    }

    //start from cash:
    let cashInvestment;
    for(const investmentTypeIDIndex in scenario.investmentTypes){
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        if(investmentType.name === "Cash"){
            cashInvestment = await investmentFactory.read(investmentType.investments[0]);
        }
        
    }
    if(!cashInvestment){
        console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
        throw("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
    }
    
    //pay from cash:
    if(cashInvestment.value>=leftToPay){
        await investmentFactory.update(cashInvestment.id, {value: cashInvestment.value-=leftToPay});
        leftToPay =0;
    }
    else{
        leftToPay -=cashInvestment.value;
        await investmentFactory.update(cashInvestment.id, {value: 0});
        
    }
    //go in order of orderedExpenseWithdrawalStrategy
    for(const investmentIDIndex in scenario.orderedExpenseWithdrawalStrategy){
        if(leftToPay===0){
            break;
        }
        const investmentID = scenario.orderedExpenseWithdrawalStrategy[investmentIDIndex];
        const investment = await investmentFactory.read(investmentID);
        
        //take out as much value as posssible
        if(investment.value>leftToPay){
            await investmentFactory.update(investment.id, {value: investment.value-=leftToPay});
            leftToPay =0;
            
            break;
        }
        else{
            leftToPay -=investment.value;
            await investmentFactory.update(investment.id, {value: 0});
            
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
    const eventFactory = new EventController();
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const realYear = new Date().getFullYear();
    let cashInvestment;
    for(const investmentTypeIDIndex in scenario.investmentTypes){
        const investmentTypeID = scenario.investmentTypes[investmentTypeIDIndex];
        const investmentType = await investmentTypeFactory.read(investmentTypeID);
        if(investmentType.name === "Cash"){
            cashInvestment = await investmentFactory.read(investmentType.investments[0]);
        }
        
    }
    if(!cashInvestment){
        console.log("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
        throw("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processDiscretionaryExpenses()");
    }
    if(cashInvestment.value<=0){
        return;
    }
    
    //get invest event in this time period:
    for(const eventIDIndex in scenario.events){
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        
        if(!(event.startYear<=realYear+currentYear&&event.duration+event.startYear>=realYear+currentYear)){
            continue;
        }
        
        if(event.eventType !== "INVEST"){
            continue;
        }
        
        let amountToInvest = cashInvestment.value - event.maximumCash;
        if(amountToInvest<=0){
            return;
        }
        //check to see if all investment are limited, if so, lower total amount:
        let foundNonRetierment = false;
        for(const investmentIDIndex in event.allocatedInvestments){
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if(investment.taxStatus==="NON_RETIREMENT"){
                foundNonRetierment=true;
            }
        }
        if(!foundNonRetierment){
            //change investment amount to be annualPostTaxContributionLimit
            amountToInvest = Math.max(scenario.annualPostTaxContributionLimit, amountToInvest);

        }
        await investmentFactory.update(cashInvestment.id, {value: cashInvestment.value - amountToInvest});
        //determine percantage to invest in each:
        let proportions = [];
        if(event.assetAllocationType==="FIXED"){
            proportions = {... event.percentageAllocations};
        }
        else if(event.assetAllocationType==="GLIDE"){
            for(const boundsIndex in event.percentageAllocations){
                let bounds =  event.percentageAllocations[boundsIndex];
                let ratio = ((realYear+currentYear-event.startYear)/(event.duration));
                let proportion = bounds[1]*ratio + bounds[0]*(1-ratio);
                proportions.push(proportion);
            }
        }
        let tentativeInvestmentAmounts = [];
        for(const i in proportions){
            const p = proportions[i];
            tentativeInvestmentAmounts.push(p*amountToInvest);
        }
        
        
        //calculate B = sum of the amounts to buy of
        //investments with tax status = “after-tax retirement”
        let b = 0;
        for(const investmentIDIndex in event.allocatedInvestments){
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if(investment.taxStatus==="AFTER_TAX_RETIREMENT"){
                b+=tentativeInvestmentAmounts[investmentIDIndex];
            }
        }
        //console.log(`b is ${b}`);
        //console.log(scenario.annualPostTaxContributionLimit);
        if(b>scenario.annualPostTaxContributionLimit){
            let lbRatio = scenario.annualPostTaxContributionLimit/b;
            //scale down investments and
            //determine proportion taken up by AFTER_TAX_RETIREMENT accounts
            let totalProportion = 0;
            for(const investmentIDIndex in event.allocatedInvestments){
                const investmentID = event.allocatedInvestments[investmentIDIndex];
                const investment = await investmentFactory.read(investmentID);
                if(investment.taxStatus==="AFTER_TAX_RETIREMENT"){
                    tentativeInvestmentAmounts[investmentIDIndex] *= lbRatio;
                    totalProportion+=proportions[investmentIDIndex];
                }
            }
            
            let amountToRedistribute = b - scenario.annualPostTaxContributionLimit;
            //redistribute investments in NON_RETIREMENT investments
            for(const investmentIDIndex in event.allocatedInvestments){
                const investmentID = event.allocatedInvestments[investmentIDIndex];
                const investment = await investmentFactory.read(investmentID);
                if(investment.taxStatus!=="AFTER_TAX_RETIREMENT"){
                    let pro = proportions[investmentIDIndex]/(1-totalProportion);
                    tentativeInvestmentAmounts[investmentIDIndex]+=pro*amountToRedistribute;
                }
            }

            
            
        }

        //distribute to all investments
        for(const investmentIDIndex in event.allocatedInvestments){
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            await investmentFactory.update(investment.id, {value: investment.value+=tentativeInvestmentAmounts[investmentIDIndex]});
        }
        return;
    }
    

    

}
async function rebalanceInvestments(scenario, currentYear) {
    //returns capitalGains created

    //only one rebalance event per tax status
    const eventFactory = new EventController();
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const realYear = new Date().getFullYear();
    
    
    //get rebalance event in this time period:
    let toReturn = 0;
    for(const eventIDIndex in scenario.events){
        const eventID = scenario.events[eventIDIndex];
        const event = await eventFactory.read(eventID);
        
        if(!(event.startYear<=realYear+currentYear&&event.duration+event.startYear>=realYear+currentYear)){
            continue;
        }
        
        if(event.eventType !== "REBALANCE"){
            continue;
        }
        
        //get total value
        let totalValue = 0;
        const actualValues = []
        for(const investmentIDIndex in event.allocatedInvestments){
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            totalValue+=investment.value;
            actualValues.push(investment.value);
        }
        
        //get proportions:
        let proportions = [];
        if(event.assetAllocationType==="FIXED"){
            proportions = {... event.percentageAllocations};
        }
        else if(event.assetAllocationType==="GLIDE"){
            for(const boundsIndex in event.percentageAllocations){
                let bounds =  event.percentageAllocations[boundsIndex];
                let ratio = ((realYear+currentYear-event.startYear)/(event.duration));
                let proportion = bounds[1]*ratio + bounds[0]*(1-ratio);
                proportions.push(proportion);
            }
        }
        //get target values:
        let targetValues = [];
        for(const i in proportions){
            const p = proportions[i];
            targetValues.push(p*totalValue);
        }
        // console.log(`Actual: ${actualValues}`);
        // console.log(`Target: ${targetValues}`);

        


        //sell all (keep track of amount sold)
        let amountSold = 0;
        for(const investmentIDIndex in event.allocatedInvestments){
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if(targetValues[investmentIDIndex]<actualValues[investmentIDIndex]){
                //sell difference
                amountSold += actualValues[investmentIDIndex] - targetValues[investmentIDIndex];
                investment.value = targetValues[investmentIDIndex];
                await investmentFactory.update(investment.id, {value: investment.value});
            }
        }



        //buy:
        for(const investmentIDIndex in event.allocatedInvestments){
            const investmentID = event.allocatedInvestments[investmentIDIndex];
            const investment = await investmentFactory.read(investmentID);
            if(targetValues[investmentIDIndex]>actualValues[investmentIDIndex]){
                //buy difference
                await investmentFactory.update(investment.id, {value: targetValues[investmentIDIndex]});
            }
        }

        //increment toReturn
        toReturn+=amountSold;
    }
    return toReturn;
}


export async function simulate(
    inputScenario, 
    federalIncomeTax, 
    stateIncomeTax, 
    federalStandardDeduction, 
    stateStandardDeduction, 
    capitalGainTax, 
    rmdTable
) {
    // console.log(rmdTable);
    const simulation = await createSimulation(inputScenario);

    
    let currentYear = 0;
    const realYear = new Date().getFullYear();
    const endYear = simulation.scenario.userBirthYear+simulation.scenario.userLifeExpectancy - realYear;

    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const eventFactory = new EventController();
    const scenarioFactory = new ScenarioController();
    const resultFactory = new ResultController();
    const simulationFactory = new SimulationController();
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

        //TODO: implement non-fixed inflation assumptions
        console.log("sampleing for inflation");
        const inflationRate = await sample(simulation.scenario.inflationAssumption, simulation.scenario.inflationAssumptionDistribution);
        updateTaxBracketsForInflation(federalIncomeTax, inflationRate);
        updateTaxBracketsForInflation(stateIncomeTax, inflationRate);
        updateContributionLimitsForInflation(simulation.scenario, inflationRate);

        
        let curYearIncome = 0;
        let curYearSS = 0;
        //update events
        for(const event of events){
            if(event.eventType === "INCOME"||event.eventType==="EXPENSE"){
                await adjustEventAmount(event, inflationRate);
            }
        }
        
        for (const event of events.filter(e => e.eventType === "INCOME")) {
            const income = event.amount;
            if(!(event.startYear<=realYear+currentYear&&event.duration+event.startYear<=realYear+currentYear)){
                continue;
            }
            //TODO: Save breakdown of income by event
            event.amount = income;
            
            //console.log(`Cash investment: ${cashInvestment.id}`);
            const a = await investmentFactory.read(cashInvestment.id);

            await investmentFactory.update(cashInvestment.id, {value: a.value+income});
            
            
            
            curYearIncome += income;
            if (event.isSocialSecurity) {
                curYearSS += income;
            }
        }
        const reportedIncome = curYearIncome;
        

        
        if (await shouldPerformRMD(currentYear, simulation.scenario.userBirthYear, rmdTable, investments)) {
            //console.log("PERFORMING RMDS");
            const rmd = await processRMDs(investments, rmdTable, currentYear, simulation.scenario.userBirthYear, simulation.scenario.orderedRMDStrategy);
            
            curYearIncome += rmd;
        }
        
        curYearIncome += await updateInvestments(investmentTypes, inflationRate);
        
        const rothConversion = await performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, simulation.scenario.userBirthYear, simulation.scenario.orderedRothStrategy, investmentTypes);
        
        curYearIncome += rothConversion.curYearIncome;
        //console.log(investmentTypes);
        
        let thisYearTaxes = 0;
        let earlyWithdrawalTaxPaid = 0;
        const calcTaxReturn = calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, federalStandardDeduction.standardDeduction, stateStandardDeduction.standardDeduction, curYearIncome, curYearSS, rothConversion.curYearEarlyWithdrawals, lastYearGains);
        thisYearTaxes = calcTaxReturn.t;
        earlyWithdrawalTaxPaid = calcTaxReturn.e;

        let nonDiscretionaryExpenses = await processExpenses(simulation.scenario, lastYearTaxes);
        
        lastYearTaxes = thisYearTaxes;
        //returns amount not paid
        let discretionaryAmountIgnored, discretionaryAmountPaid;
        const processDiscretionaryResult = await processDiscretionaryExpenses(simulation.scenario, currentYear);
        discretionaryAmountIgnored = processDiscretionaryResult.np;
        discretionaryAmountPaid = processDiscretionaryResult.p;
        
        let totalExpenses = nonDiscretionaryExpenses+discretionaryAmountPaid;
        
        await processInvestmentEvents(simulation.scenario, currentYear);

        
        thisYearGains = await rebalanceInvestments(simulation.scenario, currentYear);
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
        for(const investmentIndex in investments){
            totalValue +=  investments[investmentIndex].value;
        }
        console.log(`The net asset value of ${currentYear+realYear} is ${totalValue}`);
        let boolIsViolated = false;
        if(totalValue<simulation.scenario.financialGoal){
            boolIsViolated=true;
        }
        //create array of touples of investment.id, investment.value
        const investmentValuesArray = [];
        for(const investmentIndex in investments){
            const touple = {id: investments[investmentIndex].id, value: investments[investmentIndex].value};
            investmentValuesArray.push(touple);
        }
        //create yearly results
        
        const yearlyRes = {
            year: currentYear+realYear,
            investmentValues: investmentValuesArray,
            totalIncome: reportedIncome,
            totalExpense: totalExpenses,
            totalTax: lastYearTaxes,    //actually is this year's taxes, but got updated
            earlyWithdrawalTax: earlyWithdrawalTaxPaid,
            totalDiscretionaryExpenses: (discretionaryAmountIgnored+discretionaryAmountPaid),
            isViolated: boolIsViolated
        };

        //console.log(`YEAR: ${currentYear}`);
        //console.log(yearlyRes);
        //const results = await resultFactory.read()
        //console.log(simulation.results[0].yearlyResults);
        simulation.results[0].yearlyResults.push(yearlyRes);
        
        await resultFactory.update(simulation.results.id, {yearlyResults: simulation.results.yearlyResults});

        currentYear++;

    }
    //console.log(simulation.results[0].yearlyResults);

    console.log("Simulation complete.");
    return simulation;
}
