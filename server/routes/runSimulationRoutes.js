import mongoose from "mongoose";
import express from 'express';

import { canEdit } from "./helper.js";
import { validateRun } from "../computation/planValidator.js";

import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import SimulationController from "../db/controllers/SimulationController.js";

const router = express.Router();
const userController = new UserController();
const simulationController = new SimulationController();
const scenarioController = new ScenarioController();

router.get("/runSimulation", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    try {
        const user = await userController.readWithScenarios(req.session.user);
        const allScenarios = user.ownerScenarios.concat(user.editorScenarios, user.viewerScenarios);

        const data = {
            previousRun: user.previousSimulation,
            scenarios: allScenarios.map((scenario) => {
                return {
                    id: scenario._id,
                    name: scenario.name,
                }
            }),
        }
        return res.status(200).send(data);
    } catch (error) {
        console.error("Error fetching scenarios:", error);
        return res.status(500).send("Internal Server Error");
    }
});

router.post("/runSimulation", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    const userId = req.session.user;
    const scenarioId = req.query.scenarioId;
    const numTimes = req.query.numTimes;
    try {
        if (!await canEdit(userId, scenarioId)) {
            return res.status(403).send("Forbidden");
        }

        const scenario = await scenarioController.read(scenarioId);
        const user = await userController.readWithTaxes(userId);

        // Tax stuff
        const state = scenario.stateOfResidence;
        // TODO: handle state NY, NJ, CT, where the file exist already

        const filingStatus = scenario.filingStatus;
        const username = user.firstName + " " + user.lastName;

        const singleTax = user.userSpecificTaxes.reduce((closest, tax) => {
            if (tax.state === state && tax.filingStatus === "SINGLE") {
                return Math.abs(tax.year - new Date().getFullYear()) < Math.abs(closest.year - new Date().getFullYear()) ? tax : closest;
            }
            return closest;
        }, { year: -Infinity }) || null;

        let taxIdArray = [singleTax ? singleTax._id : null, null];
        if (filingStatus === "MARRIEDJOINT") {
            const marriedTax = user.userSpecificTaxes.reduce((closest, tax) => {
                if (tax.state === state && tax.filingStatus === "MARRIEDJOINT") {
                    return Math.abs(tax.year - new Date().getFullYear()) < Math.abs(closest.year - new Date().getFullYear()) ? tax : closest;
                }
                return closest;
            }, { year: -Infinity }) || null;
            taxIdArray[1] = marriedTax ? marriedTax._id : null;
        }

        console.log("Tax IDs:", taxIdArray);
        console.log("Username:", username);
        console.log("Scenario ID:", scenarioId);
        console.log("Num Times:", numTimes);

        // Running the simulation
        const simulationId = await validateRun(scenarioId, numTimes, taxIdArray, username)

        await simulationController.delete(user.previousSimulation);
        await userController.update(userId, { previousSimulation: simulationId });
        return res.status(200).send(simulationId);
    } catch (error) {
        console.error("Error fetching simulation:", error);
        return res.status(500).send("Internal Server Error");
    }
});

export default router;