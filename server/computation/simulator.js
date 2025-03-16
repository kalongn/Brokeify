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

function updateTaxBracketsForInflation(taxData, inflationRate) { /* ... */ }
function updateContributionLimitsForInflation(scenario, inflationRate) { /* ... */ }
function adjustForInflation(amount, inflationRate, isInflationAdjusted) { /* ... */ }
function shouldPerformRMD(currentYear, birthYear, rmdTable) { /* ... */ }
function processRMDs(investments, rmdTable, currentYear, birthYear) { /* ... */ }
function updateInvestments(investments, inflationRate) { /* ... */ }
function performRothConversion(curYearIncome, curYearSS, federalIncomeTax) { /* ... */ }
function calculateTaxes(federalIncomeTax, stateIncomeTax, capitalGainTax, curYearIncome, curYearSS) { /* ... */ }
function processExpenses(scenario, previousYearTaxes) { /* ... */ }
function processDiscretionaryExpenses(scenario) { /* ... */ }
function processInvestments(scenario, investments) { /* ... */ }
function rebalanceInvestments(scenario, investments) { /* ... */ }


export async function simulate(
    scenario, 
    federalIncomeTax, 
    stateIncomeTax, 
    federalStandardDeduction, 
    stateStandardDeduction, 
    capitalGainTax, 
    rmdTable
) {
    
    let currentYear = 0;
    const realYear = new Date().getFullYear();
    const endYear = scenario.userBirthYear+scenario.userLifeExpectancy - realYear;

    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();

    const investmentTypes = await Promise.all(
        scenario.investmentTypes.map(async (id) => await investmentTypeFactory.read(id))
    );
    
    const investmentIds = investmentTypes.flatMap(type => type.investments);
    
    const investments = await Promise.all(
        investmentIds.map(async (id) => await investmentFactory.read(id))
    );

    
    while (currentYear <= endYear) {
        //console.log(`Simulating year: ${currentYear}`);

        
        const inflationRate = scenario.inflationAssumption;
        updateTaxBracketsForInflation(federalIncomeTax, inflationRate);
        updateTaxBracketsForInflation(stateIncomeTax, inflationRate);
        updateContributionLimitsForInflation(scenario, inflationRate);

        
        let curYearIncome = 0;
        let curYearSS = 0;
        for (const event of scenario.events.filter(e => e.type === "INCOME")) {
            const income = adjustForInflation(event.amount, inflationRate, event.isinflationAdjusted);
            curYearIncome += income;
            if (event.isSocialSecurity) {
                curYearSS += income;
            }
        }

        
        if (shouldPerformRMD(currentYear, scenario.userBirthYear, rmdTable)) {
            const rmd = processRMDs(investments, rmdTable, currentYear, scenario.userBirthYear);
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
