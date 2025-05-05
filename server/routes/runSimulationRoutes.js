import express from 'express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

import { canView } from "./helper.js";
import { validateRun } from "../computation/planValidator.js";

import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import TaxController from "../db/controllers/TaxController.js";
import SimulationController from "../db/controllers/SimulationController.js";

const router = express.Router();
const userController = new UserController();
const simulationController = new SimulationController();
const scenarioController = new ScenarioController();
const taxController = new TaxController();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = decodeURIComponent(path.resolve(__dirname, "../yaml_files/state_taxes/"))
const ny_single_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_NY_SINGLE.yaml"), 'utf8'));
const ny_married_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_NY_MARRIEDJOINT.yaml"), 'utf8'));
const nj_single_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_NJ_SINGLE.yaml"), 'utf8'));
const nj_married_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_NJ_MARRIEDJOINT.yaml"), 'utf8'));
const ct_single_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_CT_SINGLE.yaml"), 'utf8'));
const ct_married_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_CT_MARRIEDJOINT.yaml"), 'utf8'));
const wa_single_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_WA_SINGLE.yaml"), 'utf8'));
const wa_married_yaml = yaml.load(fs.readFileSync(path.join(basePath, "state_tax_WA_MARRIEDJOINT.yaml"), 'utf8'));

const yamlToTax = (ymlStr) => {
    const { year, state, filingStatus, rates } = ymlStr;
    const parseBrackets = (brackets) => {
        return brackets.map(({ lowerBound, upperBound, rate }) => ({
            lowerBound: Number(lowerBound),
            upperBound: upperBound === 'Infinity' ? Infinity : Number(upperBound),
            rate: Number(rate)
        }));
    };
    return {
        year: Number(year),
        state: state,
        filingStatus: filingStatus,
        taxBrackets: parseBrackets(rates)
    };
}

router.get("/runSimulation", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    try {
        const user = await userController.readWithScenarios(req.session.user);
        const scenarios = user.ownerScenarios.concat(user.editorScenarios, user.viewerScenarios);
        const readyScenarios = (await Promise.all(scenarios.map((scenario) => {
            return scenarioController.read(scenario._id);
        })))
            .filter((scenario) => scenario.isSimulationReady)
            .map((scenario) => {
                return {
                    id: scenario._id,
                    name: scenario.name + " | created at " + scenario.dateCreated,
                }
            });

        const previousRun = await simulationController.readWithPopulate(user.previousSimulation);
        const extractParamDetails = (eventObject, stepsArray, paramTypeString) => {
            const typeMapping = {
                "START_EVENT": "Start Year",
                "DURATION_EVENT": "Duration",
                "EVENT_AMOUNT": "Initial Amount",
                "INVEST_PERCENTAGE": "First of Two Investments",
                "ROTH_BOOLEAN": "Disable Roth"
            };

            const type = typeMapping[paramTypeString] ?? null;
            let name = null;
            let lower = null;
            let upper = null;
            let step = null;

            if (paramTypeString === "ROTH_BOOLEAN") {
                return { name, type, lower, upper, step };
            }

            name = eventObject?.name ?? null;

            if (Array.isArray(stepsArray) && stepsArray.length > 0) {
                lower = stepsArray[0];
                upper = stepsArray[stepsArray.length - 1];
                if (stepsArray.length > 1) {
                    step = stepsArray[1] - stepsArray[0];
                }
                if (paramTypeString === "INVEST_PERCENTAGE") {
                    const multiplier = 100;
                    if (typeof lower === 'number') lower *= multiplier;
                    if (typeof upper === 'number') upper *= multiplier;
                    if (typeof step === 'number') step *= multiplier;
                }
            }

            return { name, type, lower, upper, step };
        };

        const paramOneDetails = previousRun?.paramOneType
            ? extractParamDetails(previousRun.paramOne, previousRun.paramOneSteps, previousRun.paramOneType)
            : {};

        const paramTwoDetails = previousRun?.paramTwoType
            ? extractParamDetails(previousRun.paramTwo, previousRun.paramTwoSteps, previousRun.paramTwoType)
            : {};

        const data = {
            isRunning: user.isRunningSimulation,
            previousRun: user.previousSimulation || null,
            previousRunScenarioName: previousRun?.scenario?.name || null,
            previousRunSimulationType: previousRun?.simulationType || null,
            previousRunSimulationAmount: previousRun?.results?.length ?? null,
            previousRunParamOne: paramOneDetails.name ?? null,
            previousRunParamOneType: paramOneDetails.type ?? null,
            previousRunParamOneLower: paramOneDetails.lower ?? null,
            previousRunParamOneUpper: paramOneDetails.upper ?? null,
            previousRunParamOneStep: paramOneDetails.step ?? null,
            previousRunParamTwo: paramTwoDetails.name ?? null,
            previousRunParamTwoType: paramTwoDetails.type ?? null,
            previousRunParamTwoLower: paramTwoDetails.lower ?? null,
            previousRunParamTwoUpper: paramTwoDetails.upper ?? null,
            previousRunParamTwoStep: paramTwoDetails.step ?? null,
            scenarios: readyScenarios,
        };
        return res.status(200).send(data);
    } catch (error) {
        console.error("Error fetching scenarios:", error);
        return res.status(500).send("Internal Server Error");
    }
});

