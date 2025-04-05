import express from "express";
import { canEdit, distributionToBackend, distributionToFrontend, taxStatusToBackend, taxStatusToFrontend, allocateMethodToBackend } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import EventController from "../db/controllers/EventController.js";
import DistributionController from "../db/controllers/DistributionController.js";

const router = express.Router();
const scenarioController = new ScenarioController();
const eventController = new EventController();
const distributionController = new DistributionController();

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
        const { distributionType, ...durationData } = distributionToBackend(durationTypeDistribution);
        const requestDurationDistribution = await distributionController.create(distributionType, durationData);

        // start year distribution / event
        const startYearType = startYearTypeDistribution.type;
        let resultEvent = {};
        switch (startYearType) {
            case "fixed":
            case "uniform":
            case "normal":
                const startYearDistribution = distributionToBackend(startYearTypeDistribution);
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
            const { distributionType, ...distributionData } = distributionToBackend(data.expectedAnnualChangeDistribution);
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

export default router;