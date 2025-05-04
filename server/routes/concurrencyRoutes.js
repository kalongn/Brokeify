import express from "express";
import ScenarioController from "../db/controllers/ScenarioController.js";

const router = express.Router();
const scenarioController = new ScenarioController();

router.get("/concurrency/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const id = req.params.scenarioId;
        const scenario = await scenarioController.read(id);
        return res.status(200).send(scenario.lastEdited);
    } catch (error) {
        console.error("Error in concurrency route:", error);
        return res.status(500).send("Error retrieving concurrency status.");
    }
});

export default router;