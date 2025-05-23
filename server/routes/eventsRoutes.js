import express from "express";
import { canEdit, distributionToBackend, distributionToFrontend, taxStatusToBackend, taxStatusToFrontend, allocateMethodToFrontend, allocateMethodToBackend } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import EventController from "../db/controllers/EventController.js";
import DistributionController from "../db/controllers/DistributionController.js";

const router = express.Router();
const scenarioController = new ScenarioController();
const eventController = new EventController();
const distributionController = new DistributionController();

const eventToBackend = async (body) => {
    const { eventType, name, description, durationTypeDistribution, startYearTypeDistribution, ...data } = body;

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
            return null;
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
                return null;
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
                taxStatus: taxStatusToBackend(data.taxStatus),
            }
            break;
        default:
            return null;
    }
    return resultEvent;
}

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

router.get("/event/:scenarioId/:eventId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const eventId = req.params.eventId;
        const event = await eventController.readWithPopulate(eventId);

        event.durationTypeDistribution = distributionToFrontend(event.durationTypeDistribution);

        const data = {
            eventType: event.eventType.toLowerCase(),
            name: event.name,
            description: event.description,
            durationTypeDistribution: event.durationTypeDistribution,
        }

        if (event.startYearTypeDistribution) {
            data.startYearTypeDistribution = distributionToFrontend(event.startYearTypeDistribution);
        } else if (event.startsWith) {
            data.startYearTypeDistribution = {
                type: "eventStart",
                event: event.startsWith
            }
        } else if (event.startsAfter) {
            data.startYearTypeDistribution = {
                type: "eventEnd",
                event: event.startsAfter
            }
        }

        if (event.percentageAllocations) {
            event.percentageAllocations = event.percentageAllocations.map(allocation => {
                return allocation.map(percentage => {
                    return percentage * 100;
                });
            });
        }

        switch (event.eventType) {
            case "INCOME":
                data.initialValue = event.amount;
                data.isAdjustInflation = event.isinflationAdjusted;
                data.percentageIncrease = event.userContributions * 100;
                data.isSocialSecurity = event.isSocialSecurity;
                data.expectedAnnualChangeDistribution = distributionToFrontend(event.expectedAnnualChangeDistribution);
                break;
            case "EXPENSE":
                data.initialValue = event.amount;
                data.isAdjustInflation = event.isinflationAdjusted;
                data.percentageIncrease = event.userContributions * 100;
                data.isDiscretionary = event.isDiscretionary;
                data.expectedAnnualChangeDistribution = distributionToFrontend(event.expectedAnnualChangeDistribution);
                break;
            case "INVEST":
                data.allocationMethod = allocateMethodToFrontend(event.assetAllocationType);
                data.allocatedInvestments = event.allocatedInvestments
                data.maximumCash = event.maximumCash;
                data.investmentRows = event.percentageAllocations.map((allocation, index) => {
                    if (event.assetAllocationType === "GLIDE") {
                        return {
                            investment: event.allocatedInvestments[index],
                            initialPercentage: allocation[0],
                            finalPercentage: allocation[1],
                        }
                    } else {
                        return {
                            investment: event.allocatedInvestments[index],
                            percentage: allocation[0],
                        }
                    }
                });
                break;
            case "REBALANCE":
                data.allocationMethod = allocateMethodToFrontend(event.assetAllocationType);
                data.investmentRows = event.percentageAllocations.map((allocation, index) => {
                    if (event.assetAllocationType === "GLIDE") {
                        return {
                            investment: event.allocatedInvestments[index],
                            initialPercentage: allocation[0],
                            finalPercentage: allocation[1],
                        }
                    } else {
                        return {
                            investment: event.allocatedInvestments[index],
                            percentage: allocation[0],
                        }
                    }
                });
                data.taxStatus = taxStatusToFrontend(event.taxStatus);
                break;
            default:
                // Should not happen
                return res.status(400).send("Unhandled event type");
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
        const eventType = req.body.eventType;
        const name = req.body.name;

        const scenario = await scenarioController.readWithPopulate(id);
        for (let event of scenario.events) {
            if (event.name === name) {
                return res.status(409).send("Event name already exists.");
            }
        }

        const resultEvent = await eventToBackend(req.body);
        if (!resultEvent) {
            return res.status(400).send("Error creating event.");
        }
        // Creating the event
        const event = await eventController.create(eventType, resultEvent);

        // Adding the event to the scenario
        await scenarioController.update(id, {
            $push: { events: event._id }
        });

        if (event.eventType === "EXPENSE" && event.isDiscretionary) {
            await scenarioController.update(id, {
                $push: { orderedSpendingStrategy: event._id }
            });
        }

        return res.status(200).send("Event created.");
    } catch (error) {
        console.error("Error in events route:", error);
        return res.status(500).send("Error creating events.");
    }
});

