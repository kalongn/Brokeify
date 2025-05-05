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
        federalStandardDeduction = federalStandardDeductionObjectArray[1]; // Index was 0, likely should be 1 for MARRRIEDJOINT
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
    // Refresh scenario after initial setup potentially modified it
    scenario = await scenarioFactory.read(scenario._id);

    const results = await resultFactory.create({
        resultStatus: "SUCCESS",
        yearlyResults: [],
    });

    let currentYear = 0;
    const realYear = new Date().getFullYear();

    const endYear =
        scenario.userBirthYear + scenario.userLifeExpectancy - realYear;

    // --- Fetch initial data before the loop ---
    console.log("Fetching initial data before simulation loop...");
    let investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    let cashInvestment = await getCashInvestment(investmentTypes); // Finds or creates Cash
    // Update scenario's investmentTypes if cash was newly created and added
    scenario.investmentTypes = investmentTypes.map((type) => type._id);
    await scenarioFactory.update(scenario._id, { investmentTypes: scenario.investmentTypes });

    let investmentTypesMap = new Map(investmentTypes.map(t => [t._id.toString(), t]));
    let investmentIds = investmentTypes.flatMap((type) => type.investments);
    let investmentsArray = await investmentFactory.readMany(investmentIds);
    let allInvestmentsMap = new Map(investmentsArray.map(inv => [inv._id.toString(), inv]));

    let allEvents = await eventFactory.readMany(scenario.events);
    let allEventsMap = new Map(allEvents.map(event => [event._id.toString(), event]));

    // Collect all unique distribution IDs needed
    const allDistributionIds = investmentTypes.flatMap(type => [
        type.expectedAnnualIncomeDistribution,
        type.expectedAnnualReturnDistribution
    ]).filter(id => id); // Filter out null/undefined IDs

    allEvents.forEach(event => {
        if (event.expectedAnnualChangeDistribution) {
            allDistributionIds.push(event.expectedAnnualChangeDistribution);
        }
        if (event.startYearTypeDistribution) {
            allDistributionIds.push(event.startYearTypeDistribution);
        }
        if (event.durationTypeDistribution) {
            allDistributionIds.push(event.durationTypeDistribution);
        }
    });
    const uniqueDistIds = [...new Set(allDistributionIds.filter(id => id).map(id => id.toString()))];
    const distributions = uniqueDistIds.length > 0 ? await distributionFactory.readMany(uniqueDistIds) : [];
    const distributionMap = new Map(distributions.map(dist => [dist._id.toString(), dist]));

    // Setup invMap (maps investment ID to its type ID)
    await setupMap(scenario._id); // Assumes setupMap populates the global invMap correctly
    console.log("Initial data fetched.");
    // --- End Initial Data Fetch ---


    let cumulativeInflation = 0;
    let thisYearTaxes = 0;
    let lastYearGains = 0;
    let thisYearGains = 0;
    let curYearIncome = 0;
    let curYearSS = 0;
    let lastYearIncome = 0;
    let lastYearSS = 0;
    let lastYearEarlyWithdrawl = 0; // Renamed variable for clarity
    let curYearEarlyWithdrawals = 0; // Track early withdrawals subject to penalty this year
    while (currentYear <= endYear) {
		//console.time("loop")
        let allDbUpdateOps = [];        // Investment updates
        let allDbTypeUpdateOps = [];    // Investment Type updates
        let allDbEventOps = [];         // Event updates

        // Reset yearly accumulators
        curYearIncome = 0;
        curYearSS = 0;
        thisYearGains = 0;
        thisYearTaxes = 0;
        curYearEarlyWithdrawals = 0; // Reset penalty tracker

        // --- Start of Year Calculations ---

        // Inflation
		let inflationRate = await sample(
            scenario.inflationAssumption,
            scenario.inflationAssumptionDistribution
        );
        inflationRate = Math.max(-1, inflationRate); // Inflation rate should not be less than -100%
        const inflationEventDetails = `Year: ${currentYear + realYear} - INFLATION - ${
            Math.ceil(inflationRate * 1000) / 1000
        }\n`;
        updateLog(inflationEventDetails);
        cumulativeInflation = ((cumulativeInflation + 1) * (1 + inflationRate)) - 1;

        // Apply inflation to tax brackets and deductions (in memory)
        updateTaxBracketsForInflation(federalIncomeTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(federalIncomeTaxArray[1], inflationRate);
        updateTaxBracketsForInflation(stateIncomeTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(stateIncomeTaxArray[1], inflationRate);
        updateTaxBracketsForInflation(capitalGainTaxArray[0], inflationRate);
        updateTaxBracketsForInflation(capitalGainTaxArray[1], inflationRate);
        federalStandardDeductionObjectArray[0].standardDeduction *= (1 + inflationRate);
        federalStandardDeductionObjectArray[1].standardDeduction *= (1 + inflationRate);

        // Select correct tax objects based on current filing status (might change if spouse dies)
        if (scenario.filingStatus === "SINGLE") {
            federalIncomeTax = federalIncomeTaxArray[0];
            stateIncomeTax = stateIncomeTaxArray[0];
            capitalGainTax = capitalGainTaxArray[0];
            federalStandardDeduction = federalStandardDeductionObjectArray[0];
        } else {
            federalIncomeTax = federalIncomeTaxArray[1];
            stateIncomeTax = stateIncomeTaxArray[1];
            capitalGainTax = capitalGainTaxArray[1];
            federalStandardDeduction = federalStandardDeductionObjectArray[1]; // Corrected index
        }

        // Update scenario contribution limits for inflation (DB write happens inside helper)
        scenario = await updateContributionLimitsForInflation(scenario, inflationRate);

		// --- Process Events and Investments ---

        // Adjust event amounts for inflation/change (Modifies allEventsMap, cashInvestment)
		const adjustEventsResultPromise = adjustEventsAmount(
            scenario, inflationRate, currentYear,
            allEventsMap,       // Pass map (will be modified)
            cashInvestment,     // Pass cash reference (will be modified)
            distributionMap     // Pass distributions
        );

        // Update investment values (Growth/Income/Expenses) (Modifies allInvestmentsMap)
        const updateInvestmentsResult = await updateInvestments(
            investmentTypes,        // Pass array of types from pre-loop fetch
            allInvestmentsMap,      // Pass map to be modified
            distributionMap         // Pass pre-fetched distributions
        );
        curYearIncome += updateInvestmentsResult.income;
        allDbUpdateOps.push(...updateInvestmentsResult.dbUpdateOperations);

        // Required Minimum Distributions (RMDs) (Modifies allInvestmentsMap, investmentTypesMap)
        let rmdPromise;
        // Use the already fetched investmentsArray for the check
        const needsRMD = shouldPerformRMD(currentYear, scenario.userBirthYear, investmentsArray);
        if (needsRMD) {
            rmdPromise = processRMDs(
                rmdTable,
                currentYear,
                scenario.userBirthYear,
                scenario,
                allInvestmentsMap,
                investmentTypesMap,
                distributionMap // Pass distributions if needed by helper (check RMD logic)
            );
        }
        if (rmdPromise) {
            const rmdResult = await rmdPromise;
            curYearIncome += rmdResult.income;
            allDbUpdateOps.push(...rmdResult.dbInvestmentOps);
            allDbTypeUpdateOps.push(...rmdResult.dbInvestmentTypeOps);
        }

        // Process income/SS from adjusted events (await the promise)
        const adjustEventsResult = await adjustEventsResultPromise;
        curYearIncome += adjustEventsResult.income;
        curYearSS += adjustEventsResult.ss;
        const incomeByEvent = adjustEventsResult.incomeBreakdown;
        allDbEventOps.push(...adjustEventsResult.dbEventOps);
        allDbUpdateOps.push(...adjustEventsResult.dbCashOps); // Cash ops go with Investment ops
        const reportedIncome = curYearIncome; // Income before Roth

        // Roth Conversions (Modifies allInvestmentsMap, investmentTypesMap)
        let rothConversion = { incomeToAdd: 0, curYearEarlyWithdrawals: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
        if (scenario.startYearRothOptimizer !== undefined &&
            scenario.startYearRothOptimizer <= realYear + currentYear &&
            scenario.endYearRothOptimizer !== undefined &&
            scenario.endYearRothOptimizer >= realYear + currentYear)
        {
            rothConversion = await performRothConversion(
                scenario,
                federalIncomeTax, // Pass current applicable bracket
                curYearIncome, // Pass income *before* conversion
                curYearSS,
                currentYear,
                scenario.userBirthYear,
                allInvestmentsMap,
                investmentTypesMap,
                distributionMap // Pass distributions if needed by helper
            );
            curYearIncome += rothConversion.incomeToAdd; // Add converted amount to income *after* calculation
            curYearEarlyWithdrawals += rothConversion.curYearEarlyWithdrawals; // Accumulate penalty amount
            allDbUpdateOps.push(...rothConversion.dbInvestmentOps);
            allDbTypeUpdateOps.push(...rothConversion.dbInvestmentTypeOps);
        }

        // Calculate Taxes based on *last year's* income, SS, gains, and early withdrawals
        const calcTaxReturn = calculateTaxes(
            federalIncomeTax,
            stateIncomeTax,
            capitalGainTax,
            federalStandardDeduction.standardDeduction,
            lastYearIncome, // Use previous year's income
            lastYearSS,     // Use previous year's SS
            lastYearEarlyWithdrawl, // Use previous year's penalty amount
            lastYearGains,  // Use previous year's gains
            currentYear
        );
        thisYearTaxes = calcTaxReturn.t; // Taxes to be paid *this year* based on *last year*
        let earlyWithdrawalTaxPaid = calcTaxReturn.e; // Penalty paid *this year* based on *last year*


        // Process Expenses (including taxes calculated above) (Modifies allInvestmentsMap, cashInvestment)
        const expensesResult = processAllExpenses(
            scenario,
            thisYearTaxes, // Pass taxes to be paid this year
            currentYear,
            allEventsMap,
            investmentTypes,    // Pass types array
            allInvestmentsMap,
            cashInvestment,
            distributionMap // Pass distributions if needed
        );
        thisYearGains += expensesResult.capitalGainFromExpenses; // Gains realized *this year* from selling for expenses
        curYearIncome += expensesResult.incomeGainFromExpenses; // Income realized *this year* (e.g., selling pre-tax)
        allDbUpdateOps.push(...expensesResult.dbUpdateOperations);
        const totalExpenseBreakdown = [...expensesResult.nonDiscretionaryBreakdown, ...expensesResult.discretionaryBreakdown];
        let totalExpenses = expensesResult.nonDiscretionaryExpensesPaid + expensesResult.discretionaryExpensesPaid;
        let discretionaryAmountIgnored = expensesResult.discretionaryExpensesIgnored;
        let discretionaryAmountPaid = expensesResult.discretionaryExpensesPaid;


        // Process Investment Events (Contributions/Withdrawals) (Modifies allInvestmentsMap, cashInvestment, investmentTypesMap)
        const investmentEventsResult = processInvestmentEvents(
            scenario, currentYear,
            allEventsMap,
            allInvestmentsMap,
            cashInvestment,
            investmentTypesMap,
            distributionMap // Pass distributions if needed
        );
        allDbUpdateOps.push(...investmentEventsResult.dbUpdateOperations);

        // Rebalance Investments (Modifies allInvestmentsMap, investmentTypesMap)
        const rebalanceResult = rebalanceInvestments(
            scenario,
            currentYear,
            allEventsMap,
            allInvestmentsMap,
            investmentTypesMap,
            distributionMap // Pass distributions if needed
        );
        thisYearGains += rebalanceResult.capitalGain; // Gains realized *this year* from rebalancing
        allDbUpdateOps.push(...rebalanceResult.dbUpdateOperations);



        // --- Prepare for Next Year ---
        lastYearGains = thisYearGains; // This year's gains become next year's taxable gains
        lastYearIncome = curYearIncome; // This year's income is used for next year's tax calc
        lastYearSS = curYearSS;         // This year's SS is used for next year's tax calc
        lastYearEarlyWithdrawl = curYearEarlyWithdrawals; // This year's penalty amount for next year's tax calc


        // --- Record Results ---
        // Calculate total value and violation status using current maps
        let totalValue = 0;
        allInvestmentsMap.forEach(investment => {
             totalValue += investment.value;
        });
        const boolIsViolated = totalValue < scenario.financialGoal;

        const investmentValuesArray = [];
        investmentTypes.forEach(investmentType => { // Use the pre-fetched array
             investmentType.investments.forEach(investmentId => {
                 const inv = allInvestmentsMap.get(investmentId.toString());
                 if (inv) {
                      investmentValuesArray.push({
                          name: `${investmentType.name} ${inv.taxStatus}`,
                          value: inv.value,
                      });
                 }
             });
        });

        // Calculate discretionary percentage
        let discretionaryExpensesPercentage = 0; // Default if denominator is zero
        if (discretionaryAmountIgnored + discretionaryAmountPaid !== 0) {
            discretionaryExpensesPercentage =
                (discretionaryAmountPaid) / (discretionaryAmountIgnored + discretionaryAmountPaid);
        }

        const yearlyRes = {
            year: currentYear + realYear,
            inflationRate: inflationRate,
            cumulativeInflation: cumulativeInflation,
            investmentValues: investmentValuesArray,
            incomeByEvent: incomeByEvent,
            expenseByEvent: totalExpenseBreakdown, // Includes non-disc and disc paid
            totalIncome: reportedIncome, // Income before Roth conversion adjustment
            totalExpense: totalExpenses,
            totalTax: thisYearTaxes, // Tax paid this year (based on last year)
            earlyWithdrawalTax: earlyWithdrawalTaxPaid, // Penalty paid this year (based on last year)
            totalDiscretionaryExpenses: discretionaryExpensesPercentage, // Percentage paid
            isViolated: boolIsViolated,
            step1: step1,
            step2: step2,
        };

        results.yearlyResults.push(yearlyRes);

        // Update CSV log if enabled
		if (csvFile !== null && csvFile !== undefined) {
            // Pass the current state of the investments map to updateCSV
			await updateCSV(currentYear, Array.from(allInvestmentsMap.values()), scenario);
		}

        // --- Handle Spouse Death ---
        if (scenario.filingStatus === "MARRIEDJOINT") {
            if (
                currentYear + realYear >
                scenario.spouseLifeExpectancy + scenario.spouseBirthYear
            ) {
                const spouseDiedDetails = `Year: ${currentYear + realYear} - SPOUSE DIED\n`;
                updateLog(spouseDiedDetails);

                // Update relevant events amounts in DB and *in memory map*
                // Collect updates and add them to the main list instead of separate bulkWrite
                for (const eventIdStr of scenario.events) {
                    const event = allEventsMap.get(eventIdStr); // Get from map
                    if (event && (event.eventType === "INCOME" || event.eventType === "EXPENSE")) {
                        const originalAmount = event.amount;
                        const newAmount = Math.round(event.amount * event.userContributions * 100) / 100;

                        if (Math.abs(newAmount - originalAmount) > 0.001) {
                            // Update in-memory map immediately
                            event.amount = newAmount;
                            // Collect DB operation and add to main list
                            allDbEventOps.push({ // Add to the main list
                                updateOne: {
                                    filter: { _id: event._id },
                                    update: { $set: { amount: newAmount } },
                                    modelName: event.eventType
                                }
                            });
                        }
                    }
                }


                // Update scenario object in memory for the *next* iteration (will be re-read anyway)
                scenario.filingStatus = "SINGLE";
            }
        }
        


        // Re-read scenario at the end to get latest state for the *next* loop iteration
        // This is important especially if filingStatus changed
        // scenario = await scenarioFactory.read(scenario._id); // Use _id
        currentYear++;
		//console.timeEnd("loop")
    } // --- End While Loop ---
    await resultFactory.update(results._id, {
		yearlyResults: results.yearlyResults,
	});
	// Final update to the results document with all yearly results
    console.log("Simulation complete.");
    return results;
}