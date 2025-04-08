import express from "express";
import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import { isOwner } from "./helper.js";

const router = express.Router();
const scenarioController = new ScenarioController();

router.get("/sharing/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await isOwner(userId, id)) {
            return res.status(403).send("You do not have permission to access the sharing settings of this scenario.");
        }
        const scenario = await scenarioController.read(id);

        const data = {
            ownerEmail: scenario.ownerEmail,
            editorEmails: scenario.editorEmails,
            viewerEmails: scenario.viewerEmails,
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error in sharing route:", error);
        return res.status(500).send("Error retrieving scenario data.");
    }
});

export default router;