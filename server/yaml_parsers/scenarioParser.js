//This was initially written using ChatGPT and the prompt:

/*

write a YAML parser that takes in a YAML format such as the following, 
and saves the investments, investmenttypes, events, and ulamately the scenario to mongodb:
{example yaml scenario}

*/

import yaml from 'js-yaml';
import fs from 'fs';
import { sample } from '../computation/simulator.js';
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
const distributionFactory = new DistributionController();
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();
async function createDistribution(dist, returnAmtOrPct, idMap){
  if(dist.type==="startWith"||dist.type==="startAfter"){
    return null;
  }
  if(returnAmtOrPct){
    dist.type+=returnAmtOrPct+"";
  }
  const distributionMap = new Map([
    ["fixed", "FIXED_AMOUNT"],
    ["uniform", "UNIFORM_AMOUNT"],
    ["normal", "NORMAL_PERCENTAGE"],
    ["fixedamount", "FIXED_AMOUNT"],
    ["uniformamount", "UNIFORM_AMOUNT"],
    ["normalamount", "NORMAL_AMOUNT"],
    ["fixedpercent", "FIXED_PERCENTAGE"],
    ["uniformpercent", "UNIFORM_PERCENTAGE"],
    ["normalpercent", "NORMAL_PERCENTAGE"],
  ]);

  
  dist.type = distributionMap.get(dist.type.toString());
  //console.log(dist);
  let distribution;
  
  switch (dist.type) {
    case "FIXED_AMOUNT":
    case "FIXED_PERCENTAGE":
      distribution = await distributionFactory.create(dist.type, {
        value: dist.value
      });
      break;
    case "UNIFORM_AMOUNT":
    case "UNIFORM_PERCENTAGE":
      distribution = await distributionFactory.create(dist.type, {
        lowerBound: dist.lower,
        upperBound: dist.upper
      });
      break;
    case "NORMAL_AMOUNT":
    case "NORMAL_PERCENTAGE":
      distribution = await distributionFactory.create(dist.type, {
        mean: dist.mean,
        standardDeviation: dist.stdev
      });
      break;
    default:
      throw new Error("Unhandled distribution type");
  }
  return distribution;
}

