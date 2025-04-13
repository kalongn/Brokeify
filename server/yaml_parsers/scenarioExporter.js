//This file is for exporting scenarios as YAML files
import yaml from 'js-yaml';
import DistributionController from "../db/controllers/DistributionController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import InvestmentController from "../db/controllers/InvestmentController.js";
import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";

const distributionFactory = new DistributionController();
const investmentTypeFactory = new InvestmentTypeController();
const investmentFactory = new InvestmentController();
const eventFactory = new EventController();
const scenarioFactory = new ScenarioController();



async function distributionToObject(distributionID) {
    const distributionMap = new Map([
        ["FIXED_AMOUNT", "fixed"],
        ["FIXED_PERCENTAGE", "fixed"],
        ["UNIFORM_AMOUNT", "uniform"],
        ["UNIFORM_PERCENTAGE", "uniform"],
        ["NORMAL_AMOUNT", "normal"],
        ["NORMAL_PERCENTAGE", "normal"],
    ]);
    const distribution = await distributionFactory.read(distributionID);
    const type = distributionMap.get(distribution.distributionType);
    switch (type) {
        case "fixed":
            return { type: "fixed", value: distribution.value };
        case "uniform":
            return { type: "uniform", lower: distribution.lowerBound, upper: distribution.upperBound };
        case "normal":
            return { type: "normal", mean: distribution.mean, stdev: distribution.standardDeviation };

    }
}

/**
name: { type: String, default: "Untitle Scenario" },
filingStatus: { type: String, enum: FILING_STATUS },
userBirthYear: { type: Number },
spouseBirthYear: { type: Number },
userLifeExpectancy: { type: Number },
userLifeExpectancyDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
spouseLifeExpectancy: { type: Number },
spouseLifeExpectancyDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
stateOfResidence: { type: String },
investmentTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentType' }],
events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
inflationAssumption: { type: Number },
inflationAssumptionDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
annualPostTaxContributionLimit: { type: Number },
financialGoal: { type: Number },
orderedSpendingStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
orderedExpenseWithdrawalStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
orderedRMDStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
orderedRothStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
startYearRothOptimizer: { type: Number, default: undefined },
endYearRothOptimizer: { type: Number },
ownerFirstName: { type: String },
ownerLastName: { type: String },
*/

