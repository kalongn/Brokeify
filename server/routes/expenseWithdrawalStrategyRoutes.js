import mongoose from "mongoose";
import express from 'express';

import { canEdit, distributionToString, taxStatusToFrontend } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";

const router = express.Router();
const scenarioController = new ScenarioController();

router.get("/expense-withdrawal-strategy/:scenarioId", async (req, res) => {
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
        const expenseWithdrawalStrategy = scenario.orderedExpenseWithdrawalStrategy;

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
            return investment.type !== "CASH"
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

        const expenseWithdrawalStrategyData = expenseWithdrawalStrategy.map(investmentId => {
            return {
                id: investmentId,
                ...allInvestments[investmentId],
            }
        });

        return res.status(200).send(expenseWithdrawalStrategyData);
    } catch (error) {
        console.error("Error in expense withdrawal strategy route:", error);
        return res.status(500).send("Error retrieving expense withdrawal strategy.");
    }
});


router.post("/expense-withdrawal-strategy/:scenarioId", async (req, res) => {
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
        const requestExpenseWithdrawalStrategy = req.body;

        const expenseWithdrawalStrategy = requestExpenseWithdrawalStrategy.map((expense) => {
            return new mongoose.Types.ObjectId(`${expense.id}`);
        });

        scenario.orderedExpenseWithdrawalStrategy = expenseWithdrawalStrategy;
        await scenario.save();

        return res.status(200).send("Expense withdrawal strategy updated successfully.");
    } catch (error) {
        console.error("Error in expense withdrawal strategy route:", error);
        return res.status(500).send("Error updating expense withdrawal strategy.");
    }
});

export default router;
