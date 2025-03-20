//This component parses a user's request, calls to db or scraper to attain
//and compile RMD tables and Tax info, creates worker threads, then calls simulate()

//Note: This is not a very efficient approach, but it does make the code simpler
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

import { scrapeFederalIncomeTaxBrackets, scrapeStandardDeductions, fetchCapitalGainsData, fetchRMDTable } from "./scraper.js";
import { simulate } from "./simulator.js";
async function validate(scenarioID){
    
}
async function scrape(){
    //check to see if federalIncomeTax, federalStandardDeduction, capitalGains exist
    //scrape, parse, and save to DB if not
    let factory = new TaxController();
    const a = await factory.readAll();
    //console.log(a);
    //check if any of the returned taxes have FEDERAL_INCOME, scrape if not
    let federalIncomeSingle = null;
    let federalIncomeMarried = null;
    let capitalGainsSingle = null;
    let capitalGainsMarried = null;
    let federalDeductionSingle = null;
    let federalDeductionMarried = null;
    for(const i in a){
        if(a[i].taxType==="FEDERAL_INCOME"&&a[i].filingStatus==="SINGLE"){
            federalIncomeSingle = a[i];
        }
    }
    for(const i in a){
        if(a[i].taxType==="FEDERAL_INCOME"&&a[i].filingStatus==="MARRIEDJOINT"){
            federalIncomeMarried = a[i];
        }
    }

    //check if any of the returned taxes have CAPITAL_GAIN, scrape if not
    for(const i in a){
        if(a[i].taxType==="CAPITAL_GAIN"&&a[i].filingStatus==="SINGLE"){
            capitalGainsSingle = a[i];
        }
    }
    for(const i in a){
        if(a[i].taxType==="CAPITAL_GAIN"&&a[i].filingStatus==="MARRIEDJOINT"){
            capitalGainsMarried = a[i];
        }
    }

    //check if any of the returned taxes have FEDERAL_STANDARD, scrape if not
    for(const i in a){
        if(a[i].taxType==="FEDERAL_STANDARD"&&a[i].filingStatus==="SINGLE"){
            federalDeductionSingle = a[i];
        }
    }
    for(const i in a){
        if(a[i].taxType==="FEDERAL_STANDARD"&&a[i].filingStatus==="MARRIEDJOINT"){
            federalDeductionMarried = a[i];
        }
    }

    if(federalIncomeSingle===null||federalIncomeMarried===null){
        //scrape:
        const returnFederalIncomeScrape = await scrapeFederalIncomeTaxBrackets();
        //console.log(returnFederalIncomeScrape);
        //only care about single & married joint

        //first, parse single:
        if(federalIncomeSingle===null){
            let singleFedTax = {filingStatus: "SINGLE",  taxType: "FEDERAL_INCOME", taxBrackets: []};
            for(const i in returnFederalIncomeScrape[0]){
                const bracket = {lowerBound: returnFederalIncomeScrape[0][i].lowBound, upperBound: returnFederalIncomeScrape[0][i].highBound, rate: returnFederalIncomeScrape[0][i].rate};
                singleFedTax.taxBrackets.push(bracket);
            }
            //save to db
            //console.log(singleFedTax);
            await factory.create("FEDERAL_INCOME", {
                filingStatus: singleFedTax.filingStatus,
                taxBrackets: singleFedTax.taxBrackets
            });
            federalIncomeSingle =singleFedTax; 
        }
        if(federalIncomeMarried===null){
            let marriedFedTax = {filingStatus: "MARRIEDJOINT",  taxType: "FEDERAL_INCOME", taxBrackets: []};
            for(const i in returnFederalIncomeScrape[0]){
                const bracket = {lowerBound: returnFederalIncomeScrape[1][i].lowBound, upperBound: returnFederalIncomeScrape[1][i].highBound, rate: returnFederalIncomeScrape[1][i].rate};
                marriedFedTax.taxBrackets.push(bracket);
            }
            //save to db
            //console.log(marriedFedTax);
            await factory.create("FEDERAL_INCOME", {
                filingStatus: marriedFedTax.filingStatus,
                taxBrackets: marriedFedTax.taxBrackets
            });
            federalIncomeMarried =marriedFedTax; 
        }

    }

    if(capitalGainsSingle===null||capitalGainsMarried===null){
        const returnCapitalGainsScrape = await fetchCapitalGainsData();
        
        //console.log(returnCapitalGainsScrape);
        if(capitalGainsSingle===null){
            let singleCapitalTax = {filingStatus: "SINGLE",  taxType: "CAPITAL_GAIN", taxBrackets: []};
            for(const i in returnCapitalGainsScrape[0]){
                const bracket = {lowerBound: returnCapitalGainsScrape[0][i].lowBound, upperBound: returnCapitalGainsScrape[0][i].highBound, rate: returnCapitalGainsScrape[0][i].rate};
                singleCapitalTax.taxBrackets.push(bracket);
            }
            //save to db
            //console.log(singleFedTax);
            await factory.create("CAPITAL_GAIN", {
                filingStatus: singleCapitalTax.filingStatus,
                taxBrackets: singleCapitalTax.taxBrackets
            });
            capitalGainsSingle =singleCapitalTax; 
        }
        if(capitalGainsMarried===null){
            let marriedCapitalTax = {filingStatus: "MARRIEDJOINT",  taxType: "CAPITAL_GAIN", taxBrackets: []};
            for(const i in returnCapitalGainsScrape[0]){
                const bracket = {lowerBound: returnCapitalGainsScrape[1][i].lowBound, upperBound: returnCapitalGainsScrape[1][i].highBound, rate: returnCapitalGainsScrape[1][i].rate};
                marriedCapitalTax.taxBrackets.push(bracket);
            }
            //save to db
            await factory.create("CAPITAL_GAIN", {
                filingStatus: marriedCapitalTax.filingStatus,
                taxBrackets: marriedCapitalTax.taxBrackets
            });
            capitalGainsMarried =marriedCapitalTax; 
        }
    }
    
    if(federalDeductionSingle===null||federalDeductionMarried===null){
        const returnDeductionsScrape = await scrapeStandardDeductions();
        
        //console.log(returnDeductionsScrape);
        if(federalDeductionSingle===null){
            federalDeductionSingle = await factory.create("FEDERAL_STANDARD", {
                filingStatus: "SINGLE",
                standardDeduction: returnDeductionsScrape[0].amount
            });
        }
        if(federalDeductionMarried===null){
            federalDeductionMarried = await factory.create("FEDERAL_STANDARD", {
                filingStatus: "MARRIEDJOINT",
                standardDeduction: returnDeductionsScrape[1].amount
            });
        }
    }
    // const b = await factory.readAll();
    // console.log(b);

    //check for RMD table:
    let rmdTable = null;
    let rmdFactory = new RMDTableController();
    rmdTable = await rmdFactory.read();
    //console.log(rmdTable);
    if(rmdTable===null){
        const rmdScrapeReturn = await fetchRMDTable();
        //console.log(rmdScrapeReturn);
        rmdTable = await rmdFactory.create({
            ages: rmdScrapeReturn.ages,
            distributionPeriods: rmdScrapeReturn.distributions
        });
    }
    //return:
    return {
        federalIncomeSingle, 
        federalIncomeMarried, 
        capitalGainsSingle, 
        capitalGainsMarried,
        federalDeductionSingle,
        federalDeductionMarried,
        rmdTable
    }


    

}
async function clone(scenarioID){
    //deep clone scenario
    //Clone Investments
    //Clone Investment Types
    //Clone Events

    //Change ref Ids in:
    //orderedSpendingStrategy
    //orderedExpenseWithdrawalStrategy
    //orderedRMDStrategy
    //orderedRothStrategy

    //The following code was initially written by ChatGPT with the prompt:
    /*
        Write me a function that does a deep clone of scenario, making sure to clone 
        investments, Investment Types, and events. Also, ensure that
        ref ids are changed in orderedSpendingStrategy, orderedExpenseWithdrawalStrategy,
        orderedRMDStrategy, orderedRothStrategy: {pasted in scenario schema}
    */
    /*
        Takeaways: 
        - ChatGPT did not understand the structure of a database, or our controllers
        - Did a decent job at using javascript functionality

    */
   
    const scenarioFactory = new ScenarioController();
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const eventFactory = new EventController();
    const unmodifiedScenario = await scenarioFactory.read(scenarioID);
    const originalScenario = await unmodifiedScenario.populate('investmentTypes events orderedSpendingStrategy orderedExpenseWithdrawalStrategy orderedRMDStrategy orderedRothStrategy');
    // console.log("ORIGINAL")
    // console.log(originalScenario);
    
    if (!originalScenario) {
        throw new Error('Scenario not found');
    }
    //console.log(originalScenario);
    const idMap = new Map();
    
    // Clone Investment Types and Investments
    const clonedInvestmentTypes = await Promise.all(
        originalScenario.investmentTypes.map(async (typeId) => {
            const type = await investmentTypeFactory.read(typeId);
            if (!type) return null;

            const clonedInvestments = await Promise.all(
                type.investments.map(async (invId) => {
                    const investment = await investmentFactory.read(invId);
                    if (!investment) return null;

                    const clonedInvestment = await investmentFactory.create({
                        value: investment.value,
                        taxStatus: investment.taxStatus,
                    });

                    idMap.set(invId.toString(), clonedInvestment.id);
                    return clonedInvestment.id;
                })
            );

            const clonedType = await investmentTypeFactory.create({
                name: type.name,
                description:type.description,
                expectedAnnualReturn:type.expectedAnnualReturn,
                expectedAnnualReturnDistribution: type.expectedAnnualReturnDistribution,
                expenseRatio: type.expenseRatio,
                expectedAnnualIncome: type.expectedAnnualIncome,
                expectedAnnualIncomeDistribution: type.expectedAnnualIncomeDistribution,
                taxability: type.taxability,
                investments: clonedInvestments.filter(Boolean),
            });

            idMap.set(typeId.toString(), clonedType.id);
            return clonedType.id;
        })
    );

    // Clone Events
    const clonedEvents = await Promise.all(
        originalScenario.events.map(async (eventId) => {
            const event = await eventFactory.read(eventId);
            if (!event) return null;
            //console.log({...event});
            let clonedEvent = null;
            if(event.eventType==="REBALANCE"){
                clonedEvent = await eventFactory.create(event.eventType, {
                    eventType: event.eventType,
                    name: event.name,
                    description: event.description,
                    startYear: event.startYear,
                    startYearTypeDistribution: event.startYearTypeDistribution,
                    duration: event.duration,
                    durationTypeDistribution: event.durationTypeDistribution,
                    assetAllocationType: event.assetAllocationType,
                    percentageAllocations: event.percentageAllocations, 
                    allocatedInvestments: event.allocatedInvestments.map(id => idMap.get(id.toString())),
                    maximumCash: event.maximumCash,
                    taxStatus: event.taxStatus
                });
            }
            if(event.eventType==="INVEST"){
                clonedEvent = await eventFactory.create(event.eventType, {
                    eventType: event.eventType,
                    name: event.name,
                    description: event.description,
                    startYear: event.startYear,
                    startYearTypeDistribution: event.startYearTypeDistribution,
                    duration: event.duration,
                    durationTypeDistribution: event.durationTypeDistribution,
                    assetAllocationType: event.assetAllocationType,
                    percentageAllocations: event.percentageAllocations, 
                    allocatedInvestments: event.allocatedInvestments.map(id => idMap.get(id.toString())),
                    maximumCash: event.maximumCash,
                });
            }
            if(event.eventType==="INCOME"){
                clonedEvent = await eventFactory.create(event.eventType, {
                    eventType: event.eventType,
                    name: event.name,
                    description: event.description,
                    startYear: event.startYear,
                    startYearTypeDistribution: event.startYearTypeDistribution,
                    duration: event.duration,
                    durationTypeDistribution: event.durationTypeDistribution,
                    amount: event.amount,
                    expectedAnnualChange: event.expectedAnnualChange,
                    expectedAnnualChangeDistribution: event.expectedAnnualChangeDistribution,
                    isinflationAdjusted: event.isinflationAdjusted,
                    userContributions: event.userContributions,
                    spouseContributions:event.spouseContributions,
                    isSocialSecurity: event.isSocialSecurity,
                });
            }
            if(event.eventType==="EXPENSE"){
                clonedEvent = await eventFactory.create(event.eventType, {
                    eventType: event.eventType,
                    name: event.name,
                    description: event.description,
                    startYear: event.startYear,
                    startYearTypeDistribution: event.startYearTypeDistribution,
                    duration: event.duration,
                    durationTypeDistribution: event.durationTypeDistribution,
                    amount: event.amount,
                    expectedAnnualChange:event.expectedAnnualChange,
                    expectedAnnualChangeDistribution:event.expectedAnnualChangeDistribution,
                    isinflationAdjusted: event.isinflationAdjusted,
                    userContributions: event.userContributions,
                    spouseContributions: event.spouseContributions,
                    isDiscretionary: event.isDiscretionary,
                });
            }
            

            idMap.set(eventId.toString(), clonedEvent.id);
            return clonedEvent.id;
        })
    );

    // Clone Scenario
    //console.log(`CLONING: ${originalScenario.inflationAssumptionDistribution}`);
    const clonedScenario = await scenarioFactory.create({
        name: `${originalScenario.name} CLONE`,
        filingStatus: originalScenario.filingStatus,
        userBirthYear: originalScenario.userBirthYear,
        spouseBirthYear: originalScenario.spouseBirthYear,
        userLifeExpectancy: originalScenario.userLifeExpectancy,
        spouseLifeExpectancy: originalScenario.spouseLifeExpectancy,
        investmentTypes: clonedInvestmentTypes.filter(Boolean),
        events: clonedEvents.filter(Boolean),
        inflationAssumption: originalScenario.inflationAssumption,
        inflationAssumptionDistribution: originalScenario.inflationAssumptionDistribution,
        annualPreTaxContributionLimit: originalScenario.annualPreTaxContributionLimit,
        annualPostTaxContributionLimit: originalScenario.annualPostTaxContributionLimit,
        financialGoal: originalScenario.financialGoal,
        orderedSpendingStrategy: originalScenario.orderedSpendingStrategy.map(id => idMap.get(id.toString()) || id),
        orderedExpenseWithdrawalStrategy: originalScenario.orderedExpenseWithdrawalStrategy.map(id => idMap.get(id.toString()) || id),
        orderedRMDStrategy: originalScenario.orderedRMDStrategy.map(id => idMap.get(id.toString()) || id),
        orderedRothStrategy: originalScenario.orderedRothStrategy.map(id => idMap.get(id.toString()) || id),
        startYearRothOptimizer: originalScenario.startYearRothOptimizer,
        endYearRothOptimizer:originalScenario.endYearRothOptimizer,
        
    });
    //console.log("CLONED:");
    //console.log(await clonedScenario.populate('investmentTypes events orderedSpendingStrategy orderedExpenseWithdrawalStrategy orderedRMDStrategy orderedRothStrategy'));
    return clonedScenario;
}

