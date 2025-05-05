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




//Asked Gemini 2.5 Pro to consolidate the previous 2 functions and to remove db reads/writes
export function processAllExpenses(
    scenario,
    calculatedTaxes, // Renamed from previousYearTaxes for clarity
    currentYear,
    // Data passed down from simulate:
    allEventsMap,      // Pre-fetched events map
    allInvestmentTypes, // Pre-fetched investment types array/map
    allInvestments,     // Pre-fetched investments array/map (will be modified in memory)
    cashInvestment      // Reference to the specific cash investment object from allInvestments
) {
    let nonDiscretionaryTotal = calculatedTaxes;
    const nonDiscretionaryBreakdown = [];
    let discretionaryTotalToPay = 0;
    const discretionaryBreakdown = [];
    let capitalGain = 0;
    let incomeGain = 0;
    const investmentUpdates = []; // Array to collect DB update operations

    // --- Calculate Expense Amounts ---
    const realYear = new Date().getFullYear();
    for (const [eventId, event] of allEventsMap.entries()) {
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        if (event.eventType === "EXPENSE") {
            if (event.isDiscretionary === false) {
                nonDiscretionaryTotal += event.amount;
                nonDiscretionaryBreakdown.push({ name: event.name, value: event.amount });
            } else {
                discretionaryTotalToPay += event.amount;
            }
        }
    }
    nonDiscretionaryTotal = Math.round(nonDiscretionaryTotal * 100) / 100;
    discretionaryTotalToPay = Math.round(discretionaryTotalToPay * 100) / 100;
    // --- Pay Non-Discretionary Expenses ---
    let remainingNonDisc = nonDiscretionaryTotal;
    // Pay from cash first (modify the passed cashInvestment object)
    if (cashInvestment.value >= remainingNonDisc) {
        cashInvestment.value -= remainingNonDisc;
        // Add cash update to list
        investmentUpdates.push({ updateOne: { filter: { _id: cashInvestment._id }, update: { $set: { value: cashInvestment.value } } } });
        remainingNonDisc = 0;
    } else {
        remainingNonDisc -= cashInvestment.value;
        cashInvestment.value = 0;
        investmentUpdates.push({ updateOne: { filter: { _id: cashInvestment._id }, update: { $set: { value: 0 } } } });
    }

    // Pay remaining from strategy investments
    if (remainingNonDisc > 0) {
        for (const investmentId of scenario.orderedExpenseWithdrawalStrategy) {
            if (remainingNonDisc <= 0) break;
            const investment = allInvestments.get(investmentId.toString()); // Assuming allInvestments is a Map
            if (!investment || investment.value <= 0) continue;

            const sellAmount = Math.min(investment.value, remainingNonDisc);
            const gainRatio = investment.value > 0 ? (investment.value - investment.purchasePrice) / investment.value : 0;
            const gainFromSell = sellAmount * gainRatio;

            investment.value -= sellAmount;
            investment.purchasePrice = Math.max(0, investment.purchasePrice - sellAmount); // Adjust purchase price
            remainingNonDisc -= sellAmount;

            if (investment.taxStatus === "NON_RETIREMENT") {
                capitalGain += gainFromSell;
            } else if (investment.taxStatus === "PRE_TAX_RETIREMENT") {
                incomeGain += gainFromSell; // Selling pre-tax generates ordinary income
            }
            // Add strategy investment update to list
             investmentUpdates.push({ updateOne: {
                 filter: { _id: investment._id },
                 update: { $set: { value: investment.value, purchasePrice: investment.purchasePrice } }
             }});
        }
    }
    // Log non-discretionary payments here if needed...
    nonDiscretionaryBreakdown.forEach(exp => updateLog(`Year: ${currentYear} - EXPENSE - Paying non-disc $${Math.ceil(exp.value*100)/100} for ${exp.name}\n`));
    //if(calculatedTaxes > 0) updateLog(`Year: ${currentYear} - EXPENSE - Paying non-disc $${Math.ceil(calculatedTaxes*100)/100} for Taxes\n`);


    // --- Determine & Pay Discretionary Expenses ---
    let discretionaryAmountPaid = 0;
    let discretionaryAmountIgnored = 0;
    if (discretionaryTotalToPay > 0) {
        // Calculate current total value from the *modified* in-memory investments
        let currentTotalValue = 0;
        allInvestments.forEach(inv => currentTotalValue += inv.value);
        // Calculate total in strategy from *modified* in-memory investments
        let currentTotalInStrategy = 0;
        scenario.orderedExpenseWithdrawalStrategy.forEach(id => {
             const inv = allInvestments.get(id.toString());
             if (inv) currentTotalInStrategy += inv.value;
        });


        let amountCanAfford = Math.max(0, Math.min(currentTotalValue - scenario.financialGoal, currentTotalInStrategy));
        console.log(amountCanAfford)
        let amountToPay = Math.min(discretionaryTotalToPay, amountCanAfford);
        discretionaryAmountPaid = amountToPay;
        discretionaryAmountIgnored = discretionaryTotalToPay - amountToPay;

        // Pay discretionary (modify investments in memory again)
        let remainingDiscToPay = amountToPay;
        // Pay from cash first
        if (cashInvestment.value >= remainingDiscToPay) {
            cashInvestment.value -= remainingDiscToPay;
            // Update existing cash update operation or add a new one if it wasn't touched before
            const cashUpdateIndex = investmentUpdates.findIndex(op => op.updateOne.filter._id.toString() === cashInvestment._id.toString());
             if (cashUpdateIndex !== -1) {
                 investmentUpdates[cashUpdateIndex].updateOne.update.$set.value = cashInvestment.value;
             } else {
                  investmentUpdates.push({ updateOne: { filter: { _id: cashInvestment._id }, update: { $set: { value: cashInvestment.value } } } });
             }
            remainingDiscToPay = 0;
        } else {
            remainingDiscToPay -= cashInvestment.value;
            cashInvestment.value = 0;
             const cashUpdateIndex = investmentUpdates.findIndex(op => op.updateOne.filter._id.toString() === cashInvestment._id.toString());
              if (cashUpdateIndex !== -1) {
                  investmentUpdates[cashUpdateIndex].updateOne.update.$set.value = 0;
              } else {
                  investmentUpdates.push({ updateOne: { filter: { _id: cashInvestment._id }, update: { $set: { value: 0 } } } });
              }
        }
        // Pay remaining from strategy
        if (remainingDiscToPay > 0) {
            for (const investmentId of scenario.orderedExpenseWithdrawalStrategy) {
                 if (remainingDiscToPay <= 0) break;
                 const investment = allInvestments.get(investmentId.toString());
                 if (!investment || investment.value <= 0) continue;

                 const sellAmount = Math.min(investment.value, remainingDiscToPay);
                 const gainRatio = investment.value > 0 ? (investment.value - investment.purchasePrice) / investment.value : 0;
                 const gainFromSell = sellAmount * gainRatio;

                 investment.value -= sellAmount;
                 investment.purchasePrice = Math.max(0, investment.purchasePrice - sellAmount);
                 remainingDiscToPay -= sellAmount;

                 if (investment.taxStatus === "NON_RETIREMENT") {
                     capitalGain += gainFromSell;
                 } else if (investment.taxStatus === "PRE_TAX_RETIREMENT") {
                     incomeGain += gainFromSell;
                 }

                 // Update existing update operation or add new one
                 const updateIndex = investmentUpdates.findIndex(op => op.updateOne.filter._id.toString() === investment._id.toString());
                  if (updateIndex !== -1) {
                      investmentUpdates[updateIndex].updateOne.update.$set.value = investment.value;
                      investmentUpdates[updateIndex].updateOne.update.$set.purchasePrice = investment.purchasePrice;
                  } else {
                       investmentUpdates.push({ updateOne: {
                           filter: { _id: investment._id },
                           update: { $set: { value: investment.value, purchasePrice: investment.purchasePrice } }
                       }});
                  }
            }
        }
         // Log discretionary payments here if needed...
        // Need to determine which specific discretionary events were paid up to amountToPay
        let logPaidAmount = amountToPay;
        for (const [eventId, event] of allEventsMap.entries()) {
            if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
                continue;
            }
            // (Logic to iterate discretionary events and log partial/full payment)
             if (logPaidAmount <= 0) break;
              if (event.eventType === "EXPENSE" && event.isDiscretionary === true) {
                  const payment = Math.min(logPaidAmount, event.amount);
                   if (payment > 0) {
                       updateLog(`Year: ${currentYear} - EXPENSE - Paying disc $${Math.ceil(payment*100)/100} for ${event.name}\n`);
                       discretionaryBreakdown.push({ name: event.name, value: payment });
                       logPaidAmount -= payment;
                   }
              }
        }

    } else {
         discretionaryAmountIgnored = discretionaryTotalToPay;
         discretionaryAmountPaid = 0;
    }


    // --- Return Results ---
    return {
        nonDiscretionaryExpensesPaid: nonDiscretionaryTotal,
        discretionaryExpensesPaid: discretionaryAmountPaid,
        discretionaryExpensesIgnored: discretionaryAmountIgnored,
        capitalGainFromExpenses: capitalGain,
        incomeGainFromExpenses: incomeGain,
        nonDiscretionaryBreakdown: nonDiscretionaryBreakdown,
        discretionaryBreakdown: discretionaryBreakdown,
        dbUpdateOperations: investmentUpdates, // List of operations for bulkWrite
        cashInvestment: cashInvestment
    };
}