//the big boi

import {
    readFileSync,
    writeFileSync,
    existsSync,
    appendFileSync,
    fstat,
} from "fs";
import mongoose from "mongoose";
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
import { cursorTo } from "readline";
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();
const taxFactory = new TaxController();
const simulationFactory = new SimulationController();
const distributionFactory = new DistributionController();
const resultFactory = new ResultController();
import { 
    updateCSV, 
    updateLog 
} from "./simulationHelper/logHelpers.js";
import { 
    sample
} from "./simulationHelper/sample.js";
import { 
    chooseEventTimeframe,
    chooseLifeExpectancies,
    getCashInvestment,
    setupMap,
} from "./simulationHelper/setupHelper.js";
import { 
    updateTaxBracketsForInflation,
    updateContributionLimitsForInflation
} from "./simulationHelper/inflationHelper.js";
import {
    adjustEventsAmount,
} from "./simulationHelper/eventHelper.js"
import { 
    shouldPerformRMD,
    processRMDs,
    updateInvestments,
    performRothConversion,
    processInvestmentEvents,
    rebalanceInvestments
} from "./simulationHelper/investmentHelper.js";
import { 
    calculateTaxes
} from "./simulationHelper/taxesHelper.js";
import {
    processAllExpenses
} from "./simulationHelper/expensesHelper.js";
export let csvFile, logFile;
import { invMap } from "./simulationHelper/simulationHelper.js";

