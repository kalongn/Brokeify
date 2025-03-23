import express from 'express';
import passport from 'passport';

import ScenarioController from '../db/controllers/ScenarioController.js';
import UserController from '../db/controllers/UserController.js';
import TaxController from '../db/controllers/TaxController.js';

const router = express.Router();

const scenarioController = new ScenarioController();
const userController = new UserController();


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

            const scenario = await scenarioController.readWithPopulate(id);
            if (!scenario) {
                return res.status(404).send("Scenario not found.");
            }

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

export default router;
