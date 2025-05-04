import express from "express";
import crypto from "crypto";
import ScenarioController from "../db/controllers/ScenarioController.js";

const router = express.Router();
const scenarioController = new ScenarioController();

// ChatGPT on how to clean up the object for the hash so it is consistent.

function cleanObject(obj, keysToRemove = ['_id', '__v']) {
    if (Array.isArray(obj)) {
        return obj.map(el => cleanObject(el, keysToRemove));
    } else if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const key of Object.keys(obj)) {
            if (keysToRemove.includes(key)) continue;
            newObj[key] = cleanObject(obj[key], keysToRemove);
        }
        return newObj;
    }
    return obj;
}

function sortObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    } else if (obj && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((sorted, key) => {
        sorted[key] = sortObject(obj[key]);
        return sorted;
      }, {});
    }
    return obj;
  }

router.get("/concurrency/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }

    try {
        const id = req.params.scenarioId;
        const scenario = await scenarioController.readWithPopulate(id);
        const scenarioObject = sortObject(cleanObject(scenario.toObject({depopulate: false})));
        const scenarioJSON = JSON.stringify(scenarioObject);
        const scenarioHash = crypto.createHash('sha256').update(scenarioJSON).digest('hex');

        return res.status(200).send(scenarioHash);
    } catch (error) {
        console.error("Error in concurrency route:", error);
        return res.status(500).send("Error retrieving concurrency data.");
    }
});

export default router;
