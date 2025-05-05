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

export async function adjustEventsAmount( // Needs async for sample
    // Data passed down from simulate:
    scenario,
    inflationRate,
    currentYear,
    allEventsMap,       // Pre-fetched map<eventId, eventObject> (MODIFIED IN PLACE)
    cashInvestment,     // Reference to cash investment object (MODIFIED IN PLACE)
    distributionMap     // Pre-fetched map<distId, distObject>
) {
    const realYear = new Date().getFullYear();
    const dbEventOps = [];      // Collect Event update operations
    const dbCashOps = [];       // Collect Cash Investment update operations
    const incomeByEvent = [];   // Breakdown of income received this year
    let curYearIncome = 0;      // Income received this year (excluding RMDs, Investment income)
    let curYearSS = 0;          // Social Security income received this year

    // Iterate through all events in the scenario
    for (const eventId of scenario.events) {
        const event = allEventsMap.get(eventId.toString());
        if (!event) {
            console.warn(`Year ${currentYear}: adjustEventsAmount - Event ${eventId} not found in map.`);
            continue;
        }

        // Process only INCOME or EXPENSE events
        if (event.eventType === "INCOME" || event.eventType === "EXPENSE") {
            let originalAmount = event.amount;
            let newAmount = event.amount;

            // Adjust for inflation if applicable
            if (event.isinflationAdjusted) {
                newAmount *= (1 + inflationRate);
            }

            // Apply expected annual change if the event has started or is ongoing
            // Note: Original logic applied change only if *within* start/duration. Should it apply cumulatively once started?
            // Assuming original logic: Apply change only during active years.
            const isActive = (event.startYear <= realYear + currentYear && event.startYear + event.duration >= realYear + currentYear);

            if (isActive && event.expectedAnnualChangeDistribution) {
                const changeDist = distributionMap.get(event.expectedAnnualChangeDistribution.toString());
                if (changeDist) {
                    let amountRate = await sample(event.expectedAnnualChange, changeDist);

                    // Apply user contributions multiplier for single filers if needed (Confirm logic - typically applies to contribution events?)
                    // This might be incorrect logic application here for income/expense events. Removing for now unless confirmed.
                    // if (scenario.filingStatus === "SINGLE") {
                    //     amountRate *= event.userContributions; // Does userContributions apply here?
                    // }

                    // Check if rate is percentage or fixed amount
                    if (changeDist.distributionType.includes("PERCENTAGE")) {
                        // Apply percentage change to the amount *after* inflation adjustment
                        newAmount += newAmount * amountRate;
                    } else {
                        // Apply fixed amount change
                        newAmount += amountRate;
                    }
                } else {
                    console.warn(`Year ${currentYear}: Distribution ${event.expectedAnnualChangeDistribution} not found for event ${event.name}.`);
                }
            }

            // Round the final amount
            newAmount = Math.max(0, Math.round(newAmount * 100) / 100); // Ensure non-negative

            // If the amount changed, update the event object in memory and collect DB op
            if (Math.abs(newAmount - originalAmount) > 0.001) {
                event.amount = newAmount;
                dbEventOps.push({
                    updateOne: {
                        filter: { _id: event._id },
                        // Decide model based on type for bulkWrite later if needed
                        // Or use a generic event update if models are unified
                        // For now, assume separate Income/Expense models might be needed
                        // Alternatively, update the base 'Event' model if amount is there
                        update: { $set: { amount: event.amount } },
                        modelName: event.eventType // Store model name for later bulkWrite grouping
                    }
                });
            }

            // If it's an active INCOME event this year, process income
            if (event.eventType === "INCOME" && isActive) {
                const incomeAmount = event.amount; // Use the final adjusted amount
                if (incomeAmount > 0) {
                    updateLog(`Year: ${currentYear} - INCOME - ${event.name}: ${event.description} - Amount $${incomeAmount.toFixed(2)}\n`);
                    incomeByEvent.push({ name: event.name, value: incomeAmount });

                    // --- Modify Cash Investment (In Memory) ---
                    if (cashInvestment) {
                        cashInvestment.value = Math.round((cashInvestment.value + incomeAmount) * 100) / 100;
                        // Collect cash operation (will be filtered later if cash updated multiple times)
                        dbCashOps.push({
                            updateOne: {
                                filter: { _id: cashInvestment._id },
                                update: { $set: { value: cashInvestment.value } }
                            }
                        });
                    } else {
                        console.error(`Year ${currentYear}: Cannot add income from event ${event.name} - Cash investment reference is missing!`);
                    }

                    curYearIncome += incomeAmount;
                    if (event.isSocialSecurity) {
                        curYearSS += incomeAmount;
                    }
                }
            }
        } // End if INCOME or EXPENSE
    } // End loop over scenario events

    // --- Final Filtering for Overlapping Updates ---
    const finalDbEventOpsMap = new Map();
    dbEventOps.forEach(op => {
        if (op?.updateOne?.filter?._id) {
            finalDbEventOpsMap.set(op.updateOne.filter._id.toString(), op);
        }
    });

    const finalDbCashOpsMap = new Map();
    dbCashOps.forEach(op => {
        if (op?.updateOne?.filter?._id) {
            finalDbCashOpsMap.set(op.updateOne.filter._id.toString(), op);
        }
    });


    // Return calculated values and DB operations
    return {
        income: curYearIncome,
        ss: curYearSS,
        incomeBreakdown: incomeByEvent,
        dbEventOps: Array.from(finalDbEventOpsMap.values()),
        dbCashOps: Array.from(finalDbCashOpsMap.values()),
        cashInvestment: cashInvestment
    };
}
