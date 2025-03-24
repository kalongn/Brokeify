import express from 'express';
import passport from 'passport';

import ScenarioController from '../db/controllers/ScenarioController.js';
import UserController from '../db/controllers/UserController.js';
import TaxController from '../db/controllers/TaxController.js';
import DistributionController from '../db/controllers/DistributionController.js';

const router = express.Router();

const scenarioController = new ScenarioController();
const userController = new UserController();
const distributionController = new DistributionController();


router.get("/", async (req, res) => {
    let state = "Not logged in";
    console.log(req.session); // can be used to debug session data
    if (req.session.user) {
        res.send(req.session.user);
    } else {
        res.send(state);
    }
});

router.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

router.get("/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), (req, res) => {
    // Successful authentication, redirect to the home page.
    req.session.user = req.user;
    res.redirect(`${process.env.CLIENT_URL}/Home`);
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Could not log out.");
        }
        res.redirect(`${process.env.CLIENT_URL}/`);
    });
});

router.get("/home", async (req, res) => {
    if (req.session.user) {
        return res.status(200).send(await userController.readWithScenarios(req.session.user));
    } else {
        res.status(200).send("Guest user");
    }
});

router.get("/scenario/:scenarioId", async (req, res) => {
    if (req.session.user) {
        try {
            const user = await userController.read(req.session.user);
            const id = req.params.scenarioId;

            // console.log(user);
            // console.log("Scenario ID:", id);

            const isOwner = user.ownerScenarios.some(scenario => scenario._id.toString() === id) || false;
            const isEditor = user.editorScenarios.some(scenario => scenario._id.toString() === id) || false;
            const isViewer = user.viewerScenarios.some(scenario => scenario._id.toString() === id) || false;

            if (!isOwner && !isEditor && !isViewer) {
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


router.get("/profile", async (req, res) => {
    if (req.session.user) {
        try {
            const user = await userController.readWithTaxes(req.session.user);
            return res.status(200).send(user);
        } catch (error) {
            console.error("Error in profile route:", error);
            return res.status(500).send("Error retrieving user profile.");
        }
    } else {
        res.status(404).send("Not logged in.");
    }
});


// Scenario Form

const canEdit = async (userId, scenarioId) => {
    const user = await userController.read(userId);
    return user.ownerScenarios.some(scenario => scenario._id.toString() === scenarioId) ||
        user.editorScenarios.some(scenario => scenario._id.toString() === scenarioId);
}

router.post("/newScenario", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const user = await userController.read(req.session.user);
        const newScenario = await scenarioController.create({
            ownerFirstName: user.firstName,
            ownerLastName: user.lastName,
        });
        await userController.update(req.session.user, {
            $push: { ownerScenarios: newScenario._id }
        });
        console.log("New scenario created with ID:", newScenario._id);
        return res.status(200).send({ newScenarioId: newScenario._id });
    } catch (error) {
        console.error("Error in scenario form route:", error);
        return res.status(500).send("Error retrieving scenario form data.");
    }
});

router.get("/basicInfo/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }

    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const scenario = await scenarioController.read(id);
        await scenario.populate("userLifeExpectancyDistribution spouseLifeExpectancyDistribution");
        return res.status(200).send({
            name: scenario.name || null,
            financialGoal: scenario.financialGoal || null,
            state: scenario.stateOfResidence || null,
            maritalStatus: scenario.filingStatus || null,
            birthYear: scenario.userBirthYear || null,
            lifeExpectancy: scenario.userLifeExpectancyDistribution || null,
            spouseBirthYear: scenario.spouseBirthYear || null,
            spouseLifeExpectancy: scenario.spouseLifeExpectancyDistribution || null
        });
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error retrieving basic info.");
    }
});

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
        console.log(lifeExpectancy.type);
        // const lifeExpectanyDistribution = lifeExpectancy.type === ""

        // if (currentScenario.userLifeExpectancyDistribution) {
        //     await distributionController.update(currentScenario.userLifeExpectancyDistribution, {
        //         distributionType: lifeExpectancy.type,

        //     });
        // }

        // const updatedScenario = await scenarioController.update(id, {
        //     name,
        //     financialGoal,
        //     stateOfResidence: state,
        //     filingStatus: maritalStatus,
        //     userBirthYear: birthYear,
        //     userLifeExpectancy: ,
        //     spouseBirthYear,
        //     spouseLifeExpectancy: spouseLifeExpectancy.mean
        // });

        return res.status(200);
    } catch {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error updating basic info.");
    }
});

export default router;
