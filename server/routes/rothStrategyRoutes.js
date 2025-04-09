import mongoose from "mongoose";
import express from 'express';

import { canEdit, distributionToString, taxStatusToFrontend } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";

const router = express.Router();
const scenarioController = new ScenarioController();

router.get("/roth-strategy/:scenarioId", async (req, res) => {
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
        const rothStrategy = scenario.orderedRothStrategy;

        const allInvestments = scenario.investmentTypes.flatMap(type => {
            return type.investments.map(investment => {
                return {
                    id: investment._id,
                    type: type.name,
                    value: investment.value,
                    expectedAnnualReturnDistribution: type.expectedAnnualReturnDistribution,
                    taxStatus: investment.taxStatus,
                    taxability: type.taxability,
                };
            });
        }).filter(investment => {
            return investment.taxStatus === "PRE_TAX_RETIREMENT";
        }).reduce((acc, investment) => {
            acc[investment.id] = {
                type: investment.type,
                value: investment.value,
                expectedAnnualReturnDistribution: distributionToString(investment.expectedAnnualReturnDistribution),
                taxStatus: taxStatusToFrontend(investment.taxStatus),
                taxability: investment.taxability,
            };
            return acc;
        }, {});

        const rothStrategyData = rothStrategy.map(investmentId => {
            return {
                id: investmentId,
                ...allInvestments[investmentId],
            }
        });

        const data = {
            startYearRothOptimizer: scenario.startYearRothOptimizer,
            endYearRothOptimizer: scenario.endYearRothOptimizer,
            rothStrategy: rothStrategyData,
            userBirthYear: scenario.userBirthYear,
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error in roth strategy route:", error);
        return res.status(500).send("Error retrieving roth strategy.");
    }
});

router.post("/roth-strategy/:scenarioId", async (req, res) => {
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
        const { startYearRothOptimizer, endYearRothOptimizer } = req.body.limits;
        if (!startYearRothOptimizer || !endYearRothOptimizer) {
            scenario.startYearRothOptimizer = undefined;
            scenario.endYearRothOptimizer = undefined;
        } else {
            scenario.startYearRothOptimizer = startYearRothOptimizer;
            scenario.endYearRothOptimizer = endYearRothOptimizer;
        }

        const requestRothStrategy = req.body.updatedStrategy;
        const rothStrategy = requestRothStrategy.map((investment) => {
            return new mongoose.Types.ObjectId(`${investment.id}`);
        });

        scenario.orderedRothStrategy = rothStrategy;
        await scenario.save();

        return res.status(200).send("Roth strategy updated successfully.");
    } catch (error) {
        console.error("Error in roth strategy route:", error);
        return res.status(500).send("Error updating roth strategy.");
    }
});

export default router;