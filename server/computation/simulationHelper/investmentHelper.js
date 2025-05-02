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
            investment.value = Math.round((investment.value) * 100) / 100;
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
export async function processInvestmentEvents(scenario, currentYear) {
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
            amountToInvest = Math.max(scenario.annualPostTaxContributionLimit, amountToInvest);
        }

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
export async function rebalanceInvestments(scenario, currentYear) {
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