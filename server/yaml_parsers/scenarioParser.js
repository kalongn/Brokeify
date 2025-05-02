//This was initially written using ChatGPT and the prompt:

/*

write a YAML parser that takes in a YAML format such as the following, 
and saves the investments, investmenttypes, events, and ulamately the scenario to mongodb:
{example yaml scenario}

*/
import DistributionController from "../db/controllers/DistributionController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import InvestmentController from "../db/controllers/InvestmentController.js";
import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import UserController from '../db/controllers/UserController.js';

const distributionFactory = new DistributionController();
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();
const userController = new UserController();

async function createDistribution(dist, returnAmtOrPct, idMap) {
    if (dist.type === "startWith" || dist.type === "startAfter") {
        return null;
    }
    if (returnAmtOrPct) {
        dist.type += returnAmtOrPct + "";
    }
    const distributionMap = new Map([
        ["fixed", "FIXED_AMOUNT"],
        ["uniform", "UNIFORM_AMOUNT"],
        ["normal", "NORMAL_PERCENTAGE"],
        ["fixedamount", "FIXED_AMOUNT"],
        ["uniformamount", "UNIFORM_AMOUNT"],
        ["normalamount", "NORMAL_AMOUNT"],
        ["fixedpercent", "FIXED_PERCENTAGE"],
        ["uniformpercent", "UNIFORM_PERCENTAGE"],
        ["normalpercent", "NORMAL_PERCENTAGE"],
    ]);


    dist.type = distributionMap.get(dist.type.toString());
    //console.log(dist);
    let distribution;

    switch (dist.type) {
        case "FIXED_AMOUNT":
        case "FIXED_PERCENTAGE":
            distribution = await distributionFactory.create(dist.type, {
                value: dist.value
            });
            break;
        case "UNIFORM_AMOUNT":
        case "UNIFORM_PERCENTAGE":
            distribution = await distributionFactory.create(dist.type, {
                lowerBound: dist.lower,
                upperBound: dist.upper
            });
            break;
        case "NORMAL_AMOUNT":
        case "NORMAL_PERCENTAGE":
            distribution = await distributionFactory.create(dist.type, {
                mean: dist.mean,
                standardDeviation: dist.stdev
            });
            break;
        default:
            throw new Error("Unhandled distribution type");
    }
    return distribution;
}



async function fillIncomeEvent(eventID, eventData, idMap) {
    const event = await eventFactory.read(eventID);
    const durationDistribution = await createDistribution(eventData.duration, "amount", idMap);
    const description = "";
    const amount = eventData.initialAmount;
    const expectedAnnualChangeDistribution = await createDistribution(eventData.changeDistribution, eventData.changeAmtOrPct, idMap);
    const isinflationAdjusted = eventData.inflationAdjusted === "true" || eventData.inflationAdjusted == true;
    const userContributions = Number(eventData.userFraction);
    const isSocialSecurity = eventData.socialSecurity === "true" || eventData.socialSecurity == true;

    //Two cases:
    //1) Starts independantly of other events
    //2) Starts with/after another event
    if (eventData.start.type === "startWith") {
        //get event ID that it starts with
        const startsWith = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startsWith: startsWith,
            description: description,
            amount: amount,
            expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
            isinflationAdjusted: isinflationAdjusted,
            userContributions: userContributions,
            isSocialSecurity: isSocialSecurity,
        });

        return toReturn;
    }
    else if (eventData.start.type === "startAfter") {
        const startAfter = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startAfter: startAfter,
            description: description,
            amount: amount,
            expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
            isinflationAdjusted: isinflationAdjusted,
            userContributions: userContributions,
            isSocialSecurity: isSocialSecurity,
        });

        return toReturn;
    }
    else { //independant event
        const startYearTypeDistribution = await createDistribution(eventData.start, "amount", idMap);
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startYearTypeDistribution: startYearTypeDistribution,
            description: description,
            amount: amount,
            expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
            isinflationAdjusted: isinflationAdjusted,
            userContributions: userContributions,
            isSocialSecurity: isSocialSecurity,
        });

        return toReturn;
    }

}

