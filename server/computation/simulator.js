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
function shouldPerformRMD(currentYear, birthYear, rmdTable, investments) {
    // If the user’s age is at least 74 and at the end of the previous
    // year, there is at least one investment with tax status = “pre-tax” 
    // and with a positive value
    const realYear = new Date().getFullYear();
    const age =  realYear + currentYear - birthYear;
    console.log(investments);
    
    if (age < 74) {
        return false;
    }

    //if there is at least one pre-tax investment with a positive value
    const hasPreTaxInvestment = investments.some(inv => 
        inv.taxStatus === "PRE_TAX_RETIREMENT" && inv.value > 0
    );

    return hasPreTaxInvestment;
}
function processRMDs(investments, rmdTable, currentYear, birthYear) { /* ... */ }
function updateInvestments(investments, inflationRate) { /* ... */ }
function performRothConversion(curYearIncome, curYearSS, federalIncomeTax) { /* ... */ }
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
    
    const investmentIds = investmentTypes.flatMap(type => type.investments);
    
    const investments = await Promise.all(
        investmentIds.map(async (id) => await investmentFactory.read(id))
    );
    const events = await Promise.all(
        simulation.scenario.events.map(async (id) => await eventFactory.read(id))
    );
    //console.log(events);
    //Create empty special cash account:
    


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
            const income = adjustEventIncome(event, inflationRate);
            
            //TODO: Save breakdown of income by event
            event.amount = income;
            curYearIncome += income;
            if (event.isSocialSecurity) {
                curYearSS += income;
            }
        }
        

        
        if (shouldPerformRMD(currentYear, simulation.scenario.userBirthYear, rmdTable, investments)) {
            const rmd = processRMDs(investments, rmdTable, currentYear, simulation.scenario.userBirthYear);
            curYearIncome += rmd;
        }

        
        updateInvestments(investments, inflationRate);

        
        const rothConversion = performRothConversion(curYearIncome, curYearSS, federalIncomeTax);
        curYearIncome += rothConversion;

        
        const previousYearTaxes = calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, curYearIncome, curYearSS);
        processExpenses(scenario, previousYearTaxes);

        
        processDiscretionaryExpenses(scenario);

        
        processInvestments(scenario, investments);

        
        rebalanceInvestments(scenario, investments);

        currentYear++;
    }

    console.log("Simulation complete.");
}
