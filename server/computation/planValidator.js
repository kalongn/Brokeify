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

    
}
async function run(scenarioID, fedIncome, capitalGains, fedDeduction, stateIncome, stateDeduction, rmdTable){
    //deep clone then run simulation then re-splice original scenario in simulation output

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
    console.log(scrapeReturn);
    //depending on if scenario is single or joint, pass in different values to run:
    const scenario = await scenarioFactory.read(scenarioID);
    let fedIncome = null;
    let capitalGains = null;
    let fedDeduction = null;
    let rmdTable = scenario.rmdTable;
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
    //TODO: parralelism
    for(let i=0;i<numTimes;i++){
        const runResult = run(
            scenarioID, 
            fedIncome, 
            capitalGains, 
            fedDeduction, 
            stateTax, 
            stateDeduction, 
            rmdTable
        );

    }
}