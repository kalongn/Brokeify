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


export function shouldPerformRMD(currentYear, birthYear, investments) {
    // If the user’s age is at least 74 and at the end of the previous
    // year, there is at least one investment with tax status = “pre-tax” 
    // and with a positive value
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;
    

    if (age < 74) {
        return false;
    }
    
    //if there is at least one pre-tax investment with a positive value
    const hasPreTaxInvestment = investments.some(inv =>
        inv.taxStatus === "PRE_TAX_RETIREMENT" && inv.value > 0
    );

    return hasPreTaxInvestment;
}
//Asked Gemini 2.5 to optimize by removing db reads/writes
export async function processRMDs(
    // Data passed down from simulate:
    rmdTable,
    currentYear,
    birthYear,
    scenario,
    allInvestmentsMap,      // Pre-fetched map<investmentId, investmentObject> (MODIFIED IN PLACE)
    investmentTypesMap      // Pre-fetched map<typeId, typeObject> (MODIFIED IN PLACE if new inv added)
) {
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;
    const dbInvestmentOps = [];     // Collect investment update operations
    const dbInvestmentTypeOps = []; // Collect investment type update operations
    let totalRmdAmount = 0;         // RMD amount calculated

    // Calculate RMD amount
    // Find RMD table distribution period
    let index = rmdTable.ages.indexOf(age);
    // If age is not exact, find the next highest age or use the last entry
    if (index === -1) {
         index = rmdTable.ages.findIndex(rmdAge => rmdAge >= age);
         if (index === -1) { // Age is greater than any listed age
             index = rmdTable.ages.length - 1;
         }
    }
    const distributionPeriod = rmdTable.distributionPeriods[index];

    if (!distributionPeriod || distributionPeriod <= 0) {
         console.warn(`Year ${currentYear}: Invalid distribution period (${distributionPeriod}) found for age ${age}. Skipping RMD.`);
         return { income: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
    }


    // Calculate sum of PRE_TAX_RETIREMENT investment values from the map
    let totalPreTaxValue = 0;
    allInvestmentsMap.forEach(inv => {
        if (inv.taxStatus === "PRE_TAX_RETIREMENT") {
            totalPreTaxValue += inv.value;
        }
    });
    totalPreTaxValue = Math.round(totalPreTaxValue * 100) / 100;


    if (totalPreTaxValue <= 0) {
        return { income: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] }; // No RMD needed if no pre-tax value
    }

    totalRmdAmount = Math.max(0, Math.round((totalPreTaxValue / distributionPeriod) * 100) / 100);
    if (totalRmdAmount <= 0) {
        return { income: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
    }


    // Process RMD withdrawal according to orderedRMDStrategy
    let remainingRMDToWithdraw = totalRmdAmount;

    for (const sourceInvestmentId of scenario.orderedRMDStrategy) {
        if (remainingRMDToWithdraw <= 0) break;

        // Get the source pre-tax investment object from the map
        const sourceInvestment = allInvestmentsMap.get(sourceInvestmentId.toString());

        // Skip if not found, not pre-tax, or has no value
        if (!sourceInvestment || sourceInvestment.taxStatus !== "PRE_TAX_RETIREMENT" || sourceInvestment.value <= 0) {
            continue;
        }

        // Determine the actual amount to withdraw from this source
        const withdrawAmount = Math.min(sourceInvestment.value, remainingRMDToWithdraw);
         if (withdrawAmount <= 0) continue;

        // Find the investment type
        const investmentTypeId = invMap.get(sourceInvestmentId.toString()); // Assumes invMap is up-to-date or passed
        const investmentType = investmentTypeId ? investmentTypesMap.get(investmentTypeId) : null;

        if (!investmentType) {
             console.error(`Year ${currentYear}: RMD Processing ERROR - Could not find InvestmentType for source investment ${sourceInvestmentId}. Halting RMD for this source.`);
             // Potentially throw error or just skip this source? Skipping for now.
             continue;
        }

        // --- Modify Source Investment (In Memory) ---
        sourceInvestment.value = Math.round((sourceInvestment.value - withdrawAmount) * 100) / 100;
        // RMD withdrawal comes out, basis reduction might depend on specific tax rules (often full amount is income)
        // Original logic didn't adjust purchase price here, maintain that.
        // sourceInvestment.purchasePrice = Math.max(0, sourceInvestment.purchasePrice * (sourceInvestment.value / (sourceInvestment.value + withdrawAmount)));

        // Add source update operation
        dbInvestmentOps.push({
            updateOne: {
                filter: { _id: sourceInvestment._id },
                update: { $set: { value: sourceInvestment.value /*, purchasePrice: sourceInvestment.purchasePrice */ } }
            }
        });

        // --- Find or Create Destination NON_RETIREMENT Investment ---
        let destinationInvestment = null;
        // Find existing non-retirement investment within the same type
        for (const invId of investmentType.investments) {
            const potentialDest = allInvestmentsMap.get(invId.toString());
            if (potentialDest && potentialDest.taxStatus === "NON_RETIREMENT") {
                destinationInvestment = potentialDest;
                break;
            }
        }

        if (destinationInvestment) {
            // --- Update Existing Destination (In Memory) ---
            destinationInvestment.value = Math.round((destinationInvestment.value + withdrawAmount) * 100) / 100;
            // Add withdrawn amount to purchase price (basis) of the non-retirement account
            destinationInvestment.purchasePrice = Math.round((destinationInvestment.purchasePrice + withdrawAmount) * 100) / 100;

            // Add destination update operation
            dbInvestmentOps.push({
                updateOne: {
                    filter: { _id: destinationInvestment._id },
                    update: { $set: { value: destinationInvestment.value, purchasePrice: destinationInvestment.purchasePrice } }
                }
            });
        } else {
            // --- Create New Destination Investment (Immediate DB Create + In Memory Update) ---
            const newInvestmentData = {
                value: withdrawAmount,
                purchasePrice: withdrawAmount, // Basis starts at the amount transferred
                taxStatus: "NON_RETIREMENT"
            };
            try {
                const createdInvestment = await investmentFactory.create(newInvestmentData);
                // Add to simulation's current state
                allInvestmentsMap.set(createdInvestment._id.toString(), createdInvestment);
                if (invMap) invMap.set(createdInvestment._id.toString(), investmentType._id.toString()); // Update invMap if used

                // Add new investment's ID to its parent type (in memory)
                investmentType.investments.push(createdInvestment._id);

                // Collect operation to update the InvestmentType document in DB
                dbInvestmentTypeOps.push({
                    updateOne: {
                        filter: { _id: investmentType._id },
                        update: { $set: { investments: investmentType.investments } }
                    }
                });
                 console.log(`Year ${currentYear}: Created new RMD destination investment ${createdInvestment._id} for type ${investmentType.name}`);

            } catch (error) {
                 console.error(`Year ${currentYear}: Failed to create new RMD destination investment for type ${investmentType.name}. Error: ${error}`);
                 // Revert source investment change? Halt? Log and continue?
                 sourceInvestment.value += withdrawAmount; // Revert source change
                 const sourceOpIndex = dbInvestmentOps.findIndex(op => op.updateOne.filter._id.toString() === sourceInvestment._id.toString());
                 if (sourceOpIndex > -1) dbInvestmentOps.splice(sourceOpIndex, 1);
                 continue; // Skip to next source investment
            }
        }

        // Update remaining amount
        remainingRMDToWithdraw -= withdrawAmount;

        updateLog(`Year: ${currentYear} - RMD - Withdrawing $${withdrawAmount.toFixed(2)} from pre-tax, depositing to non-retirement within Type ${investmentType.name}.\n`);

    } // End loop through strategy

    if (remainingRMDToWithdraw > 0.01) { // Check if significant amount couldn't be withdrawn
         console.warn(`Year ${currentYear}: RMD Warning - Could not fully withdraw required RMD. $${remainingRMDToWithdraw.toFixed(2)} remains.`);
         // This might happen if pre-tax accounts in the strategy run out of funds.
         // The calculated totalRmdAmount is still added to income regardless.
    }

    // --- Final Filtering for Overlapping Updates ---
    const finalDbInvestmentOpsMap = new Map();
    dbInvestmentOps.forEach(op => {
        if (op?.updateOne?.filter?._id) {
            finalDbInvestmentOpsMap.set(op.updateOne.filter._id.toString(), op);
        }
    });
    const finalDbInvestmentTypeOpsMap = new Map();
     dbInvestmentTypeOps.forEach(op => {
         if (op?.updateOne?.filter?._id) {
             finalDbInvestmentTypeOpsMap.set(op.updateOne.filter._id.toString(), op);
         }
     });

    // --- Return RMD amount (as income) and DB operations ---
    return {
        income: totalRmdAmount, // The calculated RMD is treated as income
        dbInvestmentOps: Array.from(finalDbInvestmentOpsMap.values()),
        dbInvestmentTypeOps: Array.from(finalDbInvestmentTypeOpsMap.values())
    };
}


export async function updateInvestments(
    currentInvestmentTypes, // Array of investment type objects
    allInvestmentsMap,      // Map<investmentId, investmentObject> (MODIFIED IN PLACE)
    distributionMap         // Map<distId, distObject>
) {
    let curYearIncome = 0; // Track taxable income
    const dbUpdateOperations = [];

    for (const type of currentInvestmentTypes) {
        // --- Sample Income & Return ONCE per Investment Type ---
        const incomeDist = distributionMap.get(type.expectedAnnualIncomeDistribution.toString());
        const returnDist = distributionMap.get(type.expectedAnnualReturnDistribution.toString());

        if (!incomeDist || !returnDist) {
            console.warn(`Distributions missing for Type ${type.name}. Skipping type.`);
            continue;
        }

        // Sample the rate or amount for the entire type for this year
        const sampledIncomeRateOrAmount = await sample(type.expectedAnnualIncome, incomeDist);
        const sampledReturnRateOrAmount = await sample(type.expectedAnnualReturn, returnDist);
        const isIncomePercentage = incomeDist.distributionType.includes("PERCENTAGE");
        const isReturnPercentage = returnDist.distributionType.includes("PERCENTAGE");
        // --- End Sampling per Type ---

        for (const investmentID of type.investments) {
            const investment = allInvestmentsMap.get(investmentID.toString());

            if (!investment || investment.taxStatus === "CASH") {
                continue;
            }

            const initialValue = investment.value; // Value at start of year's update step

            // --- Calculate generated income ---
            let generatedIncome = 0;
            if (isIncomePercentage) {
                generatedIncome = initialValue * sampledIncomeRateOrAmount; // Apply type's rate to start value
            } else {
                // Apply type's fixed amount (distribute amount across investments? or apply fully to each? Let's assume apply fully per investment for now, matching original potential intent if multiple investments existed)
                // If amount should be split: Need total value of type, then proportion for this investment.
                // Applying fully seems simpler based on original structure.
                generatedIncome = sampledIncomeRateOrAmount;
            }
            generatedIncome = Math.round(generatedIncome * 100) / 100;

            // Add income to curYearIncome if applicable
            if (investment.taxStatus === "NON_RETIREMENT" && type.taxability) {
                curYearIncome += generatedIncome;
            }

            // --- Modify Investment Object In Memory ---
            investment.value += generatedIncome;
            investment.purchasePrice += generatedIncome; // Reinvest income basis

            // --- Calculate value change (growth) ---
            let growthAmount = 0;
             // Apply growth rate/amount to value *after* income reinvestment
            const valueAfterIncome = investment.value;
            if (isReturnPercentage) {
                growthAmount = valueAfterIncome * sampledReturnRateOrAmount;
            } else {
                // Apply type's fixed growth amount
                growthAmount = sampledReturnRateOrAmount;
            }
            growthAmount = Math.round(growthAmount * 100) / 100;

            // Apply growth
            investment.value += growthAmount;

            // --- Calculate expenses ---
            let expenses = 0;
            if (type.expenseRatio > 0) {
                 // Use average value over the year *within this update step*
                 // Avg = (Value after income + Value after income&growth) / 2
                 // let avgValueForExpense = (valueAfterIncome + investment.value) / 2;
                 // Or simpler: Use value *before* expenses are deducted
                 expenses = investment.value * type.expenseRatio;
                 expenses = Math.round(expenses * 100) / 100;
            }

            // Subtract expenses
            investment.value -= expenses;
            investment.value = Math.max(0, Math.round(investment.value * 100) / 100);
            // Ensure purchase price doesn't go negative if value does temporarily (unlikely)
            investment.purchasePrice = Math.max(0, Math.round(investment.purchasePrice * 100) / 100);


            // --- Collect DB Update Operation ---
            dbUpdateOperations.push({
                updateOne: {
                    filter: { _id: investment._id },
                    update: { $set: { value: investment.value, purchasePrice: investment.purchasePrice } },
                },
            });
        } // End loop over investments
    } // End loop over types

    // --- Final Filtering ---
    const finalDbOpsMap = new Map();
    dbUpdateOperations.forEach(op => {
        if (op?.updateOne?.filter?._id) {
            finalDbOpsMap.set(op.updateOne.filter._id.toString(), op);
        }
    });

    return {
        income: curYearIncome,
        dbUpdateOperations: Array.from(finalDbOpsMap.values())
    };
}
//Asked Gemini 2.5 pro to optimize roth conversion to use minimal db writes/reads
export async function performRothConversion(
    // Data passed down from simulate:
    scenario,
    federalIncomeTax,       // Current applicable federal tax brackets
    curYearIncomeSoFar,     // Income calculated *before* this conversion
    curYearSS,
    currentYear,
    birthYear,
    allInvestmentsMap,      
    investmentTypesMap,
) {
    const dbInvestmentOps = [];     // Collect investment update operations
    const dbInvestmentTypeOps = []; // Collect investment type update operations
    let incomeFromConversion = 0;   // Track income generated by this conversion
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear; 
    const curYearFedTaxableIncome = curYearIncomeSoFar - 0.15 * curYearSS;

    // Find the user's current tax bracket (using potentially updated brackets)
    const taxBracket = federalIncomeTax.taxBrackets.find(bracket =>
        curYearFedTaxableIncome >= bracket.lowerBound && curYearFedTaxableIncome < (bracket.upperBound || Infinity) // Use < for upperBound consistency
    );

    // If no bracket found or already in highest bracket with no upper bound, cannot optimize further this way
    if (!taxBracket || taxBracket.upperBound === Infinity || taxBracket.upperBound === null || taxBracket.upperBound === undefined) {
        return { incomeToAdd: 0, earlyWithdrawal: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
    }


    // Calculate room left in the current bracket
    const roomInBracket = taxBracket.upperBound - curYearFedTaxableIncome;
    if (roomInBracket <= 0) {
        return { incomeToAdd: 0, earlyWithdrawal: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
    }

    // Determine amount to convert: minimum of room in bracket and annual limit
    let amountToConvert = Math.min(roomInBracket, scenario.annualPostTaxContributionLimit);
    if (amountToConvert <= 0) {
        return { incomeToAdd: 0, earlyWithdrawal: 0, dbInvestmentOps: [], dbInvestmentTypeOps: [] };
    }

    let remainingAmountToConvert = amountToConvert;

    // Iterate through the user's specified Roth strategy order
    for (const sourceInvestmentId of scenario.orderedRothStrategy) {
        if (remainingAmountToConvert <= 0) break;

        // Get the source pre-tax investment object from the map
        const sourceInvestment = allInvestmentsMap.get(sourceInvestmentId.toString());

        // Skip if not found, not pre-tax, or has no value
        if (!sourceInvestment || sourceInvestment.taxStatus !== "PRE_TAX_RETIREMENT" || sourceInvestment.value <= 0) {
            continue;
        }

        // Determine the actual amount to transfer from this source
        const transferAmount = Math.min(sourceInvestment.value, remainingAmountToConvert);
        if (transferAmount <= 0) continue;

        // Find the investment type
        const investmentTypeId = invMap.get(sourceInvestmentId.toString());
        const investmentType = investmentTypeId ? investmentTypesMap.get(investmentTypeId) : null;

        if (!investmentType) {
            console.warn(`Year ${currentYear}: Roth Conversion - Could not find InvestmentType for source investment ${sourceInvestmentId}. Skipping transfer.`);
            continue;
        }

        // --- Modify Source Investment (In Memory) ---
        sourceInvestment.value -= transferAmount;
        sourceInvestment.purchasePrice = Math.max(0, sourceInvestment.purchasePrice * (sourceInvestment.value / (sourceInvestment.value + transferAmount))); // Proportional reduction if needed

        // Add source update operation
        dbInvestmentOps.push({
            updateOne: {
                filter: { _id: sourceInvestment._id },
                update: { $set: { value: sourceInvestment.value , purchasePrice: sourceInvestment.purchasePrice  } }
            }
        });

        // --- Find or Create Destination After-Tax Investment ---
        let destinationInvestment = null;
        // Find existing after-tax investment within the same type
        for (const invId of investmentType.investments) {
            const potentialDest = allInvestmentsMap.get(invId.toString());
            if (potentialDest && potentialDest.taxStatus === "AFTER_TAX_RETIREMENT") {
                destinationInvestment = potentialDest;
                break;
            }
        }

        if (destinationInvestment) {
            // --- Update Existing Destination (In Memory) ---
            destinationInvestment.value += transferAmount;
            // Purchase price for after-tax retirement typically not tracked same way as non-retirement.
            // Original added nothing to purchase price. Maintain that.

            // Add destination update operation
            dbInvestmentOps.push({
                updateOne: {
                    filter: { _id: destinationInvestment._id },
                    update: { $set: { value: destinationInvestment.value } }
                }
            });
        } else {
            // --- Create New Destination Investment (Immediate DB Create + In Memory Update) ---
            // Note: Violates "write once" but simplifies flow for creations
            const newInvestmentData = {
                value: transferAmount,
                purchasePrice: 0, // Basis not relevant in same way for Roth
                taxStatus: "AFTER_TAX_RETIREMENT"
            };
            try {
                const createdInvestment = await investmentFactory.create(newInvestmentData);
                // Add to simulation's current state
                allInvestmentsMap.set(createdInvestment._id.toString(), createdInvestment);
                invMap.set(createdInvestment._id.toString(), investmentType._id.toString()); // Update invMap

                // Add new investment's ID to its parent type (in memory)
                investmentType.investments.push(createdInvestment._id);

                // Collect operation to update the InvestmentType document in DB
                dbInvestmentTypeOps.push({
                    updateOne: {
                        filter: { _id: investmentType._id },
                        update: { $set: { investments: investmentType.investments } } // Update with array including new ID
                    }
                });
                // No immediate investment update op needed, as it was just created with the correct value.
                // It will be included in the final bulkWrite if modified further *this year*.
                console.log(`Year ${currentYear}: Created new Roth destination investment ${createdInvestment._id} for type ${investmentType.name}`);

            } catch (error) {
                console.error(`Year ${currentYear}: Failed to create new Roth destination investment for type ${investmentType.name}. Error: ${error}`);
                // Decide how to handle: Revert source investment change? Halt? Log and continue?
                // For now, log and continue without adding the transfer amount to income.
                sourceInvestment.value += transferAmount; // Revert source change
                // Remove source update op? Or modify it back? Removing is cleaner if found.
                const sourceOpIndex = dbInvestmentOps.findIndex(op => op.updateOne.filter._id.toString() === sourceInvestment._id.toString());
                if (sourceOpIndex > -1) dbInvestmentOps.splice(sourceOpIndex, 1);
                continue; // Skip to next source investment
            }
        }

        // Update remaining amount and income generated
        remainingAmountToConvert -= transferAmount;
        incomeFromConversion += transferAmount; // The converted amount is added to taxable income this year

        updateLog(`Year: ${currentYear} - ROTH - Converting $${transferAmount.toFixed(2)} from pre-tax to after-tax within Investment Type ${investmentType.name}.\n`);
        //console.log(`Year: ${currentYear} - ROTH - Converting $${transferAmount.toFixed(2)} from pre-tax to after-tax within Investment Type ${investmentType.name}.\n`)
    } // End loop through strategy

    // Calculate early withdrawal penalty if applicable
    const earlyWithdrawalPenalty = age < 59.5 ? incomeFromConversion : 0; 


    // --- Final Filtering for Overlapping Investment Updates ---
    const finalDbInvestmentOpsMap = new Map();
    dbInvestmentOps.forEach(op => {
        if (op?.updateOne?.filter?._id) {
             finalDbInvestmentOpsMap.set(op.updateOne.filter._id.toString(), op);
        }
    });

    // --- Final Filtering for Overlapping Investment Type Updates ---
     const finalDbInvestmentTypeOpsMap = new Map();
     dbInvestmentTypeOps.forEach(op => {
         if (op?.updateOne?.filter?._id) {
              finalDbInvestmentTypeOpsMap.set(op.updateOne.filter._id.toString(), op);
         }
     });


    return {
        incomeToAdd: incomeFromConversion, // Amount to add to this year's taxable income
        dbInvestmentOps: Array.from(finalDbInvestmentOpsMap.values()),
        dbInvestmentTypeOps: Array.from(finalDbInvestmentTypeOpsMap.values()),
        curYearEarlyWithdrawals: earlyWithdrawalPenalty
    };
}
//Asked Gemini 2.5 Pro to optimize this by removing all db read/writes
export function processInvestmentEvents( // Still async due to potential logging lookups
    scenario,
    currentYear,
    allEventsMap,           
    allInvestmentsMap,      
    cashInvestment,         
    investmentTypesMap,     
) {
    const realYear = new Date().getFullYear();
    const dbUpdateOperations = []; // Array to collect DB update operations

    if (!cashInvestment) {
        console.error("CRITICAL ERROR: processInvestmentEvents received invalid cashInvestment reference!");
        return { dbUpdateOperations: [] };
    }

    
    for (const [eventId, event] of allEventsMap.entries()) {
        if (event.eventType !== "INVEST" ||
            !(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        // --- Use pre-fetched cash object ---
        if (cashInvestment.value <= 0) {
            // console.log(`Year ${currentYear}: Skipping Invest Event ${event.name} - No cash available.`);
            continue;
        }

        let amountToInvest = cashInvestment.value - event.maximumCash;
        if (amountToInvest <= 0) {
            // console.log(`Year ${currentYear}: Skipping Invest Event ${event.name} - Cash (${cashInvestment.value}) does not exceed maximum buffer (${event.maximumCash}).`);
            continue;
        }

        // --- Use pre-fetched allocated investments ---
        const allocatedInvestmentIds = event.allocatedInvestments;
        const allocatedInvestments = allocatedInvestmentIds.map(id => allInvestmentsMap.get(id.toString())).filter(Boolean);
        if (allocatedInvestments.length !== allocatedInvestmentIds.length) {
            console.warn(`Year ${currentYear}: Invest Event ${event.name} references missing investments.`);
            // Consider if processing should stop for this event if investments are missing
        }
        if (allocatedInvestments.length === 0) {
            console.warn(`Year ${currentYear}: Invest Event ${event.name} has amount to invest ($${amountToInvest.toFixed(2)}) but no valid allocated investments found.`);
            continue; // Skip if no valid investments
        }


        // Check if only retirement accounts are targeted
        let foundNonRetirement = allocatedInvestments.some(inv => inv.taxStatus !== "AFTER_TAX_RETIREMENT");

        // --- Limit amountToInvest based on contribution limits if needed ---
        if (!foundNonRetirement) {
            // Only retirement targets, cap by post-tax limit
            amountToInvest = Math.min(amountToInvest, scenario.annualPostTaxContributionLimit);
             if (amountToInvest <= 0) {
                // console.log(`Year ${currentYear}: Skipping Invest Event ${event.name} - Post-tax limit prevents investment.`);
                continue;
             }
        }
        // Ensure amountToInvest does not exceed available cash after check
        amountToInvest = Math.min(amountToInvest, cashInvestment.value);
        if (amountToInvest <= 0) {
            // console.log(`Year ${currentYear}: Skipping Invest Event ${event.name} - No amount left to invest after checks.`);
            continue;
        }

        // --- Update Cash (In Memory + Collect DB Op) ---
        // Store original value in case redistribution fails later and needs revert
        const originalCashValue = cashInvestment.value;
        cashInvestment.value = Math.round((originalCashValue - amountToInvest) * 100) / 100;
        // Defer adding the DB op until the final amountToInvest is certain (after redistribution)

        // --- Determine percentage to invest in each (Original Logic) ---
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            // Assuming percentageAllocations is [[start%, end%], [start%, end%]]
            // We only need the start% for FIXED allocation
            proportions = event.percentageAllocations?.map(p => p[0]) ?? [];
        } else if (event.assetAllocationType === "GLIDE") {
            const ratio = event.duration > 0 ? Math.max(0, Math.min(1, (realYear + currentYear - event.startYear) / event.duration)) : 0; // Clamp ratio 0-1
            proportions = event.percentageAllocations?.map(bounds => bounds[1] * ratio + bounds[0] * (1 - ratio)) ?? [];
        }

        // Validate and normalize proportions as before
        if (proportions.length !== allocatedInvestments.length) {
            console.warn(`Year ${currentYear}: Invest Event ${event.name} proportions/investments mismatch (${proportions.length} vs ${allocatedInvestments.length}). Reverting cash and skipping.`);
            cashInvestment.value = originalCashValue; // Revert cash change
            continue;
        }
        const propSum = proportions.reduce((sum, p) => sum + p, 0);
        if (propSum <= 0 && allocatedInvestments.length > 0) {
            console.warn(`Year ${currentYear}: Proportions sum to zero or less for Invest Event ${event.name}. Reverting cash and skipping.`);
            cashInvestment.value = originalCashValue; // Revert cash
            continue;
        }
        if (Math.abs(propSum - 1.0) > 0.001) { // Normalize if significantly off
            console.warn(`Year ${currentYear}: Normalizing proportions for Invest Event ${event.name}. Original sum: ${propSum}`);
            proportions = proportions.map(p => p / propSum);

        }


        let tentativeInvestmentAmounts = proportions.map(p => p * amountToInvest);

        // --- Check Contribution Limits (Original Logic) ---
        let b = 0; // Sum of amounts for after-tax retirement
        allocatedInvestments.forEach((investment, i) => {
            if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                b += tentativeInvestmentAmounts[i];
            }
        });

        let finalAmountInvested = amountToInvest; // Track final amount after adjustments

        if (b > scenario.annualPostTaxContributionLimit) {
            const original_b = b; // Keep original sum for redistribution calc
            let lbRatio = scenario.annualPostTaxContributionLimit / b;
            let totalNonRetirementProportion = 0;

            allocatedInvestments.forEach((investment, i) => {
                if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                    tentativeInvestmentAmounts[i] *= lbRatio; // Scale down
                } else {
                     totalNonRetirementProportion += proportions[i]; // Sum proportion of non-retirement targets
                }
            });

            let amountToRedistribute = original_b - scenario.annualPostTaxContributionLimit;

            if (totalNonRetirementProportion > 0 && amountToRedistribute > 0) {
                // Redistribute proportionally to non-retirement accounts
                allocatedInvestments.forEach((investment, i) => {
                    if (investment.taxStatus !== "AFTER_TAX_RETIREMENT") {
                        let pro = proportions[i] / totalNonRetirementProportion;
                        tentativeInvestmentAmounts[i] += pro * amountToRedistribute;
                    }
                });
            } else if (amountToRedistribute > 0) {
                // Cannot redistribute, excess amount is not invested
                console.warn(`Year ${currentYear}: Invest Event ${event.name} - Cannot redistribute excess after-tax contribution ($${amountToRedistribute.toFixed(2)}). No non-retirement targets.`);
                // Recalculate the actual total amount invested
                finalAmountInvested = tentativeInvestmentAmounts.reduce((sum, amount) => sum + amount, 0);
                // Adjust cash: add back the uninvested amount
                cashInvestment.value = Math.round((originalCashValue - finalAmountInvested) * 100) / 100;

            }
        }

         // --- Add final Cash Update Operation ---
         // Do this now that the final amount invested (and thus final cash value) is known
         dbUpdateOperations.push({
            updateOne: {
                filter: { _id: cashInvestment._id },
                update: { $set: { value: cashInvestment.value } }
            }
        });


        // --- Update Investments (In Memory + Collect DB Ops) ---
        for (let i = 0; i < allocatedInvestments.length; i++) {
            const investment = allocatedInvestments[i];
            const finalAmount = Math.round(tentativeInvestmentAmounts[i] * 100) / 100;

            if (finalAmount > 0) {
                // Modify in-memory object
                investment.value = Math.round((investment.value + finalAmount) * 100) / 100;
                investment.purchasePrice = Math.round((investment.purchasePrice + finalAmount) * 100) / 100;

                // Add DB operation
                dbUpdateOperations.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: investment.value, purchasePrice: investment.purchasePrice } }
                    }
                });

                // Logging (using maps passed from simulate)
                if (logFile !== null && investmentTypesMap && invMap) {
                    const typeId = invMap.get(investment._id.toString());
                    const investmentType = typeId ? investmentTypesMap.get(typeId) : null;
                    const typeName = investmentType?.name ?? 'Unknown Type';
                    const typeDesc = investmentType?.description ?? '';
                    const eventDetails = `Year: ${currentYear} - INVEST - Investing $${finalAmount.toFixed(2)} in investment type ${typeName}: ${typeDesc} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                    updateLog(eventDetails);
                }
            }
        }
        // Assuming only one INVEST event per year 
        break;
    }

    // --- Final Filtering for Overlapping Updates ---
    // If the same investment (e.g., cash) was touched multiple times, keep only the last update.
    const finalDbOpsMap = new Map();
    dbUpdateOperations.forEach(op => {
        finalDbOpsMap.set(op.updateOne.filter._id.toString(), op);
    });

    return {
        dbUpdateOperations: Array.from(finalDbOpsMap.values())
    };
}
//Asked Gemini 2.5: "I want to update rebalance events in the same way: 
// ...keep the same logic as exists and change the updates/inputs"
export function rebalanceInvestments( // Keep async for potential logging lookups
    // Data passed down from simulate:
    scenario,
    currentYear,
    allEventsMap,           
    allInvestmentsMap,      
    investmentTypesMap,   
) {
    const realYear = new Date().getFullYear();
    const dbUpdateOperations = []; // Collect DB ops generated here
    let totalCapitalGains = 0;
    // Note: totalIncomeGains was declared but unused in original, removed here.

    // Filter for active rebalance events using the passed map
    const activeRebalanceEvents = [];
    for (const [eventId, event] of allEventsMap.entries()) {
        if (event.eventType === "REBALANCE" &&
            event.startYear <= realYear + currentYear &&
            event.startYear + event.duration >= realYear + currentYear) {
            activeRebalanceEvents.push(event);
        }
    }

    for (const event of activeRebalanceEvents) {
        // Get investments involved using the pre-fetched map
        const investmentIds = event.allocatedInvestments;
        const investments = investmentIds.map(id => allInvestmentsMap.get(id.toString())).filter(Boolean);

        if (investments.length !== investmentIds.length) {
            console.warn(`Year ${currentYear}: Rebalance Event ${event.name} references missing investments.`);
        }
         if (investments.length === 0) {
            console.warn(`Year ${currentYear}: Rebalance Event ${event.name} has no valid allocated investments.`);
            continue;
         }

        // Calculate total value from current in-memory state
        let totalValue = 0;
        const actualValues = investments.map(investment => {
            totalValue += investment.value;
            return investment.value;
        });

        if (totalValue <= 0) {
            // console.log(`Year ${currentYear}: Skipping Rebalance Event ${event.name} - total value is zero.`);
            continue;
        }

        // Determine target values (Original Logic)
        let proportions = [];
        // Check if event.percentageAllocations exists and is an array
        if (Array.isArray(event.percentageAllocations)) {
            if (event.assetAllocationType === "FIXED") {
                proportions = event.percentageAllocations.map(p => Array.isArray(p) ? p[0] : p); // Get start%
            } else if (event.assetAllocationType === "GLIDE") {
                const ratio = event.duration > 0 ? Math.max(0, Math.min(1, (realYear + currentYear - event.startYear) / event.duration)) : 0;
                proportions = event.percentageAllocations.map(bounds => Array.isArray(bounds) && bounds.length >= 2 ? (bounds[1] * ratio + bounds[0] * (1 - ratio)) : 0);
            }
        } else {
            console.warn(`Year ${currentYear}: Rebalance Event ${event.name} has invalid 'percentageAllocations'. Skipping.`);
            continue;
        }
        // Validate proportions length
        if (proportions.length !== investments.length) {
            console.warn(`Year ${currentYear}: Rebalance Event ${event.name} proportions/investments length mismatch (${proportions.length} vs ${investments.length}). Skipping.`);
            continue;
        }
        // Validate proportion sum (optional but good practice)
        const propSum = proportions.reduce((sum, p) => sum + p, 0);
        if (Math.abs(propSum - 1.0) > 0.001) {
            console.warn(`Year ${currentYear}: Rebalance Event ${event.name} proportions sum to ${propSum}. Check config. Skipping.`);
            continue; // Skip if proportions don't sum to 1
        }


        const targetValues = proportions.map(p => p * totalValue);

        // --- Sell Phase (Modify In Memory + Collect Ops) ---
        for (let i = 0; i < investments.length; i++) {
            const investment = investments[i]; // Reference to object in allInvestmentsMap
            const targetValue = Math.round(targetValues[i] * 100) / 100;
            const initialActualValue = actualValues[i]; // Use value from start of rebalance step

            if (targetValue < initialActualValue) {
                const sellValue = Math.round((initialActualValue - targetValue) * 100) / 100;
                if (sellValue <= 0) continue;

                let capitalGain = 0;
                if (initialActualValue > 0) { // Avoid division by zero
                    capitalGain = (sellValue / initialActualValue) * (initialActualValue - investment.purchasePrice);
                }

                if (investment.taxStatus === "NON_RETIREMENT") {
                    totalCapitalGains += capitalGain;
                }

                // Modify in-memory object
                investment.value = targetValue;
                // Adjust purchase price proportionally
                investment.purchasePrice = Math.max(0, initialActualValue > 0 ? investment.purchasePrice * (investment.value / initialActualValue) : 0);

                // Add DB operation reflecting the *final* state after this step
                dbUpdateOperations.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: investment.value, purchasePrice: investment.purchasePrice } }
                    }
                });

                // Logging
                if (logFile !== null && investmentTypesMap && invMap) {
                    const typeId = invMap.get(investment._id.toString());
                    const investmentType = typeId ? investmentTypesMap.get(typeId) : null;
                    const typeName = investmentType?.name ?? 'Unknown Type';
                    const typeDesc = investmentType?.description ?? '';
                    updateLog(`Year: ${currentYear} - REBALANCE - Selling $${sellValue.toFixed(2)} from ${typeName}: ${typeDesc} (${investment.taxStatus}) due to ${event.name}.\n`);
                }
            }
        }

        // --- Buy Phase (Modify In Memory + Collect Ops) ---
        for (let i = 0; i < investments.length; i++) {
            const investment = investments[i]; // Reference to object in allInvestmentsMap (possibly updated by sell phase)
            const targetValue = Math.round(targetValues[i] * 100) / 100;
            const currentValue = investment.value; // Current in-memory value

            if (targetValue > currentValue) {
                const buyValue = Math.round((targetValue - currentValue) * 100) / 100;
                if (buyValue <= 0) continue;

                // Modify in-memory object
                investment.value = targetValue;
                investment.purchasePrice = Math.round((investment.purchasePrice + buyValue) * 100) / 100;
                // Add DB operation reflecting the *final* state after this step
                // This operation will overwrite the one from the sell phase if the same investment was sold then bought
                dbUpdateOperations.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: investment.value , purchasePrice: investment.purchasePrice } }
                    }
                });

                // Logging
                if (logFile !== null && investmentTypesMap && invMap) {
                    const typeId = invMap.get(investment._id.toString());
                    const investmentType = typeId ? investmentTypesMap.get(typeId) : null;
                    const typeName = investmentType?.name ?? 'Unknown Type';
                    const typeDesc = investmentType?.description ?? '';
                    updateLog(`Year: ${currentYear} - REBALANCE - Buying $${buyValue.toFixed(2)} for ${typeName}: ${typeDesc} (${investment.taxStatus}) due to ${event.name}.\n`);
                }
            }
        }
    } // End loop over active rebalance events

    // --- Final Filtering for Overlapping Updates ---
    const finalDbOpsMap = new Map();
    dbUpdateOperations.forEach(op => {
        // Ensure op and necessary nested properties exist before accessing
        if (op?.updateOne?.filter?._id) {
            finalDbOpsMap.set(op.updateOne.filter._id.toString(), op);
        }
    });

    return {
        capitalGain: totalCapitalGains,
        dbUpdateOperations: Array.from(finalDbOpsMap.values()) // Return the filtered list of ops
    };
}