router.put("/event/:scenarioId/:eventId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const eventId = req.params.eventId;
        const name = req.body.name;
        const eventType = req.body.eventType;

        const oldEvent = await eventController.readWithPopulate(eventId);
        if (oldEvent.name !== name) {
            const scenario = await scenarioController.readWithPopulate(id);
            for (let event of scenario.events) {
                if (event.name === name) {
                    return res.status(409).send("Event name already exists.");
                }
            }
        }

        const resultEvent = await eventToBackend(req.body);
        if (!resultEvent) {
            return res.status(400).send("Error creating event.");
        }

        const scenario = await scenarioController.readWithPopulate(id);
        // Creating the updated event
        const event = await eventController.create(eventType, resultEvent);

        scenario.events.forEach(async (otherEvent) => {
            if (otherEvent.startsWith && otherEvent.startsWith.toString() === oldEvent._id.toString()) {
                await eventController.update(otherEvent._id, {
                    startsWith: event._id
                });
            }
            if (otherEvent.startsAfter && otherEvent.startsAfter.toString() === oldEvent._id.toString()) {
                await eventController.update(otherEvent._id, {
                    startsAfter: event._id
                });
            }
        });

        // Updating the event in the scenario
        let index = scenario.events.findIndex(event => event._id.toString() === eventId);
        scenario.events[index] = event._id;
        await scenarioController.update(id, {
            events: scenario.events
        });

        index = scenario.orderedSpendingStrategy.length;
        if (oldEvent.eventType === "EXPENSE" && oldEvent.isDiscretionary) {
            index = scenario.orderedSpendingStrategy.findIndex(event => event._id.toString() === oldEvent._id.toString());
            scenario.orderedSpendingStrategy.splice(index, 1);
        }

        if (event.eventType === "EXPENSE" && event.isDiscretionary) {
            scenario.orderedSpendingStrategy.splice(index, 0, event._id)
        }

        await scenarioController.update(id, {
            orderedSpendingStrategy: scenario.orderedSpendingStrategy
        });

        // deleting the old event
        await eventController.delete(oldEvent._id);
        return res.status(200).send("Event updated.");
    } catch (error) {
        console.error("Error in events route:", error);
        return res.status(500).send("Error updating events.");
    }
});

router.delete("/event/:scenarioId/:eventId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const eventId = req.params.eventId;

        const scenario = await scenarioController.readWithPopulate(id);
        const events = scenario.events;
        const event = await eventController.readWithPopulate(eventId);

        for (let otherEvent of events) {
            if (otherEvent.startsWith && otherEvent.startsWith.toString() === event._id.toString()) {
                return res.status(409).send("Event cannot be deleted because it is used in another event.");
            }
            if (otherEvent.startsAfter && otherEvent.startsAfter.toString() === event._id.toString()) {
                return res.status(409).send("Event cannot be deleted because it is used in another event.");
            }
        }

        if (event.eventType === "EXPENSE" && event.isDiscretionary) {
            await scenarioController.update(id, {
                $pull: { orderedSpendingStrategy: eventId }
            });
        }

        await scenarioController.update(id, {
            $pull: { events: eventId }
        });

        await eventController.delete(eventId);
        return res.status(200).send("Event deleted.");
    } catch (error) {
        console.error("Error in events route:", error);
        return res.status(500).send("Error deleting events.");
    }
});

export default router;