async function chooseEventTimeframe(scenarioID){
    //determine when events will start and end using sample, making sure that
    //conflicting events do not overlap
    //save determined start years and durations in {expexted...} variables
}
async function run(scenarioID, fedIncome, capitalGains, fedDeduction, stateIncome, stateDeduction, rmdTable){
    //deep clone then run simulation then re-splice original scenario in simulation output
    const scenarioFactory = new ScenarioController();
    
    //const unmodifiedScenario = await scenarioFactory.read(scenarioID);
    let copiedScenario = await clone(scenarioID);
    await chooseEventTimeframe(copiedScenario.id);
    let simulationResult = await simulate(copiedScenario, fedIncome, stateIncome, fedDeduction, stateDeduction, capitalGains, rmdTable);
    await eraseScenario(copiedScenario.id);
    //console.log(simulationResult);
    return simulationResult;
}

async function eraseScenario(scenarioID){
    //erase the scenario and all investments, events, investmentTypes associated with it
    const scenarioFactory = new ScenarioController();
    const investmentTypeFactory = new InvestmentTypeController();
    const investmentFactory = new InvestmentController();
    const eventFactory = new EventController();
    const scenario = await scenarioFactory.read(scenarioID);
    //first, get & erase all investments & investmentTypes
    for(const i in scenario.investmentTypes){
        const investmentType = await investmentTypeFactory.read(scenario.investmentTypes[i]);
        for(const j in investmentType.investments){
            await investmentFactory.delete(investmentType.investments[j]);
        }
        await investmentTypeFactory.shallowDelete(scenario.investmentTypes[i]); 
    }
    //erase all events
    for(const i in scenario.events){
        await eventFactory.shallowDelete(scenario.events[i]);
    }
    //erase scenario
    await scenarioFactory.shallowDelete(scenarioID);
}

