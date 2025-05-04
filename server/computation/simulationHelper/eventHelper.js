import seedrandom from 'seedrandom';
import mongoose from "mongoose";
import { cursorTo } from 'readline';
import { sample } from './sample.js';
import { investmentTypeFactory,
        investmentFactory,
        eventFactory,
        scenarioFactory,
        taxFactory,
        simulationFactory,
        distributionFactory,
        resultFactory,
} from './simulationHelper.js';
import { updateCSV, updateLog } from './logHelpers.js';
import { logFile, csvFile } from '../simulator.js';
import { invMap } from './simulationHelper.js';

export async function adjustEventsAmount(eventsMap, inflationRate, scenario, currentYear, cashInvestment) {
    const realYear = new Date().getFullYear();
    const incomeUpdates = [];
    const expenseUpdates = [];
    const incomeByEvent = [];
    let curYearIncome =0;
    let curYearSS = 0;
    for (const eventId of scenario.events) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            //console.log(`Event with ID ${eventId} not found!`);
            continue;
        }
        
        if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {
            //adjusts event.amount for inflation and expected change
            if (event.isinflationAdjusted) {
                event.amount = event.amount * (1 + inflationRate);
            }
            if (event.startYear < realYear + currentYear && event.startYear + event.duration >= realYear + currentYear) {
                let amountRate = await sample(event.expectedAnnualChange, event.expectedAnnualChangeDistribution);
                let distribution = await distributionFactory.read(event.expectedAnnualChangeDistribution);
                if (scenario.filingStatus === "SINGLE") {
                    amountRate *= event.userContributions;
                }
                if (distribution.distributionType === "FIXED_AMOUNT" || distribution.distributionType === "UNIFORM_AMOUNT" || distribution.distributionType === "NORMAL_AMOUNT") {
                } else {
                    amountRate = (amountRate) * event.amount;
                }
                event.amount = Math.max(0, Math.round((event.amount + amountRate) * 100) / 100);
            }
            const updateOp = {
                updateOne: {
                    filter: { _id: event._id },
                    update: { $set: { amount: event.amount } }
                }
            };
    
            if (event.eventType === "INCOME") {
                incomeUpdates.push(updateOp);
                if (    //seperate from next section due to if its the start year of the event
                    !(
                        event.startYear <= realYear + currentYear &&
                        event.startYear + event.duration >= realYear + currentYear
                    )
                ) {
                    continue;
                }
                const income  = event.amount;

                const incomeEventDetails = `Year: ${currentYear} - INCOME - ${
                    event.name
                }: ${event.description} - Amount is $${Math.ceil(income * 100) / 100}\n`;

                updateLog(incomeEventDetails);

                incomeByEvent.push({
                    name: event.name,
                    value: income,
                });
                cashInvestment.value += income;
                curYearIncome += income;
                if (event.isSocialSecurity) {
                    curYearSS += income;
                }
            } else if (event.eventType === "EXPENSE") {
                expenseUpdates.push(updateOp);
            }
        }
    }
    if (incomeUpdates.length > 0) {
        await mongoose.model('Income').bulkWrite(incomeUpdates, {});
    }
    
    if (expenseUpdates.length > 0) {
        await mongoose.model('Expense').bulkWrite(expenseUpdates, {});
    }
    cashInvestment = await investmentFactory.update(cashInvestment._id, {
        value: cashInvestment.value
    });

    return {incomeByEvent, curYearIncome, curYearSS, cashInvestment};
}