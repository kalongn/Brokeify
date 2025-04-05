import express from "express";
import { canEdit, distributionToFrontend, distributionToBackend } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import DistributionController from "../db/controllers/DistributionController.js";

const router = express.Router();
const scenarioController = new ScenarioController();
const distributionController = new DistributionController();


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

        const requestInflationAssumption = distributionToBackend(inflationAssumption);

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