//recives ID of scenario in db
export async function validateRun(scenarioID, numTimes, stateTaxID, stateStandardDeductionID){
    //first, validate scenario's invariants
    const scenarioFactory = new ScenarioController();
    
    
    const taxFactory = new TaxController();
    try{
        await validate(scenarioID);

    }
    catch(err){
        throw err;
    }
    const scrapeReturn = await scrape();
    //console.log(scrapeReturn);
    //depending on if scenario is single or joint, pass in different values to run:
    const scenario = await scenarioFactory.read(scenarioID);
    //console.log(scenario);
    let fedIncome = null;
    let capitalGains = null;
    let fedDeduction = null;
    let rmdTable = scrapeReturn.rmdTable;
    if(scenario.filingStatus==="SINGLE"){
        fedIncome = scrapeReturn.federalIncomeSingle;
        capitalGains = scrapeReturn.capitalGainsSingle;
        fedDeduction = scrapeReturn.federalDeductionSingle;
    }
    else{
        fedIncome = scrapeReturn.federalIncomeMarried;
        capitalGains = scrapeReturn.capitalGainsMarried;
        fedDeduction = scrapeReturn.federalDeductionMarried;
    }

    const stateTax = await taxFactory.read(stateTaxID);
    const stateDeduction = await taxFactory.read(stateStandardDeductionID)
    
    //Array of simulations
    const compiledResults = [];
    //TODO: parralelism
    for(let i=0;i<numTimes;i++){
        let runResult = await run(
            scenarioID, 
            fedIncome, 
            capitalGains, 
            fedDeduction, 
            stateTax, 
            stateDeduction, 
            rmdTable
        );
        //Replace runResult.scenario with scenario, to erase the fact we cloned
        //let clonedScenarioID = runResult.scenario.id;
        runResult.scenario = scenario;
        //console.log(runResult);
        
        compiledResults.push(runResult);


    }
    //console.log(await scenarioFactory.readAll());
    return compiledResults;
}