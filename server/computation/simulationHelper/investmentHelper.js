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


export async function shouldPerformRMD(currentYear, birthYear, investments) {
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
export async function processRMDs(rmdTable, currentYear, birthYear, scenario) {
    const realYear = new Date().getFullYear();
    const age = realYear + currentYear - birthYear;

    //Batch fetch investment types and investments
    const investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    const investmentTypeMap = new Map(investmentTypes.map(type => [type._id.toString(), type]));

    const allInvestmentIds = investmentTypes.flatMap(type => type.investments);
    const allInvestments = await investmentFactory.readMany(allInvestmentIds);
    const investmentMap = new Map(allInvestments.map(inv => [inv._id.toString(), inv]));

    let index = rmdTable.ages.indexOf(age);
    if (index === -1) {
        index = rmdTable.ages.length - 1;
    }

    const distributionPeriod = rmdTable.distributionPeriods[index];
    if (!distributionPeriod) return 0;

    // Calculate sum of pretax investment values
    const preTaxInvestments = allInvestments.filter(inv => inv.taxStatus === "PRE_TAX_RETIREMENT");
    const s = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);
    if (s <= 0) return 0;
    const rmd = s / distributionPeriod;

    // Process RMD according to orderedRMDStrategy
    let remainingRMD = rmd;

    for (const investmentId of scenario.orderedRMDStrategy) {
        const investment = investmentId.hasOwnProperty('value') ? investmentId : investmentMap.get(investmentId.toString());
        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const withdrawAmount = Math.min(investment.value, remainingRMD);
        investment.value -= withdrawAmount;
        remainingRMD -= withdrawAmount;
        await investmentFactory.update(investment._id, { value: investment.value });

        // Find investment type of investment
        const investmentTypeId = invMap.get(investment._id.toString());
        const investmentType = investmentTypeMap.get(investmentTypeId);

        if (!investmentType) {
            throw ("In processRMD, investment type is null");
        }

        // Find a NON_RETIREMENT investment (or create one)
        let foundNonRetirement = false;
        for (const invId of investmentType.investments) {
            const inv = investmentMap.get(invId.toString());
            if (inv && inv.taxStatus === "NON_RETIREMENT") {
                await investmentFactory.update(inv._id, { value: inv.value + withdrawAmount, purchasePrice: inv.purchasePrice+ withdrawAmount});
                foundNonRetirement = true;
                break;
            }
        }

        if (!foundNonRetirement) {
            const createdInvestment = await investmentFactory.create({ taxStatus: "NON_RETIREMENT", value: withdrawAmount, purchasePrice: withdrawAmount });
            investmentType.investments.push(createdInvestment._id);
            await investmentTypeFactory.update(investmentType._id, { investments: investmentType.investments });
            invMap.set(createdInvestment._id.toString(), investmentType._id.toString());
        }

        const eventDetails = `Year: ${currentYear} - RMD - Transfering $${Math.ceil(withdrawAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
        if (remainingRMD <= 0) break;
    }

    return rmd;
}
export async function updateInvestments(investmentTypes) {
    let curYearIncome = 0; //Track taxable income for 'non-retirement' investments

    //Batch fetch investments and distributions
    const allInvestmentIds = investmentTypes.flatMap(type => type.investments);
    const allInvestments = await investmentFactory.readMany(allInvestmentIds);
    const investmentMap = new Map(allInvestments.map(inv => [inv._id.toString(), inv]));

    const allDistributionIds = investmentTypes.map(type => type.expectedAnnualIncomeDistribution)
        .concat(investmentTypes.map(type => type.expectedAnnualReturnDistribution));
    const distributions = await distributionFactory.readMany(allDistributionIds);
    const distributionMap = new Map(distributions.map(dist => [dist._id.toString(), dist]));

    const updates = []; //array to hold update operations

    //Iterate through investment types
    for (const type of investmentTypes) {
        const expectedAnnualIncomeDistribution = distributionMap.get(type.expectedAnnualIncomeDistribution.toString());
        const expectedAnnualReturnDistribution = distributionMap.get(type.expectedAnnualReturnDistribution.toString());

        for (const investmentID of type.investments) {
            const investment = investmentMap.get(investmentID.toString());
            if(investment.taxStatus==="CASH")continue;
            if (!investment) {
                console.warn(`Investment with ID ${investmentID} not found!`);
                continue;
            }

            //Calculate generated income
            let generatedIncome = await sample(type.expectedAnnualIncome, expectedAnnualIncomeDistribution);
            if (expectedAnnualIncomeDistribution.distributionType !== "FIXED_AMOUNT" &&
                expectedAnnualIncomeDistribution.distributionType !== "UNIFORM_AMOUNT" &&
                expectedAnnualIncomeDistribution.distributionType !== "NORMAL_AMOUNT") {
                generatedIncome = investment.value * (generatedIncome);
            }

            //Add income to curYearIncome if 'non-retirement' and 'taxable'
            if (investment.taxStatus === "NON_RETIREMENT" && type.taxability) {
                curYearIncome += generatedIncome;
            }

            investment.value += generatedIncome;
            investment.purchasePrice+=generatedIncome;  //reinvest back into investment
            //Calculate value change (growth) based on expected return
            let growth = await sample(type.expectedAnnualReturn, expectedAnnualReturnDistribution);
            if (expectedAnnualReturnDistribution.distributionType !== "FIXED_AMOUNT" &&
                expectedAnnualReturnDistribution.distributionType !== "UNIFORM_AMOUNT" &&
                expectedAnnualReturnDistribution.distributionType !== "NORMAL_AMOUNT") {
                investment.value *= (1 + growth);
            } else {
                investment.value += (growth);
            }

            //Calculate expenses using the average value over the year
            let avgValue = (investment.value + (investment.value / (1 + growth))) / 2;
            let expenses = avgValue * type.expenseRatio;

            //Subtract expenses
            investment.value -= expenses;
            investment.value = Math.max(0, Math.round((investment.value) * 100) / 100);
            //console.log(`New value of investment is ${investment.value}`)
            updates.push({
                updateOne: {
                    filter: { _id: investment._id },
                    update: { $set: { value: investment.value, purchasePrice: investment.purchasePrice } },
                },
            });
        }
    }

    if (updates.length > 0) {
        await mongoose.model('Investment').bulkWrite(updates);
    }

    return curYearIncome;
}
export async function performRothConversion(curYearIncome, curYearSS, federalIncomeTax, currentYear, birthYear, orderedRothStrategy, investmentTypes, annualPostTaxContributionLimit) {

    const age = currentYear - birthYear;
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;

    // Find the user's current tax bracket
    let taxBracket = federalIncomeTax.taxBrackets.find(bracket =>
        curYearFedTaxableIncome >= bracket.lowerBound && curYearFedTaxableIncome <= bracket.upperBound
    );

    if (!taxBracket) return { curYearIncome, curYearEarlyWithdrawals: 0 };

    const u = taxBracket.upperBound;
    let rc = u - curYearFedTaxableIncome;
    if (rc <= 0) return { curYearIncome, curYearEarlyWithdrawals: 0 };

    let remainingRC = Math.min(rc, annualPostTaxContributionLimit);
    // Batch fetch investments and build a map for quick access
    const allInvestmentIds = orderedRothStrategy.map(id => typeof id === 'object' ? id._id : id).filter(id => id !== undefined);
    const investments = await investmentFactory.readMany(allInvestmentIds);
    const investmentMap = new Map(investments.map(inv => [inv._id.toString(), inv]));

    // Batch fetch all investments within investment types involved in the strategy
    const allPotentialAfterTaxInvestmentIds = [];
    for (const type of investmentTypes) {
        allPotentialAfterTaxInvestmentIds.push(...type.investments);
    }
    const allPotentialAfterTaxInvestments = await investmentFactory.readMany(allPotentialAfterTaxInvestmentIds);
    const allPotentialAfterTaxInvestmentsMap = new Map(allPotentialAfterTaxInvestments.map(inv => [inv._id.toString(), inv]));


    const investmentTypeMap = new Map(investmentTypes.map(type => [type._id.toString(), type]));


    const investmentUpdates = [];
    const investmentTypeUpdates = [];
    const newInvestments = [];

    for (const investmentId of orderedRothStrategy) {
        if (remainingRC <= 0) break;

        //Ensure investmentId is consistently the ID
        const investmentIdToUse = typeof investmentId === 'object' ? investmentId._id : investmentId;
        let investment = investmentMap.get(investmentIdToUse.toString());

        if (!investment) {
            // If investment is not found in the map, it might be the object itself
            if (investmentId.hasOwnProperty('value') && investmentId.hasOwnProperty('_id') && investmentId.taxStatus === "PRE_TAX_RETIREMENT") {
                investment = investmentId;
            } else {
                console.warn(`Investment with ID ${investmentIdToUse} not found!`);
                continue;
            }
        }

        if (!investment || investment.taxStatus !== "PRE_TAX_RETIREMENT") continue;

        const investmentType = investmentTypeMap.get(invMap.get(investment._id.toString()));
        if (!investmentType) continue;
        let transferAmount = Math.min(investment.value, remainingRC);
        investment.value -= transferAmount;
        remainingRC -= transferAmount;

        // Find or create an equivalent "AFTER_TAX_RETIREMENT" investment
        let afterTaxInvestment = null;
        for (const invId of investmentType.investments) {
            const inv = allPotentialAfterTaxInvestmentsMap.get(invId.toString());
            if (inv && inv.taxStatus === "AFTER_TAX_RETIREMENT") {
                afterTaxInvestment = inv;
                break;
            }
        }

        if (afterTaxInvestment) {
            afterTaxInvestment.value += transferAmount;
            investmentUpdates.push({
                updateOne: {
                    filter: { _id: afterTaxInvestment._id },
                    update: { $set: { value: afterTaxInvestment.value } }
                }
            });

        } else {
            //Create a new after-tax retirement investment under the same type
            const newInvestment = {
                value: transferAmount,  
                purchasePrice: 0,   //doesn't have a 'purchasePrice' because it isnt relevant
                taxStatus: "AFTER_TAX_RETIREMENT"
            };
            const createdInvestment = await investmentFactory.create(newInvestment);
            newInvestments.push(createdInvestment._id);

            // Add the new investment to the investment type
            investmentType.investments.push(createdInvestment._id);
            investmentTypeUpdates.push({
                updateOne: {
                    filter: { _id: investmentType._id },
                    update: { $set: { investments: investmentType.investments } }
                }
            });

            invMap.set(createdInvestment._id.toString(), investmentType._id.toString());
        }

        //Update the original pre-tax investment
        investmentUpdates.push({
            updateOne: {
                filter: { _id: investment._id },
                update: { $set: { value: investment.value } }
            }
        });

        const eventDetails = `Year: ${currentYear} - ROTH - Transfering $${Math.ceil(transferAmount * 100) / 100} within Investment Type ${investmentType.name}: ${investmentType.description}\n`;
        updateLog(eventDetails);
    }

    if (investmentUpdates.length) {
        await mongoose.model('Investment').bulkWrite(investmentUpdates);
    }
    if (investmentTypeUpdates.length) {
        await mongoose.model('InvestmentType').bulkWrite(investmentTypeUpdates);
    }

    //update current year income
    curYearIncome += rc - remainingRC;

    //update early withdrawals if the user is younger than 59
    let curYearEarlyWithdrawals = age < 59 ? rc - remainingRC : 0;

    return { curYearIncome, curYearEarlyWithdrawals };
}
export async function processInvestmentEventsOld(scenario, currentYear) {
    // Cannot include pre-tax-retirement
    // First, get cashInvestment to determine available amount to invest
    // Get the invest event (should only be 1)
    // Ensure that investing will not lead to a violation of annualPostTaxContributionLimit
    // If so, adjust asset allocation
    // Invest amounts

    const realYear = new Date().getFullYear();

    // Fetch cash investment
    let cashInvestment;
    const investmentTypes = await investmentTypeFactory.readMany(scenario.investmentTypes);
    for (const investmentType of investmentTypes) {
        if (investmentType.name === "Cash") {
            cashInvestment = await investmentFactory.read(investmentType.investments[0]); // Assuming it's the first one
            break;
        }
    }

    if (!cashInvestment) {
        console.error("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processInvestmentEvents()");
        throw ("CRITICAL ERROR: COULD NOT FIND CASH INVESTMENT IN processInvestmentEvents()");
    }
    if (cashInvestment.value <= 0) {
        return;
    }
    // Fetch invest events
    const eventIds = scenario.events;
    const events = await eventFactory.readMany(eventIds);
    const eventsMap = new Map(events.map(event => [event._id.toString(), event]));

    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            console.log(`Event with ID ${eventId} not found!`);
            continue;
        }
        if (event.eventType !== "INVEST") {
            continue;
        }
        
        if (!(event.startYear <= realYear + currentYear && event.duration + event.startYear >= realYear + currentYear)) {
            continue;
        }
        console.log(`Doing invest in year ${currentYear}`);
        let amountToInvest = cashInvestment.value - event.maximumCash;
        if (amountToInvest <= 0) {
            return;
        }

        // Fetch allocated investments
        const allocatedInvestmentIds = event.allocatedInvestments;
        const allocatedInvestments = await investmentFactory.readMany(allocatedInvestmentIds);
        const allocatedInvestmentsMap = new Map(allocatedInvestments.map(inv => [inv._id.toString(), inv]));

        // Check if all investments are limited
        let foundNonRetirement = false;
        for (const allocInv of allocatedInvestments) {
            if (allocInv.taxStatus === "NON_RETIREMENT") {
                foundNonRetirement = true;
                break;
            }
        }

        if (!foundNonRetirement) {
            // Change investment amount to be annualPostTaxContributionLimit
            amountToInvest = Math.min(scenario.annualPostTaxContributionLimit, amountToInvest);
        }
        console.log(amountToInvest)
        await investmentFactory.update(cashInvestment._id, { value: Math.round((cashInvestment.value - amountToInvest) * 100) / 100 });

        // Determine percentage to invest in each:
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            proportions = { ...event.percentageAllocations };
        } else if (event.assetAllocationType === "GLIDE") {
            for (const bounds of event.percentageAllocations) {
                let ratio = ((realYear + currentYear - event.startYear) / (event.duration));
                let proportion = [bounds[1] * ratio + bounds[0] * (1 - ratio)];
                proportions.push(proportion);
            }
        }
        let tentativeInvestmentAmounts = [];
        for (const i in proportions) {
            const p = proportions[i][0];
            tentativeInvestmentAmounts.push(p * amountToInvest);
        }

        // Calculate B = sum of the amounts to buy of investments with tax status = “after-tax retirement”
        let b = 0;
        for (let i = 0; i < allocatedInvestments.length; i++) {
            const investment = allocatedInvestments[i];
            if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                b += tentativeInvestmentAmounts[i];
            }
        }

        if (b > scenario.annualPostTaxContributionLimit) {
            let lbRatio = scenario.annualPostTaxContributionLimit / b;
            // Scale down investments and determine proportion taken up by AFTER_TAX_RETIREMENT accounts
            let totalProportion = 0;
            for (let i = 0; i < allocatedInvestments.length; i++) {
                const investment = allocatedInvestments[i];
                if (investment.taxStatus === "AFTER_TAX_RETIREMENT") {
                    tentativeInvestmentAmounts[i] *= lbRatio;
                    totalProportion += proportions[i][0];
                }
            }
            let amountToRedistribute = b - scenario.annualPostTaxContributionLimit;
            // Redistribute investments in NON_RETIREMENT investments
            if (totalProportion !== 0) {
                for (let i = 0; i < allocatedInvestments.length; i++) {
                    const investment = allocatedInvestments[i];
                    if (investment.taxStatus !== "AFTER_TAX_RETIREMENT") {
                        let pro = proportions[i][0] / (1 - totalProportion);
                        tentativeInvestmentAmounts[i] += pro * amountToRedistribute;
                    }
                }
            }
        }
        
        // Distribute to all investments
        const investmentUpdates = [];
        for (let i = 0; i < allocatedInvestments.length; i++) {
            const investment = allocatedInvestments[i];
            investmentUpdates.push({
                updateOne: {
                    filter: { _id: investment._id },
                    update: { $set: { value: Math.round((investment.value + tentativeInvestmentAmounts[i]) * 100) / 100,
                         purchasePrice : Math.round((investment.purchasePrice + tentativeInvestmentAmounts[i]) * 100) / 100} }
                }
            });

            //get investment type:
            if (logFile !== null) {
                const investmentType = await investmentTypeFactory.read(invMap.get(investment._id.toString()));
                const eventDetails = `Year: ${currentYear} - INVEST - Investing $${Math.ceil(tentativeInvestmentAmounts[i] * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                updateLog(eventDetails);
            }
        }
        if (investmentUpdates.length > 0) {
            await mongoose.model('Investment').bulkWrite(investmentUpdates);
        }
    }
    return;
}
export async function rebalanceInvestmentsOld(scenario, currentYear) {
    // Returns capitalGains created

    const realYear = new Date().getFullYear();
    const events = await eventFactory.readMany(scenario.events);
    const eventsMap = new Map(events.map(event => [event._id.toString(), event]));
    // Fetch rebalance events in this time period:
    const eventIds = scenario.events.filter(eventId => {
        const event = eventsMap.get(eventId.toString());
        return event && event.eventType === "REBALANCE" &&
               event.startYear <= realYear + currentYear &&
               event.startYear + event.duration >= realYear + currentYear;
    });

    let totalCapitalGains = 0;
    let totalIncomeGains = 0;
    for (const eventId of eventIds) {
        const event = eventsMap.get(eventId.toString());
        if (!event) {
            //console.log(`Rebalance event with ID ${eventId} not found!`);
            continue;
        }

        // Fetch all investments involved in this rebalance event
        const investmentIds = event.allocatedInvestments;
        const investments = await investmentFactory.readMany(investmentIds);
        const investmentMap = new Map(investments.map(inv => [inv._id.toString(), inv]));

        // Calculate total value and actual values
        let totalValue = 0;
        const actualValues = investments.map(investment => {
            totalValue += investment.value;
            return investment.value;
        });

        // Determine target values
        let proportions = [];
        if (event.assetAllocationType === "FIXED") {
            proportions = { ...event.percentageAllocations };
        } else if (event.assetAllocationType === "GLIDE") {
            for (const bounds of event.percentageAllocations) {
                let ratio = ((realYear + currentYear - event.startYear) / (event.duration));
                let proportion = bounds[1] * ratio + bounds[0] * (1 - ratio);
                proportions.push(proportion);
            }
        }
        const targetValues = [];
        for (const i in proportions) {
            const p = proportions[i];
            targetValues.push(p * totalValue);
        }
        const investmentUpdates = [];

        // Sell investments
        let amountSold = 0;
        for (let i = 0; i < investments.length; i++) {
            const investment = investmentMap.get(investments[i]._id.toString());
            if (targetValues[i] < actualValues[i]) {
                let sellValue = actualValues[i] - targetValues[i];
                let capitalGain = (sellValue / investment.value)*(investment.value - investment.purchasePrice)
                if(investment.taxStatus==="NON_RETIREMENT"){
                    amountSold += capitalGain;
                }
                investmentUpdates.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: Math.round(targetValues[i] * 100) / 100,
                                    purchasePrice: Math.max(0, investment.purchasePrice-sellValue)} }
                    }
                });

                if (logFile !== null) {
                    const investmentType = await investmentTypeFactory.read(invMap.get(investment._id.toString()));
                    const eventDetails = `Year: ${currentYear} - REBALANCE - Selling $${Math.ceil(sellValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                    updateLog(eventDetails);
                }
            }
        }

        if (investmentUpdates.length > 0) {
            await mongoose.model('Investment').bulkWrite(investmentUpdates);
        }

        investmentUpdates.length = 0; // Clear for buy operations

        // Buy investments
        for (let i = 0; i < investments.length; i++) {
            const investment = investmentMap.get(investments[i]._id.toString());
            if (targetValues[i] > actualValues[i]) {
                investmentUpdates.push({
                    updateOne: {
                        filter: { _id: investment._id },
                        update: { $set: { value: Math.round(targetValues[i] * 100) / 100 } }
                    }
                });
                if (logFile !== null) {
                    const investmentType = await investmentTypeFactory.read(invMap.get(investment._id.toString()));
                    const buyValue = targetValues[i] - actualValues[i];
                    const eventDetails = `Year: ${currentYear} - REBALANCE - Buying $${Math.ceil(buyValue * 100) / 100} in investment type ${investmentType.name}: ${investmentType.description} with tax status ${investment.taxStatus} due to event ${event.name}: ${event.description}.\n`;
                    updateLog(eventDetails);
                }
            }
        }

        if (investmentUpdates.length > 0) {
            await mongoose.model('Investment').bulkWrite(investmentUpdates);
        }

        totalCapitalGains += amountSold;
    }

    return totalCapitalGains;
}
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
export async function rebalanceInvestments( // Keep async for potential logging lookups
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
