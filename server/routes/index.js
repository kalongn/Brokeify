import express from 'express';
import passport from 'passport';

import ScenarioController from '../db/controllers/ScenarioController.js';
import UserController from '../db/controllers/UserController.js';
import TaxController from '../db/controllers/TaxController.js';
import InvestmentTypeController from '../db/controllers/InvestmentTypeController.js';
import InvestmentController from '../db/controllers/InvestmentController.js';
import EventController from '../db/controllers/EventController.js';
import DistributionController from '../db/controllers/DistributionController.js';

import {
    FrontendToDistribution,
    taxStatusToFrontend,
    taxStatusToBackend,
    allocateMethodToFrontend,
    allocateMethodToBackend,
    canEdit,
} from './helper.js';

const router = express.Router();

const scenarioController = new ScenarioController();
const userController = new UserController();
const investmentTypeController = new InvestmentTypeController();
const investmentController = new InvestmentController();
const eventController = new EventController();
const distributionController = new DistributionController();


router.get("/", async (req, res) => {
    console.log(req.session); // can be used to debug session data
    if (req.session.user) {
        return res.status(200).send("Verified, userId: " + req.session.user);
    } else {
        return res.status(204).send();
    }
});

router.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

router.get("/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), (req, res) => {
    // Successful authentication, redirect to the home page.
    req.session.user = req.user;
    res.redirect(`${process.env.CLIENT_URL}/Home`);
});

router.get("/auth/guest", async (req, res) => {
    const user = await userController.create({
        ownerScenarios: [],
        userSpecificTaxes: [],
        userSimulations: [],
    });
    req.session.user = user._id;
    res.redirect(`${process.env.CLIENT_URL}/Home`);
});

router.get("/logout", async (req, res) => {
    const userId = req.session.user;
    req.session.destroy(async (err) => {
        if (err) {
            return res.status(500).send("Could not log out.");
        }
        const user = await userController.read(userId);
        console.log(`User ${userId} logged out.`);
        if (user.permission === "GUEST") {
            await userController.deepDeleteGuest(userId);
        }
        res.redirect(`${process.env.CLIENT_URL}/`);
    });
});

router.get("/home", async (req, res) => {
    if (req.session.user) {
        const user = await userController.readWithScenarios(req.session.user);
        const returnList = [];
        for (let i = 0; i < user.ownerScenarios.length; i++) {
            const scenario = user.ownerScenarios[i];

            let investmentsLength = 0;
            for (let type of scenario.investmentTypes) {
                investmentsLength += type.investments.length;
            }

            returnList.push({
                id: scenario._id,
                name: scenario.name,
                filingStatus: scenario.filingStatus,
                financialGoal: scenario.financialGoal,
                investmentsLength: investmentsLength,
                eventsLength: scenario.events.length,
            });
        }
        return res.status(200).send(returnList);
    } else {
        res.status(401).send("Not logged in.");
    }
});

router.get("/scenario/:scenarioId", async (req, res) => {
    if (req.session.user) {
        try {
            const user = await userController.read(req.session.user);
            const id = req.params.scenarioId;

            const isOwner = user.ownerScenarios.some(scenario => scenario._id.toString() === id) || false;
            const isEditor = user.editorScenarios.some(scenario => scenario._id.toString() === id) || false;
            const isViewer = user.viewerScenarios.some(scenario => scenario._id.toString() === id) || false;

            if (!isOwner && !isEditor && !isViewer) {
                return res.status(403).send("You do not have permission to access this scenario.");
            }

            let scenario = await scenarioController.readWithPopulate(id);
            if (!scenario) {
                return res.status(404).send("Scenario not found.");
            }
            scenario = scenario.toObject();
            return res.status(200).send(scenario);
        } catch (error) {
            console.error("Error in scenario route:", error);
            return res.status(500).send("Error retrieving scenario.");
        }
    } else {
        res.status(401).send("Not logged in.");
    }
});


router.get("/profile", async (req, res) => {
    if (req.session.user) {
        try {
            const user = await userController.readWithTaxes(req.session.user);

            const taxes = user.userSpecificTaxes.map(tax => {
                return {
                    id: tax._id,
                    taxType: tax.taxType,
                    filingStatus: tax.filingStatus,
                    dateCreated: tax.dateCreated,
                    state: tax.state,
                }
            });

            const data = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                picture: user.picture,
                userSpecificTaxes: taxes,
            }

            return res.status(200).send(data);
        } catch (error) {
            console.error("Error in profile route:", error);
            return res.status(500).send("Error retrieving user profile.");
        }
    } else {
        res.status(404).send("Not logged in.");
    }
});