router.get("/runSimulation/isRunningSimulation", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    try {
        const user = await userController.read(req.session.user);
        return res.status(200).send(user.isRunningSimulation);
    } catch (error) {
        console.error("Error fetching isRunningSimulation:", error);
        return res.status(500).send("Internal Server Error");
    }
})

router.get("/runSimulation/exploration", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    try {
        const scenario = await scenarioController.readWithPopulate(req.query.scenarioId);

        const isRothEnabled = scenario.startYearRothOptimizer !== undefined;

        const allEventSeries = scenario.events.map((event) => {
            return {
                id: event._id,
                name: event.name,
                // type: event.type,
                // startYear: distributionToString(event.startYearTypeDistribution),
                // duration: distributionToString(event.durationTypeDistribution)
            }
        });

        const allIncomeExpenseEvent = scenario.events
            .filter((event) => event.eventType === "INCOME" || event.eventType === "EXPENSE")
            .map((event) => ({
                id: event._id,
                name: event.name,
                // type: event.type,
                // startYear: distributionToString(event.startYearTypeDistribution),
                // duration: distributionToString(event.durationTypeDistribution),
                // amount: event.amount,
            }));

        const allInvestEvent = scenario.events
            .filter((event) => event.eventType === "INVEST" && event.allocatedInvestments.length == 2)
            .map((event) => ({
                id: event._id,
                name: event.name,
                // type: event.type,
                // startYear: distributionToString(event.startYearTypeDistribution),
                // duration: distributionToString(event.durationTypeDistribution),
                // percentageAllocation: event.allocatedInvestments[0]
            }));

        const data = {
            isRothEnabled: isRothEnabled,
            events: allEventSeries,
            incomeExpenseEvents: allIncomeExpenseEvent,
            investEvents: allInvestEvent,
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error fetching exploration:", error);
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
        if (!await canView(userId, scenarioId)) {
            return res.status(403).send("Forbidden");
        }
        await userController.update(userId, { isRunningSimulation: true });

        const scenario = await scenarioController.read(scenarioId);
        const user = await userController.readWithTaxes(userId);

        // Tax stuff
        const state = scenario.stateOfResidence;
        const username = user.firstName + " " + user.lastName;

        let singleTax = { year: -Infinity };
        let marriedTax = { year: -Infinity };


        let needDeleteSingleTaxAfter = false;
        let needDeleteMarriedTaxAfter = false;
        if (state === "NY") {
            singleTax = await taxController.create("STATE_INCOME", yamlToTax(ny_single_yaml));
            marriedTax = await taxController.create("STATE_INCOME", yamlToTax(ny_married_yaml));
        } else if (state === "NJ") {
            singleTax = await taxController.create("STATE_INCOME", yamlToTax(nj_single_yaml));
            marriedTax = await taxController.create("STATE_INCOME", yamlToTax(nj_married_yaml));
        } else if (state === "CT") {
            singleTax = await taxController.create("STATE_INCOME", yamlToTax(ct_single_yaml));
            marriedTax = await taxController.create("STATE_INCOME", yamlToTax(ct_married_yaml));
        }
        if (state === "NY" || state === "NJ" || state === "CT") {
            needDeleteSingleTaxAfter = true;
            needDeleteMarriedTaxAfter = true;
        }

        singleTax = user.userSpecificTaxes.reduce((closest, tax) => {
            if (tax.state === state && tax.filingStatus === "SINGLE") {
                if (Math.abs(tax.year - new Date().getFullYear()) < Math.abs(closest.year - new Date().getFullYear())) {
                    if (needDeleteSingleTaxAfter) {
                        taxController.delete(singleTax);
                    }
                    needDeleteSingleTaxAfter = false;
                    return tax;
                } else {
                    return closest;
                }
            }
            return closest;
        }, singleTax);

        marriedTax = user.userSpecificTaxes.reduce((closest, tax) => {
            if (tax.state === state && tax.filingStatus === "MARRIEDJOINT") {
                if (Math.abs(tax.year - new Date().getFullYear()) < Math.abs(closest.year - new Date().getFullYear())) {
                    if (needDeleteMarriedTaxAfter) {
                        taxController.delete(marriedTax);
                    }
                    needDeleteMarriedTaxAfter = false;
                    return tax;
                } else {
                    return closest;
                }
            }
            return closest;
        }, marriedTax);

        if (singleTax.year === -Infinity) {
            singleTax = await taxController.create("STATE_INCOME", yamlToTax(wa_single_yaml));
            needDeleteSingleTaxAfter = true;
        }
        if (marriedTax.year === -Infinity) {
            marriedTax = await taxController.create("STATE_INCOME", yamlToTax(wa_married_yaml));
            needDeleteMarriedTaxAfter = true;
        }

        const taxIdArray = [singleTax._id, marriedTax._id];

        // Exploration stuff
        let explorationArray = [];
        if (req.query.exploration) {
            const exploration = req.query.exploration;
            if (exploration.parameter1) {
                let param1 = null;
                switch (exploration.parameter1) {
                    case "START_EVENT":
                        param1 = {
                            type: exploration.parameter1,
                            eventID: exploration.displayedEvents1,
                            lowerBound: Number(exploration.lowerBound1),
                            upperBound: Number(exploration.upperBound1),
                            step: Number(exploration.stepSize1),
                        };
                        break;
                    case "DURATION_EVENT":
                        param1 = {
                            type: exploration.parameter1,
                            eventID: exploration.displayedEvents1,
                            lowerBound: Number(exploration.lowerBound1),
                            upperBound: Number(exploration.upperBound1),
                            step: Number(exploration.stepSize1),
                        };
                        break;
                    case "EVENT_AMOUNT":
                        param1 = {
                            type: exploration.parameter1,
                            eventID: exploration.displayedEvents1,
                            lowerBound: Number(exploration.lowerBound1),
                            upperBound: Number(exploration.upperBound1),
                            step: Number(exploration.stepSize1),
                        };
                        break;
                    case "INVEST_PERCENTAGE":
                        param1 = {
                            type: exploration.parameter1,
                            eventID: exploration.displayedEvents1,
                            lowerBound: Number(exploration.lowerBound1),
                            upperBound: Number(exploration.upperBound1),
                            step: Number(exploration.stepSize1),
                        };
                        break;
                    case "ROTH_BOOLEAN":
                        param1 = {
                            type: exploration.parameter1,
                        };
                        break;
                }
                explorationArray.push(param1);
            }

            if (exploration.parameter2) {
                let param2 = null;
                switch (exploration.parameter2) {
                    case "START_EVENT":
                        param2 = {
                            type: exploration.parameter2,
                            eventID: exploration.displayedEvents2,
                            lowerBound: Number(exploration.lowerBound2),
                            upperBound: Number(exploration.upperBound2),
                            step: Number(exploration.stepSize2),
                        };
                        break;
                    case "DURATION_EVENT":
                        param2 = {
                            type: exploration.parameter2,
                            eventID: exploration.displayedEvents2,
                            lowerBound: Number(exploration.lowerBound2),
                            upperBound: Number(exploration.upperBound2),
                            step: Number(exploration.stepSize2),
                        };
                        break;
                    case "EVENT_AMOUNT":
                        param2 = {
                            type: exploration.parameter2,
                            eventID: exploration.displayedEvents2,
                            lowerBound: Number(exploration.lowerBound2),
                            upperBound: Number(exploration.upperBound2),
                            step: Number(exploration.stepSize2),
                        };
                        break;
                    case "INVEST_PERCENTAGE":
                        param2 = {
                            type: exploration.parameter2,
                            eventID: exploration.displayedEvents2,
                            lowerBound: Number(exploration.lowerBound2),
                            upperBound: Number(exploration.upperBound2),
                            step: Number(exploration.stepSize2),
                        };
                        break;
                    case "ROTH_BOOLEAN":
                        param2 = {
                            type: exploration.parameter2,
                        };
                        break;
                }
                explorationArray.push(param2);
            }
        } else {
            explorationArray = null;
        }

        console.log("Tax IDs:", taxIdArray);
        console.log("Username:", username);
        console.log("Scenario ID:", scenarioId);
        console.log("Num Times:", numTimes);
        console.log("Exploration Array:", explorationArray);

        // Running the simulation
        const simulationId = await validateRun(scenarioId, numTimes, taxIdArray, username, explorationArray);

        if (needDeleteSingleTaxAfter) {
            await taxController.delete(singleTax);
        }
        if (needDeleteMarriedTaxAfter) {
            await taxController.delete(marriedTax);
        }

        await simulationController.delete(user.previousSimulation);
        await userController.update(userId, { previousSimulation: simulationId, isRunningSimulation: false });

        const data = {
            previousRun: simulationId._id,
            previousRunSimulationType: simulationId.simulationType,
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error fetching simulation:", error);
        await userController.update(userId, { isRunningSimulation: false });
        return res.status(500).send("Internal Server Error");
    }
});

export default router;