import express from 'express';

import ScenarioController from '../db/controllers/ScenarioController.js';
import { canView } from './helper.js';

const router = express.Router();
const scenarioController = new ScenarioController();


router.get("/scenario/:scenarioId", async (req, res) => {
    if (req.session.user) {
        try {
            const id = req.params.scenarioId;

            if (!await canView(req.session.user, id)) {
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

export default router;