// Scenario Form

// Distribution type map, converting from the database to the frontend and vice versa
const distributionToFrontend = (distribution) => {
    if (!distribution) {
        return null;
    }
    switch (distribution.distributionType) {
        case "FIXED_AMOUNT":
            return { type: "fixed", value: distribution.value };
        case "UNIFORM_AMOUNT":
            return { type: "uniform", lowerBound: distribution.lowerBound, upperBound: distribution.upperBound };
        case "NORMAL_AMOUNT":
            return { type: "normal", mean: distribution.mean, standardDeviation: distribution.standardDeviation };
        case "FIXED_PERCENTAGE":
            return { type: "fixed", value: distribution.value * 100, isPercentage: true };
        case "UNIFORM_PERCENTAGE":
            return { type: "uniform", lowerBound: distribution.lowerBound * 100, upperBound: distribution.upperBound * 100, isPercentage: true };
        case "NORMAL_PERCENTAGE":
            return { type: "normal", mean: distribution.mean * 100, standardDeviation: distribution.standardDeviation * 100, isPercentage: true };
        default:
            return null;
    }
}

// create new default scenario
router.post("/newScenario", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const user = await userController.read(req.session.user);
        const newScenario = await scenarioController.create({
            investmentTypes: [await investmentTypeController.create({
                name: "Cash",
                description: "HERE COMES THE MONEY",
                expectedAnnualReturn: 0,
                expectedAnnualReturnDistribution: await distributionController.create("FIXED_AMOUNT", { value: 0 }),
                exprenseRatio: 0,
                expectedAnnualIncome: 0,
                expectedAnnualIncomeDistribution: await distributionController.create("FIXED_AMOUNT", { values: 0 }),
                taxability: false,
                investments: [await investmentController.create({ value: 0, taxStatus: "CASH" })],
            })],
            ownerFirstName: user.firstName,
            ownerLastName: user.lastName,
        });
        await userController.update(req.session.user, {
            $push: { ownerScenarios: newScenario._id }
        });
        console.log("New scenario created with ID:", newScenario._id);
        return res.status(200).send({ newScenarioId: newScenario._id });
    } catch (error) {
        console.error("Error in scenario form route:", error);
        return res.status(500).send("Error retrieving scenario form data.");
    }
});

// obtain the basic info of the scenario
router.get("/basicInfo/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const scenario = await scenarioController.read(id);
        await scenario.populate("userLifeExpectancyDistribution spouseLifeExpectancyDistribution");

        const respondLifeExpectancy = distributionToFrontend(scenario.userLifeExpectancyDistribution);
        const respondSpouseLifeExpectancy = distributionToFrontend(scenario.spouseLifeExpectancyDistribution);

        const respondObject = {
            name: scenario.name || null,
            financialGoal: scenario.financialGoal || null,
            state: scenario.stateOfResidence || null,
            maritalStatus: scenario.filingStatus || null,
            birthYear: scenario.userBirthYear || null,
            lifeExpectancy: respondLifeExpectancy,
            spouseBirthYear: scenario.spouseBirthYear || null,
            spouseLifeExpectancy: respondSpouseLifeExpectancy
        }

        return res.status(200).send(respondObject);
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error retrieving basic info.");
    }
});

