//the big boi

import {
    readFileSync,
    writeFileSync,
    existsSync,
    appendFileSync,
    fstat,
} from "fs";
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
import { updateCSV, updateLog } from "./logHelpers.js";
import {
    sample,
    chooseEventTimeframe,
    chooseLifeExpectancies,
    getCashInvestment,
    setupMap,
    updateTaxBracketsForInflation,
    updateContributionLimitsForInflation,
    adjustEventsAmount,
    shouldPerformRMD,
    processRMDs,
    updateInvestments,
    performRothConversion,
    calculateTaxes,
    processExpenses,
    processDiscretionaryExpenses,
    processInvestmentEvents,
    rebalanceInvestments,
} from "./simulationHelper.js";

export let csvFile, logFile;
import { invMap } from "./simulationHelper.js";

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
    let cumulativeInflation = 1;
    let lastYearTaxes = 0;
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
        curYearIncome = 0;
        curYearSS = 0;
        thisYearGains = 0;
        thisYearTaxes = 0;
        investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
		let investmentIds = investmentTypes.flatMap((type) => type.investments);
		let investments = await investmentFactory.readMany(investmentIds);

        const inflationRate = await sample(
            scenario.inflationAssumption,
            scenario.inflationAssumptionDistribution
        );
        const inflationeEventDetails = `Year: ${currentYear} - INFLATION - ${
            Math.ceil(inflationRate * 1000) / 1000
        }\n`;
        updateLog(inflationeEventDetails);
        cumulativeInflation = cumulativeInflation * (1 + inflationRate);

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
		console.time("adjustEventsAmount");
        const events = scenario.events;
		//fetch all events in one go
		let allEvents = await eventFactory.readMany(events);
		let eventsMap = new Map(allEvents.map(event => [event._id.toString(), event]));

		//update events
		cashInvestment = await investmentFactory.read(cashInvestment._id);
		const adjustEventsAmountReturn = await adjustEventsAmount(eventsMap, inflationRate, scenario, currentYear, cashInvestment);
		curYearIncome += adjustEventsAmountReturn.curYearIncome;
		curYearSS += adjustEventsAmountReturn.curYearSS;
		const incomeByEvent = adjustEventsAmountReturn.incomeByEvent;
		cashInvestment = adjustEventsAmountReturn.cashInvestment;

		console.log(`curYearIncome - ${curYearIncome}`)
        const reportedIncome = curYearIncome;
		console.timeEnd("adjustEventsAmount");

        //await processRMDs(rmdTable, currentYear, scenario.userBirthYear, scenario);
		console.time("processRMDs");
        const shouldPerformRMDs = await shouldPerformRMD(
            currentYear,
            scenario.userBirthYear,
            investments
        );
        if (shouldPerformRMDs) {
            const rmd = await processRMDs(
                rmdTable,
                currentYear,
                scenario.userBirthYear,
                scenario
            );

            curYearIncome += rmd;
        }
		console.timeEnd("processRMDs");

		console.time("updateInvestments")
        curYearIncome += await updateInvestments(investmentTypes);
		console.timeEnd("updateInvestments")
		console.time("performRothConversion")
        let rothConversion = {curYearIncome: 0, curYearEarlyWithdrawals: 0}
        if(scenario.startYearRothOptimizer!==undefined 
            && scenario.startYearRothOptimizer<=realYear+currentYear
            && scenario.endYearRothOptimizer!==undefined
            && scenario.endYearRothOptimizer>=realYear+currentYear
        ){
            rothConversion = await performRothConversion(
                curYearIncome,
                curYearSS,
                federalIncomeTax,
                currentYear,
                scenario.userBirthYear,
                scenario.orderedRothStrategy,
                investmentTypes
            );
        }
		console.timeEnd("performRothConversion")
		console.time("calculateTaxes")
        curYearIncome += rothConversion.curYearIncome;
        let earlyWithdrawalTaxPaid = 0;
		console.log(`lastYearIncome: ${lastYearIncome} lastYearSS: ${lastYearSS}: lastYearEarlyWithdrawl:${lastYearEarlyWithdrawl} lastYearGains: ${lastYearGains}`)
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
		console.timeEnd("calculateTaxes")
		console.time("processExpenses")
        thisYearTaxes = calcTaxReturn.t;
        earlyWithdrawalTaxPaid = calcTaxReturn.e;
        let nonDiscretionaryExpenses = 0;
        const expensesReturn = await processExpenses(scenario, lastYearTaxes, currentYear);
        nonDiscretionaryExpenses = expensesReturn.t;
        thisYearGains += expensesReturn.c; //if you sell investments
        const expenseBreakdown = expensesReturn.expenseBreakdown;
		console.timeEnd("processExpenses")
		console.time("processDiscretionaryExpenses")
        lastYearTaxes = thisYearTaxes;
        //returns amount not paid, paid, and capital gains
        let discretionaryAmountIgnored, discretionaryAmountPaid;
        const processDiscretionaryResult = await processDiscretionaryExpenses(
            scenario,
            currentYear
        );
        discretionaryAmountIgnored = processDiscretionaryResult.np;
        discretionaryAmountPaid = processDiscretionaryResult.p;
        thisYearGains += processDiscretionaryResult.c;
        const totalExpenseBreakdown = [...expenseBreakdown, ...processDiscretionaryResult.expenseBreakdown];
        let totalExpenses = nonDiscretionaryExpenses + discretionaryAmountPaid;
		console.timeEnd("processDiscretionaryExpenses")
		console.time("processInvestmentEvents")
        await processInvestmentEvents(scenario, currentYear);
		console.timeEnd("processInvestmentEvents")
		console.time("rebalanceInvestments")
        thisYearGains += await rebalanceInvestments(scenario, currentYear);
		console.timeEnd("rebalanceInvestments")
		console.time("results")
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
            totalTax: lastYearTaxes, //actually is this year's taxes, but got updated
            earlyWithdrawalTax: earlyWithdrawalTaxPaid,
            totalDiscretionaryExpenses: discretionaryExpensesPercentage,
            isViolated: boolIsViolated,
            step1: step1, //for 1/2d exploration
            step2: step2, //for 2d exploration
        };

        results.yearlyResults.push(yearlyRes);

        await resultFactory.update(results._id, {
            yearlyResults: results.yearlyResults,
        });
        await updateCSV(currentYear, investments, scenario);
        lastYearIncome = curYearIncome;
        lastYearSS = curYearSS;
        lastYearEarlyWithdrawl = rothConversion.curYearEarlyWithdrawals;
		console.timeEnd("results")
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

    console.log("Simulation complete.");
    return results;
}
