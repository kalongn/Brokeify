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
  updateTaxBracketsForInflation,
  updateContributionLimitsForInflation,
  adjustEventAmount,
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

export async function simulate(
  scenario,
  federalIncomeTaxArray,
  stateIncomeTaxArray,
  federalStandardDeductionObjectArray,
  capitalGainTaxArray,
  rmdTable,
  csvFileL,
  logFileL
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

  let investmentTypes = await Promise.all(
    scenario.investmentTypes.map(
      async (id) => await investmentTypeFactory.read(id)
    )
  );
  let cashInvestment = await getCashInvestment(investmentTypes);
  scenario.investmentTypes = investmentTypes.map((type) => type._id);
  scenarioFactory.update(scenario._id, scenario);

  let investmentIds = investmentTypes.flatMap((type) => type.investments);

  let investments = await Promise.all(
    investmentIds.map(async (id) => await investmentFactory.read(id))
  );

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
    curYearIncome = 0;
    curYearSS = 0;
    thisYearGains = 0;
    thisYearTaxes = 0;
    investmentTypes = await Promise.all(
      scenario.investmentTypes.map(
        async (id) => await investmentTypeFactory.read(id)
      )
    );
    investmentIds = investmentTypes.flatMap((type) => type.investments);

    investments = await Promise.all(
      investmentIds.map(async (id) => await investmentFactory.read(id))
    );

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

    await updateContributionLimitsForInflation(scenario, inflationRate);

    const events = scenario.events;
    //update events
    for (const i of events) {
      const event = await eventFactory.read(i);

      if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {
        await adjustEventAmount(event, inflationRate, scenario, currentYear);
      }
    }
    const incomeByEvent = [];

    for (const i of events) {
      const event = await eventFactory.read(i);
      if (event.eventType !== "INCOME") {
        continue;
      }

      const income = event.amount;

      if (
        !(
          event.startYear <= realYear + currentYear &&
          event.startYear + event.duration >= realYear + currentYear
        )
      ) {
        continue;
      }

      const incomeEventDetails = `Year: ${currentYear} - INCOME - ${
        event.name
      }: ${event.description} - Amount is $${Math.ceil(income * 100) / 100}\n`;
      updateLog(incomeEventDetails);
      event.amount = income;

      incomeByEvent.push({
        name: event.name,
        value: income,
      });

      const a = await investmentFactory.read(cashInvestment._id);

      await investmentFactory.update(cashInvestment._id, {
        value: a.value + income,
      });

      curYearIncome += income;
      if (event.isSocialSecurity) {
        curYearSS += income;
      }
    }
    const reportedIncome = curYearIncome;

    //await processRMDs(rmdTable, currentYear, scenario.userBirthYear, scenario);
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

    curYearIncome += await updateInvestments(investmentTypes);

    const rothConversion = await performRothConversion(
      curYearIncome,
      curYearSS,
      federalIncomeTax,
      currentYear,
      scenario.userBirthYear,
      scenario.orderedRothStrategy,
      investmentTypes
    );

    curYearIncome += rothConversion.curYearIncome;

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
    thisYearTaxes = calcTaxReturn.t;
    earlyWithdrawalTaxPaid = calcTaxReturn.e;
    let nonDiscretionaryExpenses = 0;
    const expensesReturn = await processExpenses(scenario, lastYearTaxes, currentYear);
    nonDiscretionaryExpenses = expensesReturn.t;
    thisYearGains += expensesReturn.c; //if you sell investments
    const expenseBreakdown = expensesReturn.expenseBreakdown;

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

    await processInvestmentEvents(scenario, currentYear);

    thisYearGains += await rebalanceInvestments(scenario, currentYear);

    lastYearGains = thisYearGains;
    thisYearGains = 0;

    investmentTypes = await Promise.all(
      scenario.investmentTypes.map(
        async (id) => await investmentTypeFactory.read(id)
      )
    );
    investmentIds = investmentTypes.flatMap((type) => type.investments);
    investments = await Promise.all(
      investmentIds.map(async (id) => await investmentFactory.read(id))
    );
    let totalValue = 0;
    for (const investmentIndex in investments) {
      totalValue += investments[investmentIndex].value;
    }
    //console.log(`The net asset value of ${currentYear+realYear} is ${totalValue}`);
    let boolIsViolated = false;
    if (totalValue < scenario.financialGoal) {
      boolIsViolated = true;
    }
    //create array of touples of investment._id, investment.value
    const investmentValuesArray = [];
    for(const i in scenario.investmentTypes){ 
      for (const investmentIndex in investmentTypes[i].investments) {
        const inv = await investmentFactory.read(investmentTypes[i].investments[investmentIndex]);
        const touple = {
          name: `${investmentTypes[i].name} ${inv.taxStatus}`,
          value: inv.value,
        };
        investmentValuesArray.push(touple);
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
    };

    results.yearlyResults.push(yearlyRes);

    await resultFactory.update(results._id, {
      yearlyResults: results.yearlyResults,
    });
    await updateCSV(currentYear, investments, scenario);
    lastYearIncome = curYearIncome;
    lastYearSS = curYearSS;
    lastYearEarlyWithdrawl = rothConversion.curYearEarlyWithdrawals;

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
            //if spouse was 100%, remove it completley
            if (event.userContributions === 0) {
              await eventFactory.delete(event._id);
            } else {
              await eventFactory.update(event._id, {
                amount: event.amount * event.userContributions,
              });
            }
          }
        }

        //update tax status
        await scenarioFactory.update(scenario._id, { filingStatus: "SINGLE" });
      }
    }

    scenario = await scenarioFactory.read(scenario);
    currentYear++;
  }

  console.log("Simulation complete.");
  return results;
}