//Creates a .yaml file in destination path
//The file's name is [ownerFirstName]_[ownerLastName]_[name].yaml
export async function exportScenarioAsYAML(scenarioID) {
    try {
        const scenario = await scenarioFactory.read(scenarioID);

        const firstname = scenario.ownerFirstName === undefined ? "GUEST" : scenario.ownerFirstName.replaceAll(" ", "-");
        const lastname = scenario.ownerLastName === undefined ? "GUEST" : scenario.ownerLastName.replaceAll(" ", "-");
        const scenarioName = scenario.name.replaceAll(" ", "-");
        const filename = `${firstname}_${lastname}_${scenarioName}.yaml`;

        const birthYears = [];
        birthYears.push(scenario.userBirthYear);
        if (scenario.filingStatus !== "SINGLE") {
            birthYears.push(scenario.spouseBirthYear);
        }
        const lifeExpectancy = [];
        let toPush = await distributionToObject(scenario.userLifeExpectancyDistribution);
        lifeExpectancy.push(toPush);
        if (scenario.filingStatus !== "SINGLE") {
            toPush = await distributionToObject(scenario.spouseLifeExpectancyDistribution);
            lifeExpectancy.push(toPush);
        }
        const inflationAssumption = await distributionToObject(scenario.inflationAssumptionDistribution);
        const scenarioObject = {
            name: scenario.name,
            maritalStatus: scenario.filingStatus === "SINGLE" ? "individual" : "couple",
            birthYears: birthYears,
            lifeExpectancy: lifeExpectancy,
            inflationAssumption: inflationAssumption,
            afterTaxContributionLimit: scenario.annualPostTaxContributionLimit,
            RothConversionOpt: scenario.startYearRothOptimizer !== undefined,
            RothConversionStart: scenario.startYearRothOptimizer,
            RothConversionEnd: scenario.endYearRothOptimizer,
            financialGoal: scenario.financialGoal,
            residenceState: scenario.stateOfResidence
        };

        let idMap = new Map();
        const amoutPercentMap = new Map([
            ["FIXED_AMOUNT", "amount"],
            ["FIXED_PERCENTAGE", "percent"],
            ["UNIFORM_AMOUNT", "amount"],
            ["UNIFORM_PERCENTAGE", "percent"],
            ["NORMAL_AMOUNT", "amount"],
            ["NORMAL_PERCENTAGE", "percent"]
        ]);
        const taxStatusMap = new Map([
            ["NON_RETIREMENT", "non-retirement"],
            ["PRE_TAX_RETIREMENT", "pre-tax"],
            ["AFTER_TAX_RETIREMENT", "after-tax"],
            ["CASH", "cash"]
        ]);
        const investmentTypesArray = [];
        const investmentArray = [];
        for (const i in scenario.investmentTypes) {

            const investmentType = await investmentTypeFactory.read(scenario.investmentTypes[i].toString());
            idMap.set(investmentType._id.toString(), investmentType.name);

            for (const j in investmentType.investments) {
                const investment = await investmentFactory.read(investmentType.investments[j]);
                idMap.set(investment._id.toString(), `${investmentType.name} ${taxStatusMap.get(investment.taxStatus)}`);
                const investmentId = `${investmentType.name} ${taxStatusMap.get(investment.taxStatus)}`;
                const value = investment.value;
                const taxStatus = taxStatusMap.get(investment.taxStatus);
                const investmentToPush = {
                    investmentType: investmentType.name,
                    value: value,
                    taxStatus: taxStatus,
                    id: investmentId,
                }
                investmentArray.push(investmentToPush);
            }

            const retDist = await distributionFactory.read(investmentType.expectedAnnualReturnDistribution);
            const incomeDist = await distributionFactory.read(investmentType.expectedAnnualIncomeDistribution);
            const returnDistribution = await distributionToObject(investmentType.expectedAnnualReturnDistribution);
            const incomeDistribution = await distributionToObject(investmentType.expectedAnnualIncomeDistribution);
            const typeToPush = {
                name: investmentType.name,
                description: investmentType.description,
                returnAmtOrPct: amoutPercentMap.get(retDist.distributionType),
                returnDistribution: returnDistribution,
                expenseRatio: investmentType.expenseRatio,
                incomeAmtOrPct: amoutPercentMap.get(incomeDist.distributionType),
                incomeDistribution: incomeDistribution,
                taxability: investmentType.taxability
            }
            investmentTypesArray.push(typeToPush)
        }
        scenarioObject.investmentTypes = investmentTypesArray;
        scenarioObject.investments = investmentArray;

        //do events
        const eventsArray = [];
        const eventTypeMap = new Map([
            ["INCOME", "income"],
            ["EXPENSE", "expense"],
            ["INVEST", "invest"],
            ["REBALANCE", "rebalance"],

        ]);
        for (const i in scenario.events) {
            const event = await eventFactory.read(scenario.events[i]);
            let start;
            if (event.startsWith) {
                const reffedEvent = await eventFactory.read(event.startsWith);
                start = { type: "startWith", eventSeries: reffedEvent.name };
            }
            else if (event.startsAfter) {
                const reffedEvent = await eventFactory.read(event.startsAfter);
                start = { type: "startAfter", eventSeries: reffedEvent.name };
            }
            else {
                start = await distributionToObject(event.startYearTypeDistribution);
            }

            const duration = await distributionToObject(event.durationTypeDistribution);
            if (event.eventType == "INCOME") {
                const retDist = await distributionFactory.read(event.expectedAnnualChangeDistribution);
                const returnDistribution = await distributionToObject(event.expectedAnnualChangeDistribution);
                const eToPush = {
                    name: event.name,
                    start: start,
                    duration: duration,
                    type: eventTypeMap.get(event.eventType),
                    initialAmount: event.amount,
                    changeAmtOrPct: amoutPercentMap.get(retDist.distributionType),
                    changeDistribution: returnDistribution,
                    inflationAdjusted: event.isinflationAdjusted,
                    userFraction: event.userContributions,
                    socialSecurity: event.isSocialSecurity
                };
                eventsArray.push(eToPush);
            }
            else if (event.eventType == "EXPENSE") {
                const retDist = await distributionFactory.read(event.expectedAnnualChangeDistribution);
                const returnDistribution = await distributionToObject(event.expectedAnnualChangeDistribution);
                const eToPush = {
                    name: event.name,
                    start: start,
                    duration: duration,
                    type: eventTypeMap.get(event.eventType),
                    initialAmount: event.amount,
                    changeAmtOrPct: amoutPercentMap.get(retDist.distributionType),
                    changeDistribution: returnDistribution,
                    inflationAdjusted: event.isinflationAdjusted,
                    userFraction: event.userContributions,
                    discretionary: event.isDiscretionary
                };
                eventsArray.push(eToPush);
                idMap.set(event._id.toString(), event.name);
            }
            else if (event.eventType == "INVEST") {
                let assetAllocation, assetAllocation2, glidePath;
                if (event.assetAllocationType === "FIXED") {
                    glidePath = false;
                    assetAllocation = [];
                    for (const i in event.allocatedInvestments) {
                        const inv = idMap.get(event.allocatedInvestments[i].toString());
                        assetAllocation.push({ [inv]: event.percentageAllocations[i][0] });
                    }
                }
                else {
                    glidePath = true;
                    assetAllocation = [];
                    assetAllocation2 = [];
                    for (const i in event.allocatedInvestments) {
                        const inv = idMap.get(event.allocatedInvestments[i].toString());
                        assetAllocation.push({ [inv]: event.percentageAllocations[i][0] });
                        assetAllocation2.push({ [inv]: event.percentageAllocations[i][1] });
                    }
                }
                const eToPush = {
                    name: event.name,
                    start: start,
                    duration: duration,
                    type: eventTypeMap.get(event.eventType),
                    assetAllocation: assetAllocation,
                    assetAllocation2: assetAllocation2,
                    glidePath: glidePath,
                    maxCash: event.maximumCash

                };
                eventsArray.push(eToPush);
            }
            else {   //rebalance
                let assetAllocation, assetAllocation2, glidePath;
                if (event.assetAllocationType === "FIXED") {
                    glidePath = false;
                    assetAllocation = [];

                    for (const i in event.allocatedInvestments) {

                        const inv = idMap.get(event.allocatedInvestments[i].toString());
                        assetAllocation.push({ [inv]: event.percentageAllocations[i][0] });
                    }
                }
                else {
                    glidePath = true;
                    assetAllocation = [];
                    assetAllocation2 = [];
                    for (const i in event.allocatedInvestments) {
                        const inv = idMap.get(event.allocatedInvestments[i].toString());
                        assetAllocation.push({ [inv]: event.percentageAllocations[i][0] });
                        assetAllocation2.push({ [inv]: event.percentageAllocations[i][1] });
                    }
                }
                const eToPush = {
                    name: event.name,
                    start: start,
                    duration: duration,
                    type: eventTypeMap.get(event.eventType),
                    assetAllocation: assetAllocation,
                    assetAllocation2: assetAllocation2,
                    glidePath: glidePath,


                };
                eventsArray.push(eToPush);
            }


        }
        scenarioObject.eventSeries = eventsArray;

        const spendingStrategy = [];

        for (const i in scenario.orderedSpendingStrategy) {
            spendingStrategy.push(idMap.get(scenario.orderedSpendingStrategy[i].toString()));
        }
        scenarioObject.spendingStrategy = spendingStrategy;

        const expenseWithdrawalStrategy = [];
        for (const i in scenario.orderedExpenseWithdrawalStrategy) {
            expenseWithdrawalStrategy.push(idMap.get(scenario.orderedExpenseWithdrawalStrategy[i].toString()));
        }
        scenarioObject.expenseWithdrawalStrategy = expenseWithdrawalStrategy;

        const rmdStrategy = [];
        for (const i in scenario.orderedRMDStrategy) {
            rmdStrategy.push(idMap.get(scenario.orderedRMDStrategy[i].toString()));
        }
        scenarioObject.rmdStrategy = rmdStrategy;

        if (scenario.startYearRothOptimizer !== undefined) {
            const rothStrategy = [];
            for (const i in scenario.orderedRothStrategy) {
                rothStrategy.push(idMap.get(scenario.orderedRothStrategy[i].toString()));
            }
            scenarioObject.rothStrategy = rothStrategy;
        }

        const yamlStr = yaml.dump(scenarioObject);
        return { filename, yamlStr };
    }
    catch (error) {
        throw (error);
    }
}