import mongoose from "mongoose";
import express from 'express';

import { canEdit, distributionToFrontend, taxStatusToFrontend } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";

const router = express.Router();
const scenarioController = new ScenarioController();

router.get("/rmd-strategy/:scenarioId", async (req, res) => {
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
        const rmdStrategy = scenario.orderedRMDStrategy;

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
                expectedAnnualReturnDistribution: distributionToFrontend(investment.expectedAnnualReturnDistribution),
                taxStatus: taxStatusToFrontend(investment.taxStatus),
                taxability: investment.taxability,
            };
            return acc;
        }, {});

        const rmdStrategyData = rmdStrategy.map(investmentId => {
            return {
                id: investmentId,
                ...allInvestments[investmentId],
            }
        });

        return res.status(200).send(rmdStrategyData);
    } catch (error) {
        console.error("Error in RMD strategy route:", error);
        return res.status(500).send("Error retrieving RMD strategy.");
    }
});

router.post("/rmd-strategy/:scenarioId", async (req, res) => {
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
        const requestRMDStrategy = req.body;

        const rmdStrategy = requestRMDStrategy.map((investment) => {
            return new mongoose.Types.ObjectId(`${investment.id}`);
        });
        scenario.orderedRMDStrategy = rmdStrategy;
        await scenario.save();
        return res.status(200).send("RMD strategy updated successfully.");
    } catch (error) {
        console.error("Error in expense withdrawal strategy route:", error);
        return res.status(500).send("Error updating expense withdrawal strategy.");
    }
});

export default router;