export async function simulate(
    scenario,
    federalIncomeTaxArray,
    stateIncomeTaxArray,
    federalStandardDeductionObjectArray,
    capitalGainTaxArray,
    rmdTable,
    csvFileL,
    logFileL,
    step1,
    step2,
    seed,
) {
    let federalIncomeTax,
        stateIncomeTax,
        capitalGainTax,
        federalStandardDeduction;
    if (scenario.filingStatus === "SINGLE") {
        federalIncomeTax = federalIncomeTaxArray[0];
        stateIncomeTax = stateIncomeTaxArray[0];
        capitalGainTax = capitalGainTaxArray[0];
        federalStandardDeduction = federalStandardDeductionObjectArray[0];
    } else {
        federalIncomeTax = federalIncomeTaxArray[1];
        stateIncomeTax = stateIncomeTaxArray[1];
        capitalGainTax = capitalGainTaxArray[1];
        federalStandardDeduction = federalStandardDeductionObjectArray[1];
    }

    csvFile = csvFileL;
    logFile = logFileL;
    if(seed){
        sample(undefined, undefined, seed); //this sets up the static variable
    }
    const eventTimeframeBool = await chooseEventTimeframe(scenario);
    const chooseLifeExpectanciesBool = await chooseLifeExpectancies(scenario);
    if (eventTimeframeBool === false) {
        console.log("Event Selection Failed, returning failed");
        const results = await resultFactory.create({
            resultStatus: "EVENT_ERROR",
            yearlyResults: [],
        });
        return results;
    }
    if (chooseLifeExpectanciesBool === false) {
        console.log("Life Expectancies Failed, returning failed");
        const results = await resultFactory.create({
            resultStatus: "LIFE_ERROR",
            yearlyResults: [],
        });
        return results;
    }
    scenario = await scenarioFactory.read(scenario._id);

    const results = await resultFactory.create({
        resultStatus: "SUCCESS",
        yearlyResults: [],
    });

    let currentYear = 0;
    const realYear = new Date().getFullYear();

    const endYear =
        scenario.userBirthYear + scenario.userLifeExpectancy - realYear;

    let investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    let cashInvestment = await getCashInvestment(investmentTypes);
    scenario.investmentTypes = investmentTypes.map((type) => type._id);
    await scenarioFactory.update(scenario._id, scenario);

    await setupMap(scenario._id);
    let cumulativeInflation = 0;
    let thisYearTaxes = 0;
    let lastYearGains = 0;
    let thisYearGains = 0;
    let curYearIncome = 0;
    let curYearSS = 0;
    let lastYearIncome = 0;
    let lastYearSS = 0;
    let lastYearEarlyWithdrawl = 0;
    while (currentYear <= endYear) {
		console.time("loop")
        let allDbUpdateOps = [];
        let allDbTypeUpdateOps = [];
        let allDbEventOps = [];
        curYearIncome = 0;
        curYearSS = 0;
        thisYearGains = 0;
        thisYearTaxes = 0;
        investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
        let investmentTypesMap = new Map(investmentTypes.map(t => [t._id.toString(), t]));
        let investmentIds = investmentTypes.flatMap((type) => type.investments);
        let investmentsArray = await investmentFactory.readMany(investmentIds); // Fetch as Array
        let allInvestmentsMap = new Map(investmentsArray.map(inv => [inv._id.toString(), inv])); // Create Map
        let allEvents = await eventFactory.readMany(scenario.events);
        let allEventsMap = new Map(allEvents.map(event => [event._id.toString(), event]));
		let investments = await investmentFactory.readMany(investmentIds);
        cashInvestment = await investmentFactory.read(cashInvestment._id);
        const allDistributionIds = investmentTypes.flatMap(type => [
            type.expectedAnnualIncomeDistribution,
            type.expectedAnnualReturnDistribution
            // Add other distribution IDs if used elsewhere (e.g., events)
        ]).filter(id => id); // Filter out null/undefined IDs
        allEvents.forEach(event => {
            if (event.expectedAnnualChangeDistribution) {
                allDistributionIds.push(event.expectedAnnualChangeDistribution);
            }
            // Add other event distribution fields here if they exist (e.g., startYearTypeDistribution, durationTypeDistribution if variable)
            if (event.startYearTypeDistribution) { // If start year uses a distribution
                allDistributionIds.push(event.startYearTypeDistribution);
            }
            if (event.durationTypeDistribution) { // If duration uses a distribution
                allDistributionIds.push(event.durationTypeDistribution);
            }
        });

        // Fetch unique distributions
        const uniqueDistIds = [...new Set(allDistributionIds.filter(id => id).map(id => id.toString()))];
        const distributions = uniqueDistIds.length > 0 ? await distributionFactory.readMany(uniqueDistIds) : [];
        const distributionMap = new Map(distributions.map(dist => [dist._id.toString(), dist]));

		let inflationRate = await sample(
            scenario.inflationAssumption,
            scenario.inflationAssumptionDistribution
        );
        inflationRate = Math.max(-1, inflationRate);    //inflation rate should not be less than -100%
        const inflationeEventDetails = `Year: ${currentYear} - INFLATION - ${
            Math.ceil(inflationRate * 1000) / 1000
        }\n`;
        updateLog(inflationeEventDetails);
        cumulativeInflation = ((cumulativeInflation+1) * (1 + inflationRate)) -1;

		//update events
		const adjustEventsResultPromise = adjustEventsAmount(
            scenario, inflationRate, currentYear,
            allEventsMap,       // Pass map (will be modified)
            cashInvestment,     // Pass cash reference (will be modified)
            distributionMap     // Pass distributions
        );


		//start RMDs:
		let rmdPromise;
        const needsRMD = shouldPerformRMD(currentYear, scenario.userBirthYear, investmentsArray);
        if (needsRMD) {
            rmdPromise = processRMDs(
                rmdTable, 
                currentYear, 
                scenario.userBirthYear, 
                scenario,
                allInvestmentsMap, 
                investmentTypesMap 
            );
        }


        //Could change from married to single if spouse dies, so we have to maintain both
        updateTaxBracketsForInflation(federalIncomeTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(federalIncomeTaxArray[1], inflationRate);
        updateTaxBracketsForInflation(stateIncomeTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(stateIncomeTaxArray[1], inflationRate);
        updateTaxBracketsForInflation(capitalGainTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(capitalGainTaxArray[1], inflationRate);
        federalStandardDeductionObjectArray[0].standardDeduction *=
            1 + inflationRate;
        federalStandardDeductionObjectArray[1].standardDeduction *=
            1 + inflationRate;
        if (scenario.filingStatus === "SINGLE") {
            federalIncomeTax = federalIncomeTaxArray[0];
            stateIncomeTax = stateIncomeTaxArray[0];
            capitalGainTax = capitalGainTaxArray[0];
            federalStandardDeduction = federalStandardDeductionObjectArray[0];
        } else {
            federalIncomeTax = federalIncomeTaxArray[1];
            stateIncomeTax = stateIncomeTaxArray[1];
            capitalGainTax = capitalGainTaxArray[1];
            federalStandardDeduction = federalStandardDeductionObjectArray[0];
        }

        scenario = await updateContributionLimitsForInflation(scenario, inflationRate);
		//console.timeEnd("taxes/initial")

        //await processRMDs(rmdTable, currentYear, scenario.userBirthYear, scenario);
		//console.time("processRMDs");
		if (rmdPromise) {
            const rmdResult = await rmdPromise; // Contains { income, dbInvestmentOps, dbInvestmentTypeOps }
            curYearIncome += rmdResult.income; 
            allDbUpdateOps.push(...rmdResult.dbInvestmentOps);
            allDbTypeUpdateOps.push(...rmdResult.dbInvestmentTypeOps);
        }
		//console.timeEnd("processRMDs");



		//console.time("updateInvestments")
        const updateInvestmentsResult = await updateInvestments(
            investmentTypes, // Pass array of types
            allInvestmentsMap,      // Pass map to be modified
            distributionMap         // Pass pre-fetched distributions
        );
        curYearIncome += updateInvestmentsResult.income;
        allDbUpdateOps.push(...updateInvestmentsResult.dbUpdateOperations);
		//console.timeEnd("updateInvestments")


		//console.time("adjustEventsAmount");
        const adjustEventsResult = await adjustEventsResultPromise; // Contains { income, ss, incomeBreakdown, dbEventOps, dbCashOps }
        curYearIncome += adjustEventsResult.income;
        curYearSS += adjustEventsResult.ss;
        const incomeByEvent = adjustEventsResult.incomeBreakdown;
        // Add event and cash operations to respective lists
        allDbEventOps.push(...adjustEventsResult.dbEventOps);
        allDbUpdateOps.push(...adjustEventsResult.dbCashOps); // Cash ops go with Investment ops
        const reportedIncome = curYearIncome;
		//console.timeEnd("adjustEventsAmount");

		
        let rothConversion = { incomeToAdd: 0, earlyWithdrawalAmountSubjectToPenalty: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
        if (scenario.startYearRothOptimizer !== undefined &&
            scenario.startYearRothOptimizer <= realYear + currentYear &&
            scenario.endYearRothOptimizer !== undefined &&
            scenario.endYearRothOptimizer >= realYear + currentYear)
        {
            rothConversion = await performRothConversion( // await needed for immediate create call within
                scenario, 
                federalIncomeTax,
                curYearIncome,
                curYearSS, 
                currentYear, 
                scenario.userBirthYear,
                allInvestmentsMap, // Pass map (will be modified)
                investmentTypesMap,// Pass map (will be modified if new inv added)
            );
            curYearIncome += rothConversion.incomeToAdd; // Add converted amount to income *after* calculation
            allDbUpdateOps.push(...rothConversion.dbInvestmentOps); // Collect investment updates
            allDbTypeUpdateOps.push(...rothConversion.dbInvestmentTypeOps); // Collect type updates
        }


        let earlyWithdrawalTaxPaid = 0;
        const calcTaxReturn = calculateTaxes(
            federalIncomeTax,
            stateIncomeTax,
            capitalGainTax,
            federalStandardDeduction.standardDeduction,
            lastYearIncome,
            lastYearSS,
            lastYearEarlyWithdrawl,
            lastYearGains,
            currentYear
        );
		//console.timeEnd("calculateTaxes")
		//console.time("processExpenses")
        thisYearTaxes = calcTaxReturn.t;
        earlyWithdrawalTaxPaid = calcTaxReturn.e;

        const expensesResult = processAllExpenses(
            scenario, 
            thisYearTaxes, 
            currentYear,
            allEventsMap, // Pass fetched map
            investmentTypes, // Pass fetched types
            allInvestmentsMap, // Pass map (will be modified)
            cashInvestment // Pass cash reference (will be modified)
        );
        thisYearGains += expensesResult.capitalGainFromExpenses;
        curYearIncome += expensesResult.incomeGainFromExpenses;
        allDbUpdateOps.push(...expensesResult.dbUpdateOperations);
        const totalExpenseBreakdown = [...expensesResult.nonDiscretionaryBreakdown, ...expensesResult.discretionaryBreakdown];
        let totalExpenses = expensesResult.nonDiscretionaryExpensesPaid + expensesResult.discretionaryExpensesPaid;
        let discretionaryAmountIgnored = expensesResult.discretionaryExpensesIgnored;
        let discretionaryAmountPaid = expensesResult.discretionaryExpensesPaid;



        const investmentEventsResult = processInvestmentEvents( 
            scenario, currentYear,
            allEventsMap,
            allInvestmentsMap, // Pass the map containing the cashInvestment object
            cashInvestment,    // Pass the specific cashInvestment reference
            investmentTypesMap // Pass map of types
        );
        allDbUpdateOps.push(...investmentEventsResult.dbUpdateOperations);
        


        const rebalanceResult = rebalanceInvestments(
            scenario, 
            currentYear,
            allEventsMap,
            allInvestmentsMap, 
            investmentTypesMap 
        );
        thisYearGains += rebalanceResult.capitalGain; // Add calculated gains
        allDbUpdateOps.push(...rebalanceResult.dbUpdateOperations); 


        const finalDbOpsMap = new Map();
        allDbUpdateOps.forEach(op => {
            if (op?.updateOne?.filter?._id) { // Basic check for valid operation structure
                finalDbOpsMap.set(op.updateOne.filter._id.toString(), op);
            }
        });
        const finalDbUpdateOps = Array.from(finalDbOpsMap.values());

        if (finalDbUpdateOps.length > 0) {
            //console.log(`Year ${currentYear}: Bulk writing ${finalDbUpdateOps.length} investment updates.`); // Optional: logging
            try {
                await mongoose.model('Investment').bulkWrite(finalDbUpdateOps, { ordered: false });
            } catch (err) {
                console.error(`Bulk write failed in year ${currentYear}:`, err);
                throw err; // Halt simulation on DB error
            }
        }
        const finalTypeDbOpsMap = new Map();
        allDbTypeUpdateOps.forEach(op => { /* ... filter ... */ finalTypeDbOpsMap.set(op.updateOne.filter._id.toString(), op); });
        const finalTypeDbUpdateOps = Array.from(finalTypeDbOpsMap.values());
        if (finalTypeDbUpdateOps.length > 0) {
            //console.log(`Year ${currentYear}: Bulk writing ${finalTypeDbUpdateOps.length} investment type updates.`);
            await mongoose.model('InvestmentType').bulkWrite(finalTypeDbUpdateOps, { ordered: false });
        }

        // thisYearGains += await rebalanceInvestmentsOld(scenario, currentYear);


        lastYearGains = thisYearGains;
        thisYearGains = 0;

		investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
		investmentIds = investmentTypes.flatMap((type) => type.investments);
		investments = await investmentFactory.readMany(investmentIds);
	   
		// Create a map for quick lookup of investmentTypes by ID
		const investmentTypeMap = new Map(investmentTypes.map(type => [type._id.toString(), type])); // Store _id for lookup
	   
		let totalValue = 0;
		for (const investment of investments) {
			totalValue += investment.value;
		}
	   
		const boolIsViolated = totalValue < scenario.financialGoal;
	   
		const investmentValuesArray = [];
		for (const investmentTypeId of scenario.investmentTypes) { // Iterate through scenario's investmentTypes
			const investmentType = investmentTypeMap.get(investmentTypeId.toString());
			if (investmentType) {
				for (const investmentId of investmentType.investments) {
					const inv = investments.find(inv => inv._id.toString() === investmentId.toString()); // Find investment in fetched array
					if (inv) {
						const tuple = {
							name: `${investmentType.name} ${inv.taxStatus}`,
							value: inv.value,
						};
						investmentValuesArray.push(tuple);
					}
				}
			}
		}
        //create yearly results
        let discretionaryExpensesPercentage = discretionaryAmountPaid;
        if (discretionaryAmountIgnored + discretionaryAmountPaid != 0) {
            discretionaryExpensesPercentage =
                (discretionaryAmountPaid + 0.0) /
                (discretionaryAmountIgnored + discretionaryAmountPaid);
        }

        const yearlyRes = {
            year: currentYear + realYear,
            inflationRate: inflationRate,
            cumulativeInflation: cumulativeInflation,
            investmentValues: investmentValuesArray,
            incomeByEvent: incomeByEvent,
            expenseByEvent: totalExpenseBreakdown,
            totalIncome: reportedIncome,
            totalExpense: totalExpenses,
            totalTax: thisYearTaxes, //actually is this year's taxes, but got updated
            earlyWithdrawalTax: earlyWithdrawalTaxPaid,
            totalDiscretionaryExpenses: discretionaryExpensesPercentage,
            isViolated: boolIsViolated,
            step1: step1, //for 1/2d exploration
            step2: step2, //for 2d exploration
        };

        results.yearlyResults.push(yearlyRes);
		//console.timeEnd("results")
		if (csvFile !== null && csvFile !== undefined) {
			await updateCSV(currentYear, investments, scenario);
		}
        lastYearIncome = curYearIncome;
        lastYearSS = curYearSS;
        lastYearEarlyWithdrawl = rothConversion.curYearEarlyWithdrawals;
        if(typeof lastYearEarlyWithdrawl !== "number") lastYearEarlyWithdrawl = 0;
        //finally, check if spouse has died (sad)
        //if so, update shared thingies, and tax to be paid
        if (scenario.filingStatus === "MARRIEDJOINT") {
            if (
                currentYear + realYear >
                scenario.spouseLifeExpectancy + scenario.spouseBirthYear
            ) {
                //spouse died
                const spouseDied = `Year: ${currentYear} - SPOUSE DIED\n`;
                updateLog(spouseDied);
                //update events
                for (const i in scenario.events) {
                    const event = await eventFactory.read(scenario.events[i]);
                    if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {         
                        await eventFactory.update(event._id, {
                            amount: event.amount * event.userContributions,
                        });
                        
                    }
                }

                //update tax status
                await scenarioFactory.update(scenario._id, { filingStatus: "SINGLE" });
            }
        }

        scenario = await scenarioFactory.read(scenario);
        currentYear++;
		console.timeEnd("loop")
    }
	await resultFactory.update(results._id, {
		yearlyResults: results.yearlyResults,
	});

    console.log("Simulation complete.");
    return results;
}
