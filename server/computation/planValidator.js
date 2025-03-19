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
async function validate(scenarioID){
    
}
async function scrape(){
    //check to see if federalIncomeTax, federalStandardDeduction, capitalGains exist
    //scrape, parse, and save to DB if not
    let factory = new TaxController();
    const a = await factory.readAll();
    console.log(a);
}
async function save(scenarioID){

}
async function clone(scenarioID){

}
async function run(scenarioID){

}



//recives ID of scenario in db
export async function validateRun(scenarioID, stateTaxID, stateStandardDeductionID){
    //first, validate scenario's invariants
    try{
        await validate(scenarioID);

    }
    catch(err){
        throw err;
    }
    const {federalIncomeTax, federalStandardDeduction, capitalGains} = await scrape();

}