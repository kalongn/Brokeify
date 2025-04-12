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
                    typeName: type.name,
                    typeId: type._id,
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

                await investmentTypeController.update(investment.typeId, {
                    $push: { investments: investmentDB._id }
                });

                await scenarioController.update(id, {
                    $push: { orderedExpenseWithdrawalStrategy: investmentDB._id }
                });

                if (investmentDB.taxStatus === "PRE_TAX_RETIREMENT") {
                    await scenarioController.update(id, {
                        $push: {
                            orderedRMDStrategy: investmentDB._id,
                            orderedRothStrategy: investmentDB._id
                        }
                    });
                }
            } else {
                // Modification to pre existing investment
                // Check if the investment type has changed
                let currentInvestmentTypeId = null;
                for (let type of scenario.investmentTypes) {
                    for (let inv of type.investments) {
                        if (inv._id.toString() === investment.id) {
                            currentInvestmentTypeId = type._id.toString();
                            break;
                        }
                    }
                }

                // If the investment type has changed, update the investment type
                // and remove the investment from the old type
                // and add it to the new type
                if (currentInvestmentTypeId !== investment.typeId) {
                    await investmentTypeController.update(currentInvestmentTypeId, {
                        $pull: { investments: investment.id }
                    });
                    await investmentTypeController.update(investment.typeId, {
                        $push: { investments: investment.id }
                    });
                }

                const investmentDB = await investmentController.read(investment.id);
                const oldTaxStatus = investmentDB.taxStatus;
                const newTaxStatus = taxStatusToBackend(investment.taxStatus);
                if (oldTaxStatus !== newTaxStatus) {
                    if (newTaxStatus === "PRE_TAX_RETIREMENT") {
                        await scenarioController.update(id, {
                            $push: {
                                orderedRMDStrategy: investment.id,
                                orderedRothStrategy: investment.id
                            }
                        });
                    } else if (oldTaxStatus === "PRE_TAX_RETIREMENT") {
                        await scenarioController.update(id, {
                            $pull: {
                                orderedRMDStrategy: investment.id,
                                orderedRothStrategy: investment.id
                            },
                        });
                    }
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

router.delete("/investments/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const { investmentId, typeId } = req.body;
        const deleteInvestment = await investmentController.read(investmentId);

        const scenario = await scenarioController.readWithPopulate(id);
        const events = scenario.events;

        for (let event of events) {
            if (event.eventType === "INVEST" || event.eventType === "REBALANCE") {
                for (let investment of event.allocatedInvestments) {
                    if (investment.toString() === investmentId) {
                        return res.status(409).send("Investment cannot be deleted because it is used in a distribution.");
                    }
                }
            }
        }

        await investmentTypeController.update(typeId, {
            $pull: { investments: investmentId }
        });

        await scenarioController.update(id, {
            $pull: { orderedExpenseWithdrawalStrategy: investmentId }
        });

        if (deleteInvestment.taxStatus === "PRE_TAX_RETIREMENT") {
            await scenarioController.update(id, {
                $pull: {
                    orderedRMDStrategy: investmentId,
                    orderedRothStrategy: investmentId
                }
            });
        }

        await investmentController.delete(investmentId);
        return res.status(200).send("Investment deleted.");
    } catch (error) {
        console.error("Error in investments route:", error);
        return res.status(500).send("Error deleting investments.");
    }
});

export default router;