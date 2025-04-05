import express from "express";
import { canEdit, taxStatusToBackend, taxStatusToFrontend } from "./helper.js";

import ScenarioController from "../db/controllers/ScenarioController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import InvestmentController from "../db/controllers/InvestmentController.js";

const router = express.Router();

const scenarioController = new ScenarioController();
const investmentTypeController = new InvestmentTypeController();
const investmentController = new InvestmentController();

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
                // Modification to pre existing investment
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

export default router;