async function createEvent(event, idMap){
  
  const eventTypeMap = new Map([
    ["income", "INCOME"],
    ["expense", "EXPENSE"],
    ["invest", "INVEST"],
    ["rebalance", "REBALANCE"],
  ]);
  event.type = eventTypeMap.get(event.type);
  
  //console.log({...event});
  let savedEvent = null;
  //console.log(event);
  if(event.type==="REBALANCE"){
    let startYearTypeDistributionID = await createDistribution(event.start, undefined, idMap);
    let startsWith, startsAfter;
    let expectedStart=0;
    if(startYearTypeDistributionID==null){
      let id = idMap.get(event.start.eventSeries);
      if(!id){
        return null;
      }
      const event = await eventFactory.read(idMap.get(event.start.eventSeries));
      if(event.start.type=="startWith"){
        expectedStart = event.startYear;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsWith = idMap.get(event.start.eventSeries);
      }
      else{
        expectedStart = event.startYear+event.duration;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsAfter = idMap.get(event.start.eventSeries);
      }
      
    }
    else{
      //console.log("else")
      // console.log(startYearTypeDistributionID)
      expectedStart = await sample(0, startYearTypeDistributionID);
      console.log(expectedStart);
    }
    const durationTypeDistributionID = await createDistribution(event.duration, undefined, idMap);
    const expectedDuration = await sample(0, durationTypeDistributionID);
    const glidepath = [];
    if(event.glidePath && event.assetAllocation2){
      for(const i in event.assetAllocation){
        let pair = [event.assetAllocation[i], event.assetAllocation2[i]];
        glidepath.push(pair);
      }
    }
    else{
      for(const i in event.assetAllocation){
        glidepath.push(event.assetAllocation[i]);
      }
    }
    const allocatedInvestments = Object.keys(event.assetAllocation).map(key => idMap.get(key));
    const exampleInvestment = await investmentFactory.read(allocatedInvestments[0]);
    console.log(glidepath);
    savedEvent = await eventFactory.create(event.type, {
      eventType: event.type,
      name: event.name,
      description: event.description,
      startYear: expectedStart,
      startYearTypeDistribution: startYearTypeDistributionID,
      duration: expectedDuration,
      startsWith: startsWith,
      startsAfter: startsAfter,
      durationTypeDistribution: durationTypeDistributionID,
      assetAllocationType: event.glidePath ? "GLIDE": "FIXED",
      percentageAllocations: glidepath, 
      allocatedInvestments: allocatedInvestments,
      maximumCash: event.maximumCash ? event.maximumCash: 0,
      taxStatus: exampleInvestment.taxStatus
    });
    
  }
  if(event.type==="INVEST"){
    let startYearTypeDistributionID = await createDistribution(event.start, undefined, idMap);
    let startsWith, startsAfter;
    let expectedStart=0;
    if(startYearTypeDistributionID==null){
      let id = idMap.get(event.start.eventSeries);
      if(!id){
        return null;
      }
      const event = await eventFactory.read(idMap.get(event.start.eventSeries));
      if(event.start.type=="startWith"){
        expectedStart = event.startYear;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsWith = idMap.get(event.start.eventSeries);
      }
      else{
        expectedStart = event.startYear+event.duration;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsAfter = idMap.get(event.start.eventSeries);
      }
      
    }
    else{
      //console.log("else")
      // console.log(startYearTypeDistributionID)
      expectedStart = await sample(0, startYearTypeDistributionID);
      console.log(expectedStart);
    }
    const durationTypeDistributionID = await createDistribution(event.duration, undefined, idMap);
    const expectedDuration = await sample(0, durationTypeDistributionID);
    const glidepath = [];
    if(evt.glidePath && evt.assetAllocation2){
      for(const i in event.assetAllocation){
        let pair = [event.assetAllocation[i], event.assetAllocation2[i]];
        glidepath.push(pair);
      }
    }
    else{
      for(const i in event.assetAllocation){
        glidepath.push(event.assetAllocation[i]);
      }
    }
    const allocatedInvestments = Object.keys(event.assetAllocation).map(key => idMap.get(key));
    savedEvent = await eventFactory.create(event.type, {
      eventType: event.type,
      name: event.name,
      description: event.description,
      startYear: expectedStart,
      startYearTypeDistribution: startYearTypeDistributionID,
      duration: expectedDuration,
      startsWith: startsWith,
      startsAfter: startsAfter,
      durationTypeDistribution: durationTypeDistributionID,
      assetAllocationType: event.glidePath ? "GLIDE": "FIXED",
      percentageAllocations: glidepath, 
      allocatedInvestments: allocatedInvestments,
      maximumCash: event.maximumCash ? event.maximumCash: 0,
    });
  }
  if(event.type==="INCOME"){
    
    let startYearTypeDistributionID = await createDistribution(event.start, undefined, idMap);
    let startsWith, startsAfter;
    let expectedStart=0;
    if(startYearTypeDistributionID==null){
      let id = idMap.get(event.start.eventSeries);
      if(!id){
        return null;
      }
      const event = await eventFactory.read(idMap.get(event.start.eventSeries));
      if(event.start.type=="startWith"){
        expectedStart = event.startYear;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsWith = idMap.get(event.start.eventSeries);
      }
      else{
        expectedStart = event.startYear+event.duration;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsAfter = idMap.get(event.start.eventSeries);
      }
      
    }
    else{
      //console.log("else")
      // console.log(startYearTypeDistributionID)
      expectedStart = await sample(0, startYearTypeDistributionID);
      console.log(expectedStart);
    }
    const durationTypeDistributionID = await createDistribution(event.duration, undefined, idMap);
    const expectedDuration = await sample(0, durationTypeDistributionID);
    const changeDistributionID = await createDistribution(event.changeDistribution,event.changeAmtOrPct, idMap);
    const expextedChange = await sample(0, changeDistributionID);
    console.log(expectedStart);
    savedEvent = await eventFactory.create(event.type, {
      eventType: event.type,
      name: event.name,
      description: event.description,
      startYear: expectedStart,
      startYearTypeDistribution: startYearTypeDistributionID,
      duration: expectedDuration,
      durationTypeDistribution: durationTypeDistributionID,
      startsWith: startsWith,
      startsAfter: startsAfter,
      amount: event.initialAmount,
      expectedAnnualChange: expextedChange,
      expectedAnnualChangeDistribution: changeDistributionID,
      isinflationAdjusted: event.inflationAdjusted,
      userContributions: event.userFraction,
      spouseContributions:1-event.userFraction,
      isSocialSecurity: event.socialSecurity,

    });
  }
  if(event.type==="EXPENSE"){
    let startYearTypeDistributionID = await createDistribution(event.start, undefined, idMap);
    let startsWith, startsAfter;
    let expectedStart=0;
    if(startYearTypeDistributionID==null){
      let id = idMap.get(event.start.eventSeries);
      if(!id){
        return null;
      }
      const event = await eventFactory.read(idMap.get(event.start.eventSeries));
      
      if(event.start.type=="startWith"){
        expectedStart = event.startYear;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsWith = idMap.get(event.start.eventSeries);
      }
      else{
        expectedStart = event.startYear+event.duration;
        startYearTypeDistributionID = event.startYearTypeDistribution;
        startsAfter = idMap.get(event.start.eventSeries);
      }
      
    }
    else{
      //console.log("else")
      // console.log(startYearTypeDistributionID)
      expectedStart = await sample(0, startYearTypeDistributionID);
      console.log(expectedStart);
    }
    const durationTypeDistributionID = await createDistribution(event.duration, undefined, idMap);
    const expectedDuration = await sample(0, durationTypeDistributionID);
    const changeDistributionID = await createDistribution(event.changeDistribution,event.changeAmtOrPct, idMap);
    const expextedChange = await sample(changeDistributionID);


    savedEvent = await eventFactory.create(event.type, {
      eventType: event.type,
      name: event.name,
      description: event.description,
      startYear: expectedStart,
      startYearTypeDistribution: startYearTypeDistributionID,
      duration: expectedDuration,
      durationTypeDistribution: durationTypeDistributionID,
      startsWith: startsWith,
      startsAfter: startsAfter,
      amount: event.initialAmount,
      expectedAnnualChange:expextedChange,
      expectedAnnualChangeDistribution:changeDistributionID,
      isinflationAdjusted: event.inflationAdjusted,
      userContributions: event.userFraction,
      spouseContributions:1-event.userFraction,
      isSocialSecurity: event.socialSecurity,
    });
  }
  console.log("saving:");
  console.log(event.name);
  console.log(savedEvent);
  idMap.set(event.name, savedEvent.id.toString());
  return savedEvent.id;
  
}