async function fillExpenseEvent(eventID, eventData, idMap) {
    const durationDistribution = await createDistribution(eventData.duration, "amount", idMap);
    const description = "";
    const amount = eventData.initialAmount;
    const expectedAnnualChangeDistribution = await createDistribution(eventData.changeDistribution, eventData.changeAmtOrPct, idMap);
    const isinflationAdjusted = eventData.inflationAdjusted === "true" || eventData.inflationAdjusted == true;
    const userContributions = Number(eventData.userFraction);
    const isDiscretionary = eventData.discretionary === "true" || eventData.discretionary == true;
    if (eventData.start.type === "startWith") {
        const startsWith = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startsWith: startsWith,
            description: description,
            amount: amount,
            expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
            isinflationAdjusted: isinflationAdjusted,
            userContributions: userContributions,
            isDiscretionary: isDiscretionary,
        });

        return toReturn;
    }
    else if (eventData.start.type === "startAfter") {
        const startsAfter = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startsAfter: startsAfter,
            description: description,
            amount: amount,
            expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
            isinflationAdjusted: isinflationAdjusted,
            userContributions: userContributions,
            isDiscretionary: isDiscretionary,
        });

        return toReturn;
    }
    else {
        const startYearTypeDistribution = await createDistribution(eventData.start, "amount", idMap);
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startYearTypeDistribution: startYearTypeDistribution,
            description: description,
            amount: amount,
            expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
            isinflationAdjusted: isinflationAdjusted,
            userContributions: userContributions,
            isDiscretionary: isDiscretionary,
        });

        return toReturn;
    }
}


async function fillInvestEvent(eventID, eventData, idMap) {
    const durationDistribution = await createDistribution(eventData.duration, "amount", idMap);
    const description = "";
    const maxCash = Number(eventData.maxCash) || 0;
    const glidePath = eventData.glidePath === "true" || eventData.glidePath == true;


    const percentageAllocations = [];

    if (glidePath) {
        for (const i in eventData.assetAllocation) {
            const toPush = [eventData.assetAllocation[i], eventData.assetAllocation2[i]];
            percentageAllocations.push(toPush);
        }
    }
    else {
        for (const i in eventData.assetAllocation) {
            const toPush = [eventData.assetAllocation[i]];
            percentageAllocations.push(toPush);
        }
    }

    const allocatedInvestments = [];
    for (const i in eventData.assetAllocation) {
        const toPush = idMap.get(i.toString());
        allocatedInvestments.push(toPush);
    }

    if (eventData.start.type === "startWith") {
        const startsWith = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startsWith: startsWith,
            description: description,
            assetAllocationType: glidePath ? "GLIDE" : "FIXED",
            percentageAllocations: percentageAllocations,
            allocatedInvestments: allocatedInvestments,
            maximumCash: maxCash,
        });

        return toReturn;
    } else if (eventData.start.type === "startAfter") {
        const startAfter = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startsAfter: startAfter,
            description: description,
            assetAllocationType: glidePath ? "GLIDE" : "FIXED",
            percentageAllocations: percentageAllocations,
            allocatedInvestments: allocatedInvestments,
            maximumCash: maxCash,
        });

        return toReturn;
    } else {
        const startYearTypeDistribution = await createDistribution(eventData.start, "amount", idMap);
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startYearTypeDistribution: startYearTypeDistribution,
            description: description,
            assetAllocationType: glidePath ? "GLIDE" : "FIXED",
            percentageAllocations: percentageAllocations,
            allocatedInvestments: allocatedInvestments,
            maximumCash: maxCash,
        });

        return toReturn;
    }
}
async function fillRebalanceEvent(eventID, eventData, idMap, taxStatusMap) {
    const durationDistribution = await createDistribution(eventData.duration, "amount", idMap);
    const description = "";
    const glidePath = eventData.glidePath === "true" || eventData.glidePath == true;

    const percentageAllocations = [];
    if (glidePath) {
        for (const i in eventData.assetAllocation) {
            const toPush = [eventData.assetAllocation[i], eventData.assetAllocation2[i]];
            percentageAllocations.push(toPush);
        }
    }
    else {
        for (const i in eventData.assetAllocation) {
            const toPush = [eventData.assetAllocation[i]];
            percentageAllocations.push(toPush);
        }
    }


    const allocatedInvestments = [];
    let taxStatus = ""; // Infer from the first asset allocation and its type, might run into trouble if user modifies the yaml file into invalid state
    for (const i in eventData.assetAllocation) {
        const toPush = idMap.get(i.toString());
        if (taxStatus === "") {
            taxStatus = taxStatusMap.get(i.toString().split(" ").at(-1));
        }
        allocatedInvestments.push(toPush);
    }

    if (eventData.start.type === "startWith") {
        const startsWith = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startsWith: startsWith,
            description: description,
            assetAllocationType: glidePath ? "GLIDE" : "FIXED",
            percentageAllocations: percentageAllocations,
            allocatedInvestments: allocatedInvestments,
            taxStatus: taxStatus,
        });

        return toReturn;
    } else if (eventData.start.type === "startAfter") {
        const startAfter = idMap.get(eventData.start.eventSeries.toString());
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startAfter: startAfter,
            description: description,
            assetAllocationType: glidePath ? "GLIDE" : "FIXED",
            percentageAllocations: percentageAllocations,
            allocatedInvestments: allocatedInvestments,
            taxStatus: taxStatus,
        });

        return toReturn;
    } else {
        const startYearTypeDistribution = await createDistribution(eventData.start, "amount", idMap);
        const toReturn = await eventFactory.update(eventID, {
            durationTypeDistribution: durationDistribution,
            startYearTypeDistribution: startYearTypeDistribution,
            description: description,
            assetAllocationType: glidePath ? "GLIDE" : "FIXED",
            percentageAllocations: percentageAllocations,
            allocatedInvestments: allocatedInvestments,
            taxStatus: taxStatus,
        });

        return toReturn;
    }
}

