import mongoose from "mongoose";
import express from 'express';

import { canEdit, distributionToString } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";


const router = express.Router();
const scenarioController = new ScenarioController();

router.get("/spending-strategy/:scenarioId", async (req, res) => {
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
        const spendingStrategy = scenario.orderedSpendingStrategy;

        const spendingStrategyData = await Promise.all(spendingStrategy.map(async eventId => {
            const event = scenario.events.find(event => event._id.toString() === eventId.toString());
            await event.populate("expectedAnnualChangeDistribution");
            return {
                id: event._id,
                name: event.name,
                amount: event.amount,
                expectedAnnualChangeDistribution: distributionToString(event.expectedAnnualChangeDistribution),
                isinflationAdjusted: event.isinflationAdjusted,
            };
        }));
        return res.status(200).send(spendingStrategyData);
    } catch (error) {
        console.error("Error in spending strategy route:", error);
        return res.status(500).send("Error retrieving spending strategy.");
    }
});

router.post("/spending-strategy/:scenarioId", async (req, res) => {
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
        const requestSpendingStrategy = req.body;

        const spendingStrategy = requestSpendingStrategy.map((expense) => {
            return new mongoose.Types.ObjectId(`${expense.id}`);
        });

        scenario.orderedSpendingStrategy = spendingStrategy;
        await scenario.save();

        return res.status(200).send("Spending strategy updated successfully.");
    } catch (error) {
        console.error("Error in spending strategy route:", error);
        return res.status(500).send("Error updating spending strategy.");
    }
});



export default router;