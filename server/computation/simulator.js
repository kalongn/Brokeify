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
            results: []
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
        bracket.lowerBound = Math.round(bracket.lowerBound * (1 + inflationRate));
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
async function adjustEventIncome(event, inflationRate) {
    //adjusts event.amount for inflation and expected change
    if(event.isinflationAdjusted){
        event.amount = event.amount*(1+inflationRate);
    }
    const amountRate = await sample(event.expectedAnnualChange, event.expectedAnnualChangeDistribution);
    event.amount = event.amount*(1+amountRate);
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

    //if there is at least one pre-tax investment with a positive value
    const hasPreTaxInvestment = investments.some(inv => 
        inv.taxStatus === "PRE_TAX_RETIREMENT" && inv.value > 0
    );

    return hasPreTaxInvestment;
}
async function processRMDs(investments, rmdTable, currentYear, birthYear, orderedRMDStrategy) {
    const realYear = new Date().getFullYear();
    const age =  realYear + currentYear - birthYear;

    
    const index = rmdTable.ages.indexOf(age);
    if (index === -1) return 0;

    const distributionPeriod = rmdTable.distributionPeriods[index];
    if (!distributionPeriod) return 0;

    //calculate sum of pretax investment values
    const preTaxInvestments = investments.filter(inv => inv.taxStatus === "PRE_TAX_RETIREMENT");
    const s = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);

    if (s <= 0) return 0; 
    const rmd = s / distributionPeriod;

    //process RMD according to orderedRMDStrategy
    let remainingRMD = rmd;
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
function calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, curYearIncome, curYearSS) { /* ... */ }
function processExpenses(scenario, previousYearTaxes) { /* ... */ }
function processDiscretionaryExpenses(scenario) { /* ... */ }
function processInvestments(scenario, investments) { /* ... */ }
function rebalanceInvestments(scenario, investments) { /* ... */ }


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
    //console.log(simulation);
    let currentYear = 0;
    const realYear = new Date().getFullYear();
    const endYear = simulation.scenario.userBirthYear+simulation.scenario.userLifeExpectancy - realYear;

    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const eventFactory = new EventController();

    const investmentTypes = await Promise.all(
        simulation.scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
    );
    let cashInvestment = await getCashInvestment(investmentTypes);
    
    

    //console.log(investmentTypes);
    //return;
    const investmentIds = investmentTypes.flatMap(type => type.investments);
    
    const investments = await Promise.all(
        investmentIds.map(async (id) => await investmentFactory.read(id))
    );
    const events = await Promise.all(
        simulation.scenario.events.map(async (id) => await eventFactory.read(id))
    );
    



    while (currentYear <= endYear) {
        //console.log(`Simulating year: ${currentYear}`);

        //TODO: implement non-fixed inflation assumptions
        const inflationRate = await sample(simulation.scenario.inflationAssumption, simulation.scenario.inflationAssumptionDistribution);
        updateTaxBracketsForInflation(federalIncomeTax, inflationRate);
        updateTaxBracketsForInflation(stateIncomeTax, inflationRate);
        updateContributionLimitsForInflation(simulation.scenario, inflationRate);

        
        let curYearIncome = 0;
        let curYearSS = 0;

        for (const event of events.filter(e => e.eventType === "INCOME")) {
            const income = await adjustEventIncome(event, inflationRate);
            
            //TODO: Save breakdown of income by event
            event.amount = income;
            cashInvestment.value += income;
            curYearIncome += income;
            if (event.isSocialSecurity) {
                curYearSS += income;
            }
        }
        

        
        if (await shouldPerformRMD(currentYear, simulation.scenario.userBirthYear, rmdTable, investments)) {
            const rmd = await processRMDs(investments, rmdTable, currentYear, simulation.scenario.userBirthYear, simulation.scenario.orderedRMDStrategy);
            curYearIncome += rmd;
        }
        
        curYearIncome += await updateInvestments(investmentTypes, inflationRate);
        
        const rothConversion = await performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, simulation.scenario.userBirthYear, simulation.scenario.orderedRothStrategy, investmentTypes);
        curYearIncome += rothConversion;
        console.log(investmentTypes);
        
        
        const previousYearTaxes = calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, curYearIncome, curYearSS);
        processExpenses(simulation.scenario, previousYearTaxes);

        
        processDiscretionaryExpenses(simulation.scenario);

        
        processInvestments(simulation.scenario, investments);

        
        rebalanceInvestments(simulation.scenario, investments);

        currentYear++;
    }

    console.log("Simulation complete.");
}