export async function parseAndSaveYAML(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents);

    const idMap = new Map();
    
    const taxStatusMap = new Map([
      ["non-retirement", "NON_RETIREMENT"],
      ["pre-tax", "PRE_TAX_RETIREMENT"],
      ["after-tax", "AFTER_TAX_RETIREMENT"],
    ]);

    // Save Investment Types
    const investmentTypePromises = await data.investmentTypes.map(async (type) => {
      //create distributions

      const expectedAnnualReturnDistribution = await createDistribution(type.returnDistribution, type.returnAmtOrPct, idMap);
      const expectedAnnualIncomeDistribution = await createDistribution(type.incomeDistribution, type.returnAmtOrPct, idMap);
      //console.log(expectedAnnualReturnDistribution);

      const createdType = await investmentTypeFactory.create({
        name: type.name,
        description: type.description,
        expectedAnnualReturnDistribution: expectedAnnualReturnDistribution.id,
        expenseRatio: type.expenseRatio,
        expectedAnnualIncomeDistribution: expectedAnnualIncomeDistribution.id,
        taxability: type.taxability==="true",
      });
      idMap.set(type.name, createdType._id);
    });
    await Promise.all(investmentTypePromises);
    
    // Save Investments
    const investmentPromises = data.investments.map(async (inv) => {
      const createdInvestment = await investmentFactory.create({
        investmentType: idMap.get(inv.investmentType),
        value: inv.value,
        taxStatus: taxStatusMap.get(inv.taxStatus.toString()),
      });
      idMap.set(inv.id, createdInvestment._id);
    });
    await Promise.all(investmentPromises);
    
    // Save Events (try to)
    let tryAgainArray = [];
    for(const i in data.eventSeries){
      console.log(data.eventSeries[i])
      let eventID= await createEvent(data.eventSeries[i], idMap);
      if(eventID===null){
        tryAgainArray.push(data.eventSeries[i]);
      }
      //idMap.set(evt.name, eventID);
    }
    for(const i in tryAgainArray){
      let eventID= await createEvent(tryAgainArray[i], idMap);
    }
    
    await Promise.all(eventPromises);

    // Save Scenario
    const scenario = await ScenarioController.create({
      name: data.name,
      filingStatus: data.maritalStatus === 'couple' ? 'married' : 'single',
      userBirthYear: data.birthYears[0],
      spouseBirthYear: data.maritalStatus === 'couple' ? data.birthYears[1] : null,
      userLifeExpectancy: data.lifeExpectancy[0],
      spouseLifeExpectancy: data.maritalStatus === 'couple' ? data.lifeExpectancy[1] : null,
      investmentTypes: data.investmentTypes.map(type => idMap.get(type.name)),
      events: data.eventSeries.map(evt => idMap.get(evt.name)),
      inflationAssumption: data.inflationAssumption,
      annualPostTaxContributionLimit: data.afterTaxContributionLimit,
      financialGoal: data.financialGoal,
      orderedSpendingStrategy: data.spendingStrategy.map(evt => idMap.get(evt)),
      orderedExpenseWithdrawalStrategy: data.expenseWithdrawalStrategy.map(inv => idMap.get(inv)),
      orderedRMDStrategy: data.RMDStrategy.map(inv => idMap.get(inv)),
      startYearRothOptimizer: data.RothConversionStart,
      endYearRothOptimizer: data.RothConversionEnd,
      orderedRothStrategy: data.RothConversionStrategy.map(inv => idMap.get(inv)),
    });

    console.log('Scenario saved:', scenario);
    return scenario.id;
  } catch (error) {
    console.error('Error processing YAML file:', error);
  }
}
