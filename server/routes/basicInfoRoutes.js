import express from "express";
import { distributionToBackend, distributionToFrontend, canEdit } from "./helper.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import DistributionController from "../db/controllers/DistributionController.js";
import UserController from "../db/controllers/UserController.js";

const router = express.Router();

const scenarioController = new ScenarioController();
const distributionController = new DistributionController();
const userController = new UserController();


router.get("/basicInfo/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!(await canEdit(userId, id))) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const scenario = await scenarioController.read(id);
        await scenario.populate("userLifeExpectancyDistribution spouseLifeExpectancyDistribution");

        const respondLifeExpectancy = distributionToFrontend(scenario.userLifeExpectancyDistribution);
        const respondSpouseLifeExpectancy = distributionToFrontend(scenario.spouseLifeExpectancyDistribution);

        const respondObject = {
            name: scenario.name || null,
            financialGoal: scenario.financialGoal || null,
            state: scenario.stateOfResidence || null,
            maritalStatus: scenario.filingStatus || null,
            birthYear: scenario.userBirthYear || null,
            lifeExpectancy: respondLifeExpectancy,
            spouseBirthYear: scenario.spouseBirthYear || null,
            spouseLifeExpectancy: respondSpouseLifeExpectancy
        }

        return res.status(200).send(respondObject);
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error retrieving basic info.");
    }
});

router.get("/basicInfo/stateTax/:state/:maritalStatus", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const state = req.params.state;
        const maritalStatus = req.params.maritalStatus;
        const user = await userController.readWithTaxes(userId);
        let isValid = false;
        if (maritalStatus === "MARRIEDJOINT") {
            isValid = user.userSpecificTaxes.some(tax => tax.state === state && tax.filingStatus === "MARRIEDJOINT") && user.userSpecificTaxes.some(tax => tax.state === state && tax.filingStatus === "SINGLE");
        } else {
            isValid = user.userSpecificTaxes.some(tax => tax.state === state && tax.filingStatus === maritalStatus);
        }
        console.log(isValid)
        return res.status(200).send(isValid);
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error retrieving state tax info.");
    }
});

// update the basic info of the scenario, (created if part of the basic info is missing)
router.post("/basicInfo/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }

    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const { name, financialGoal, state, maritalStatus, birthYear, lifeExpectancy, spouseBirthYear, spouseLifeExpectancy } = req.body;
        const currentScenario = await scenarioController.read(id);

        if (!currentScenario) {
            // Should not happen, but just in case
            return res.status(404).send("Scenario not found.");
        }

        const requestLifeExpectancy = distributionToBackend(lifeExpectancy);
        const requestSpouseLifeExpectancy = distributionToBackend(spouseLifeExpectancy);

        let newUserLifeExpectancy = null;
        if (currentScenario.userLifeExpectancyDistribution) {
            newUserLifeExpectancy = await distributionController.update(currentScenario.userLifeExpectancyDistribution, requestLifeExpectancy);
        } else {
            const { distributionType, ...data } = requestLifeExpectancy;
            newUserLifeExpectancy = await distributionController.create(distributionType, data);
        }

        let spouseLifeExpectancyDistribution = null;
        if (!requestSpouseLifeExpectancy && currentScenario.spouseLifeExpectancyDistribution) {
            await distributionController.delete(currentScenario.spouseLifeExpectancyDistribution);
        } else if (requestSpouseLifeExpectancy) {
            if (!currentScenario.spouseLifeExpectancyDistribution) {
                const { distributionType, ...data } = requestSpouseLifeExpectancy;
                spouseLifeExpectancyDistribution = await distributionController.create(distributionType, data);
            } else {
                spouseLifeExpectancyDistribution = await distributionController.update(currentScenario.spouseLifeExpectancyDistribution, requestSpouseLifeExpectancy);
            }
        }

        await scenarioController.update(id, {
            name: name,
            financialGoal: financialGoal,
            stateOfResidence: state,
            filingStatus: maritalStatus,
            userBirthYear: birthYear,
            userLifeExpectancyDistribution: newUserLifeExpectancy,
            spouseBirthYear: spouseBirthYear === undefined ? null : spouseBirthYear,
            spouseLifeExpectancyDistribution: spouseLifeExpectancyDistribution,
            isSimulationReady: true
        });

        return res.status(200).send("Basic info updated.");
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error updating basic info.");
    }
});

export default router;