// update the basic info of the scenario, (created if part of the basic info is missing)
router.post("/basicInfo/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }

    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const { name, financialGoal, state, maritalStatus, birthYear, lifeExpectancy, spouseBirthYear, spouseLifeExpectancy } = req.body;
        const currentScenario = await scenarioController.read(id);

        if (!currentScenario) {
            // Should not happen, but just in case
            return res.status(404).send("Scenario not found.");
        }

        const requestLifeExpectancy = FrontendToDistribution(lifeExpectancy);
        const requestSpouseLifeExpectancy = FrontendToDistribution(spouseLifeExpectancy);

        let newUserLifeExpectancy = null;
        if (currentScenario.userLifeExpectancyDistribution) {
            newUserLifeExpectancy = await distributionController.update(currentScenario.userLifeExpectancyDistribution, requestLifeExpectancy);
        } else {
            const { distributionType, ...data } = requestLifeExpectancy;
            newUserLifeExpectancy = await distributionController.create(distributionType, data);
        }

        let spouseLifeExpectancyDistribution = null;
        if (!requestSpouseLifeExpectancy && currentScenario.spouseLifeExpectancyDistribution) {
            await distributionController.delete(currentScenario.spouseLifeExpectancyDistribution);
        } else if (requestSpouseLifeExpectancy) {
            if (!currentScenario.spouseLifeExpectancyDistribution) {
                const { distributionType, ...data } = requestSpouseLifeExpectancy;
                spouseLifeExpectancyDistribution = await distributionController.create(distributionType, data);
            } else {
                spouseLifeExpectancyDistribution = await distributionController.update(currentScenario.spouseLifeExpectancyDistribution, requestSpouseLifeExpectancy);
            }
        }

        await scenarioController.update(id, {
            name: name,
            financialGoal: financialGoal,
            stateOfResidence: state,
            filingStatus: maritalStatus,
            userBirthYear: birthYear,
            userLifeExpectancyDistribution: newUserLifeExpectancy,
            spouseBirthYear: spouseBirthYear === undefined ? null : spouseBirthYear,
            spouseLifeExpectancyDistribution: spouseLifeExpectancyDistribution
        });

        return res.status(200).send("Basic info updated.");
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error updating basic info.");
    }
});

// obtain the investment types of the scenario
router.get("/investmentTypes/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);

        const investmentType = scenario.investmentTypes.map(type => {
            return {
                id: type._id,
                name: type.name,
                taxability: type.taxability,
            }
        });
        return res.status(200).send(investmentType);
    } catch (error) {
        console.error("Error in investment types route:", error);
        return res.status(500).send("Error retrieving investment types.");
    }
});

// create a new investment type for the scenario
router.post("/investmentType/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const { name, description, expectedAnnualReturn, expenseRatio, expectedDividendsInterest, taxability } = req.body;

        const scenario = await scenarioController.readWithPopulate(id);
        const currentInvestmentType = scenario.investmentTypes;
        for (let type of currentInvestmentType) {
            if (type.name === name) {
                return res.status(400).send("Investment type already exists.");
            }
        }

        const requestExpectedAnnualReturn = FrontendToDistribution(expectedAnnualReturn);
        const requestExpectedDividendsInterest = FrontendToDistribution(expectedDividendsInterest);

        const requestExpenseRatio = expenseRatio / 100;

        let { distributionType, ...data } = requestExpectedAnnualReturn;
        const expectedAnnualReturnDistribution = await distributionController.create(distributionType, data);
        ({ distributionType, ...data } = requestExpectedDividendsInterest);
        const expectedAnnualIncomeDistribution = await distributionController.create(distributionType, data);

        const newInvestmentType = await investmentTypeController.create({
            name: name,
            description: description,
            expectedAnnualReturnDistribution: expectedAnnualReturnDistribution,
            expenseRatio: requestExpenseRatio,
            expectedAnnualIncomeDistribution: expectedAnnualIncomeDistribution,
            taxability: taxability === "taxable",
            investments: [],
        });

        await scenarioController.update(id, {
            $push: { investmentTypes: newInvestmentType._id }
        });

        return res.status(200).send("Investment type added.");
    } catch (error) {
        console.error("Error in investment type route:", error);
        return res.status(500).send("Error retrieving investment type.");
    }
});

// obtain all the investments of the scenario
router.get("/investments/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const investments = scenario.investmentTypes.flatMap(type => {
            return type.investments.map(investment => {
                return {
                    id: investment._id,
                    type: type.name,
                    dollarValue: investment.value,
                    taxStatus: taxStatusToFrontend(investment.taxStatus),
                }
            });
        });
        return res.status(200).send(investments);
    } catch (error) {
        console.error("Error in investments route:", error);
        return res.status(500).send("Error retrieving investments.");
    }
});