export async function parseAndSaveYAML(yamlStr, userId) {
    try {
        const data = yamlStr;

        const idMap = new Map();

        const taxStatusMap = new Map([
            ["non-retirement", "NON_RETIREMENT"],
            ["pre-tax", "PRE_TAX_RETIREMENT"],
            ["after-tax", "AFTER_TAX_RETIREMENT"],
            ["cash", "CASH"],
        ]);
        const eventTypeMap = new Map([
            ["income", "INCOME"],
            ["expense", "EXPENSE"],
            ["invest", "INVEST"],
            ["rebalance", "REBALANCE"],
        ]);

        // Save Investment Types
        const investmentTypePromises = await data.investmentTypes.map(async (type) => {
            //create distributions

            const expectedAnnualReturnDistribution = await createDistribution(type.returnDistribution, type.returnAmtOrPct, idMap);
            const expectedAnnualIncomeDistribution = await createDistribution(type.incomeDistribution, type.returnAmtOrPct, idMap);
            //console.log(expectedAnnualReturnDistribution);

            const createdType = await investmentTypeFactory.create({
                name: type.name,
                description: type.description,
                expectedAnnualReturnDistribution: expectedAnnualReturnDistribution._id,
                expenseRatio: type.expenseRatio,
                expectedAnnualIncomeDistribution: expectedAnnualIncomeDistribution._id,
                taxability: type.taxability === "true" || type.taxability == true,
            });

            idMap.set(`${type.name} TYPE`, createdType._id);
        });
        await Promise.all(investmentTypePromises);

        const rothInvestments = [];

        // Save Investments
        for (const i in data.investments) {
            const inv = data.investments[i];
            const taxStatus = taxStatusMap.get(inv.taxStatus.toString());
            const createdInvestment = await investmentFactory.create({
                value: inv.value,
                taxStatus: taxStatus,
            });

            if (taxStatus === "PRE_TAX_RETIREMENT") {
                rothInvestments.push(createdInvestment._id.toString());
            }

            //update investment type:
            const investmentTypeID = idMap.get(`${inv.investmentType} TYPE`);
            const investmentType = await investmentTypeFactory.read(investmentTypeID);

            investmentType.investments.push(createdInvestment._id.toString());

            await investmentTypeFactory.update(investmentTypeID, {
                investments: investmentType.investments
            });


            idMap.set(inv.id, createdInvestment._id);
        };



        //create all events, add to the name -> id map
        for (const i in data.eventSeries) {
            const createdEvent = await eventFactory.create(eventTypeMap.get(data.eventSeries[i].type.toString()), {
                name: data.eventSeries[i].name.toString(),
            });
            idMap.set(data.eventSeries[i].name.toString(), createdEvent._id);

        }


        //fill in the fields for all events

        for (const i in data.eventSeries) {
            const createdEvent = await eventFactory.read(idMap.get(data.eventSeries[i].name.toString()));
            if (createdEvent.eventType === "INCOME") {
                await fillIncomeEvent(createdEvent._id, data.eventSeries[i], idMap);
            }
            else if (createdEvent.eventType === "EXPENSE") {
                await fillExpenseEvent(createdEvent._id, data.eventSeries[i], idMap);
            }
            else if (createdEvent.eventType === "INVEST") {
                await fillInvestEvent(createdEvent._id, data.eventSeries[i], idMap);
            }
            else if (createdEvent.eventType === "REBALANCE") {
                await fillRebalanceEvent(createdEvent._id, data.eventSeries[i], idMap, taxStatusMap);
            }
            else {
                //Error
                throw ("Invalid Event Type");
            }

        }

        const userLifeExpectancyDistribution = await createDistribution(data.lifeExpectancy[0], "amount", idMap);
        let spouseLifeExpectancyDistribution;
        if (data.maritalStatus === 'couple') {
            spouseLifeExpectancyDistribution = await createDistribution(data.lifeExpectancy[1], "amount", idMap);
        }
        const inflationAssumptionDistribution = await createDistribution(data.inflationAssumption, "percent", idMap);

        const user = await userController.read(userId);

        const firstName = user.firstName;
        const lastName = user.lastName;
        const email = user.email;

        // Save Scenario
        const scenario = await scenarioFactory.create({
            name: data.name,
            filingStatus: data.maritalStatus === 'couple' ? 'MARRIEDJOINT' : 'SINGLE',
            userBirthYear: data.birthYears[0],
            spouseBirthYear: data.maritalStatus === 'couple' ? data.birthYears[1] : null,
            userLifeExpectancyDistribution: userLifeExpectancyDistribution,
            spouseLifeExpectancyDistribution: spouseLifeExpectancyDistribution,
            stateOfResidence: data.residenceState,
            investmentTypes: data.investmentTypes.map(type => idMap.get(`${type.name} TYPE`)),
            events: data.eventSeries.map(evt => idMap.get(evt.name)),
            inflationAssumptionDistribution: inflationAssumptionDistribution,
            annualPostTaxContributionLimit: Number(data.afterTaxContributionLimit),
            financialGoal: Number(data.financialGoal),
            orderedSpendingStrategy: data.spendingStrategy.map(evt => idMap.get(evt)),
            orderedExpenseWithdrawalStrategy: data.expenseWithdrawalStrategy.map(inv => idMap.get(inv)),
            orderedRMDStrategy: data.RMDStrategy.map(inv => idMap.get(inv)),
            startYearRothOptimizer: (data.RothConversionOpt === "true" || data.RothConversionOpt === true ? data.RothConversionStart : undefined),
            endYearRothOptimizer: (data.RothConversionOpt === "true" || data.RothConversionOpt === true ? data.RothConversionEnd : undefined),
            orderedRothStrategy: (data.RothConversionOpt === "true" || data.RothConversionOpt === true ? data.RothConversionStrategy.map(inv => idMap.get(inv)) : rothInvestments),
            ownerFirstName: firstName,
            ownerLastName: lastName,
            ownerEmail: email,
            isSimulationReady: true,
        });

        await userController.update(userId, {
            $push: { ownerScenarios: scenario._id }
        });

        return scenario._id;
    } catch (error) {
        throw (error);
    }
}