// update the investments of the scenario
router.post("/investments/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const { investments } = req.body;

        for (let investment of investments) {

            // New Investment Added
            if (investment.id === undefined) {
                const investmentDB = await investmentController.create({
                    value: investment.dollarValue,
                    taxStatus: taxStatusToBackend(investment.taxStatus)
                });

                for (let type of scenario.investmentTypes) {
                    if (type.name === investment.type) {
                        await investmentTypeController.update(type._id, {
                            $push: { investments: investmentDB._id }
                        });
                        break;
                    }
                }
            } else {
                // Modificaiton to pre existing investment

                // Check if the investment type has changed
                let currentInvestmentType = null;
                for (let type of scenario.investmentTypes) {
                    for (let inv of type.investments) {
                        if (inv._id.toString() === investment.id) {
                            currentInvestmentType = type.name;
                            break;
                        }
                    }
                }

                // If the investment type has changed, update the investment type
                // and remove the investment from the old type
                // and add it to the new type
                if (currentInvestmentType !== investment.type) {
                    const currentType = scenario.investmentTypes.find(type => type.name === currentInvestmentType);
                    const newType = scenario.investmentTypes.find(type => type.name === investment.type);
                    await investmentTypeController.update(currentType._id, {
                        $pull: { investments: investment.id }
                    });
                    await investmentTypeController.update(newType._id, {
                        $push: { investments: investment.id }
                    });
                }

                // Update the investment
                await investmentController.update(investment.id, {
                    value: investment.dollarValue,
                    taxStatus: taxStatusToBackend(investment.taxStatus)
                });
            }

        }
        return res.status(200).send("Investments updated.");
    } catch (error) {
        console.error("Error in investments route:", error);
        return res.status(500).send("Error updating investments.");
    }


});

// obtain all the events of the scenario
router.get("/events/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const events = scenario.events.map(event => {
            return {
                id: event._id,
                name: event.name,
                type: event.eventType,
            }
        });
        return res.status(200).send(events);
    } catch (error) {
        console.error("Error in events route:", error);
        return res.status(500).send("Error retrieving events.");
    }
});

// obtain all the relevant detail needed for create an event of the scenario
// aka all invesments and other events
router.get("/event/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const investments = scenario.investmentTypes.flatMap(type => {
            return type.investments.map(investment => {
                return {
                    id: investment._id,
                    label: type.name,
                    taxStatus: taxStatusToFrontend(investment.taxStatus),
                }
            });
        });

        const event = scenario.events.map(event => {
            return {
                id: event._id,
                name: event.name,
            }
        });

        const scenarioData = {
            birthYear: scenario.userBirthYear,
            maritalStatus: scenario.filingStatus,
            lifeExpectancy: distributionToFrontend(scenario.userLifeExpectancyDistribution),
        }

        const data = {
            scenario: scenarioData,
            investments: investments,
            events: event
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error in events route:", error);
        return res.status(500).send("Error retrieving events.");
    }

});

router.post("/event/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const { eventType, name, description, durationTypeDistribution, startYearTypeDistribution, ...data } = req.body;

        // Duration Distribution
        const { distributionType, ...durationData } = FrontendToDistribution(durationTypeDistribution);
        const requestDurationDistribution = await distributionController.create(distributionType, durationData);

        // start year distribution / event
        const startYearType = startYearTypeDistribution.type;
        let resultEvent = {};
        switch (startYearType) {
            case "fixed":
            case "uniform":
            case "normal":
                const startYearDistribution = FrontendToDistribution(startYearTypeDistribution);
                const { distributionType, ...distributionData } = startYearDistribution;
                resultEvent = {
                    startYearTypeDistribution: await distributionController.create(distributionType, distributionData)
                }
                break;
            case "eventStart":
                resultEvent = {
                    startsWith: startYearTypeDistribution.event
                }
                break;
            case "eventEnd":
                resultEvent = {
                    startsAfter: startYearTypeDistribution.event
                }
                break;
            default:
                // Should not happen
                return res.status(400).send("Unhandled event type");
        }

        // Percentage Allocations and Allocated Investments for INVEST / REBALANCE event type
        let percentageAllocations = [];
        let allocatedInvestments = [];
        if (eventType === "REBALANCE" || eventType === "INVEST") {
            allocatedInvestments = data.investmentRows.map(row => {
                return row.investment;
            });

            switch (data.allocationMethod) {
                case "glidePath":
                    percentageAllocations = data.investmentRows.map(row => {
                        return [row.initialPercentage / 100, row.finalPercentage / 100];
                    });
                    break;
                case "fixed":
                    percentageAllocations = data.investmentRows.map(row => {
                        return [row.percentage / 100];
                    });
                    break;
                default:
                    // Should not happen
                    return res.status(400).send("Unhandled allocation method");
            }
        }

        // Expected Annual Change Distribution for INVEST / REBALANCE event type
        let expectedAnnualChangeDistribution = null;
        if (eventType === "INCOME" || eventType === "EXPENSE") {
            const { distributionType, ...distributionData } = FrontendToDistribution(data.expectedAnnualChangeDistribution);
            expectedAnnualChangeDistribution = await distributionController.create(distributionType, distributionData);
        }

        // Creating the data for the event
        switch (eventType) {
            case "INCOME":
                resultEvent = {
                    name: name,
                    description: description,
                    durationTypeDistribution: requestDurationDistribution,
                    ...resultEvent,
                    amount: data.initialValue,
                    expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
                    isinflationAdjusted: data.isAdjustInflation,
                    userContributions: data.percentageIncrease ? data.percentageIncrease / 100 : 1,
                    isSocialSecurity: data.isSocialSecurity,
                }
                break;
            case "EXPENSE":
                resultEvent = {
                    name: name,
                    description: description,
                    durationTypeDistribution: requestDurationDistribution,
                    ...resultEvent,
                    amount: data.initialValue,
                    expectedAnnualChangeDistribution: expectedAnnualChangeDistribution,
                    isinflationAdjusted: data.isAdjustInflation,
                    userContributions: data.percentageIncrease ? data.percentageIncrease / 100 : 1,
                    isDiscretionary: data.isDiscretionary,
                }
                break;
            case "INVEST":
                resultEvent = {
                    name: name,
                    description: description,
                    durationTypeDistribution: requestDurationDistribution,
                    ...resultEvent,
                    assetAllocationType: allocateMethodToBackend(data.allocationMethod),
                    percentageAllocations: percentageAllocations,
                    allocatedInvestments: allocatedInvestments,
                    maximumCash: data.maximumCash,
                }
                break;
            case "REBALANCE":
                resultEvent = {
                    name: name,
                    description: description,
                    durationTypeDistribution: requestDurationDistribution,
                    ...resultEvent,
                    assetAllocationType: allocateMethodToBackend(data.allocationMethod),
                    percentageAllocations: percentageAllocations,
                    allocatedInvestments: allocatedInvestments,
                    maximumCash: data.maximumCash,
                    taxStatus: taxStatusToBackend(data.taxStatus),
                }
                break;
            default:
                return res.status(400).send("Unhandled event type");
        }

        // Creating the event
        const event = await eventController.create(eventType, resultEvent);

        // Adding the event to the scenario
        await scenarioController.update(id, {
            $push: { events: event._id }
        });

        return res.status(200).send("Event created.");
    } catch (error) {
        console.error("Error in events route:", error);
        return res.status(500).send("Error creating events.");
    }
});

router.get("/limits/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const limits = {
            inflationAssumptionDistribution: distributionToFrontend(scenario.inflationAssumptionDistribution),
            annualPostTaxContributionLimit: scenario.annualPostTaxContributionLimit,
        }
        return res.status(200).send(limits);
    } catch (error) {
        console.error("Error in limits route:", error);
        return res.status(500).send("Error retrieving limits.");
    }
});

router.post("/limits/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const { initialLimit, inflationAssumption } = req.body;

        const requestInflationAssumption = FrontendToDistribution(inflationAssumption);

        const currentScenario = await scenarioController.read(id);
        let updatedDistribution = null;
        if (currentScenario.inflationAssumptionDistribution) {
            updatedDistribution = await distributionController.update(currentScenario.inflationAssumptionDistribution, requestInflationAssumption);
        } else {
            const { distributionType, ...data } = requestInflationAssumption;
            updatedDistribution = await distributionController.create(distributionType, data);
        }

        await scenarioController.update(id, {
            annualPostTaxContributionLimit: initialLimit,
            inflationAssumptionDistribution: updatedDistribution
        });

        return res.status(200).send("Limits updated.");
    } catch (error) {
        console.error("Error in limits route:", error);
        return res.status(500).send("Error updating limits.");
    }
});

export default router;
