import express from "express";
import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import { isNotGuest, isOwner } from "./helper.js";

const router = express.Router();
const userController = new UserController();
const scenarioController = new ScenarioController();

router.get("/sharedScenarios", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const user = await userController.readWithScenarios(userId);
        if (user.permission === "GUEST") {
            return res.status(200).send({ isGuest: true });
        }

        const sharedScenarios = [];
        for (let i = 0; i < user.editorScenarios.length; i++) {
            const scenario = user.ownerScenarios[i];
            let investmentsLength = 0;
            for (let type of scenario.investmentTypes) {
                investmentsLength += type.investments.length;
            }
            sharedScenarios.push({
                id: scenario._id,
                name: scenario.name,
                ownerName: scenario.ownerFirstName + " " + scenario.ownerLastName,
                financialGoal: scenario.financialGoal,
                investmentsLength: investmentsLength,
                eventsLength: scenario.events.length,
            });
        }
        for (let i = 0; i < user.viewerScenarios.length; i++) {
            const scenario = user.viewerScenarios[i];
            let investmentsLength = 0;
            for (let type of scenario.investmentTypes) {
                investmentsLength += type.investments.length;
            }

            sharedScenarios.push({
                id: scenario._id,
                name: scenario.name,
                ownerName: scenario.ownerFirstName + " " + scenario.ownerLastName,
                financialGoal: scenario.financialGoal,
                investmentsLength: investmentsLength,
                eventsLength: scenario.events.length,
            });
        }
        return res.status(200).send(sharedScenarios);
    } catch (error) {
        console.error("Error in shared scenarios route:", error);
        return res.status(500).send("Error retrieving shared scenarios.");
    }
});

router.get("/sharing/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await isNotGuest(userId) || !await isOwner(userId, id)) {
            return res.status(403).send("You do not have permission to access the sharing settings of this scenario.");
        }
        const scenario = await scenarioController.read(id);

        const sharedUser = []
        for (let editor of scenario.editorEmails) {
            sharedUser.push({ email: editor, permissions: "Editor" });
        }
        for (let viewer of scenario.viewerEmails) {
            sharedUser.push({ email: viewer, permissions: "Viewer" });
        }

        const data = {
            ownerEmail: scenario.ownerEmail,
            sharedUser: sharedUser,
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error in sharing route:", error);
        return res.status(500).send("Error retrieving scenario data.");
    }
});

router.post("/sharing/:scenarioId/add", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;

        if (!await isOwner(userId, id)) {
            return res.status(403).send("You do not have permission to access the sharing settings of this scenario.");
        }
        const { email, permissions } = req.body;

        const user = await userController.findByEmail(email);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const scenario = await scenarioController.read(id);
        if (permissions === "Editor") {
            scenario.editorEmails.push(user.email);
            await userController.update(user._id, {
                $push: { editorScenarios: id },
            });
        } else if (permissions === "Viewer") {
            scenario.viewerEmails.push(user.email);
            await userController.update(user._id, {
                $push: { viewerScenarios: id },
            });
        } else {
            return res.status(400).send("Invalid permissions.");
        }
        await scenarioController.update(id, {
            editorEmails: scenario.editorEmails,
            viewerEmails: scenario.viewerEmails,
        });

        const data = {
            email: user.email,
            status: "User added successfully.",
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Error in sharing route:", error);
        return res.status(500).send("Error Adding new user to scenario.");
    }
});

router.delete("/sharing/:scenarioId/remove", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;

        if (!await isOwner(userId, id)) {
            return res.status(403).send("You do not have permission to access the sharing settings of this scenario.");
        }
        const { email } = req.body;

        const scenario = await scenarioController.read(id);
        scenario.editorEmails = scenario.editorEmails.filter((editor) => editor !== email);
        scenario.viewerEmails = scenario.viewerEmails.filter((viewer) => viewer !== email);

        const user = await userController.findByEmail(email);
        await userController.update(user._id, {
            $pull: { editorScenarios: id, viewerScenarios: id },
        });

        await scenarioController.update(id, {
            editorEmails: scenario.editorEmails,
            viewerEmails: scenario.viewerEmails,
        });
        return res.status(200).send("User removed successfully.");
    } catch (error) {
        console.error("Error in sharing route:", error);
        return res.status(500).send("Error removing user from scenario.");
    }
});

router.patch("/sharing/:scenarioId/update", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;

        if (!await isOwner(userId, id)) {
            return res.status(403).send("You do not have permission to access the sharing settings of this scenario.");
        }
        const { email, oldPermissions, newPermissions } = req.body;
        const scenario = await scenarioController.read(id);

        const user = await userController.findByEmail(email);

        if (oldPermissions === "Editor" && newPermissions === "Viewer") {
            scenario.editorEmails = scenario.editorEmails.filter((editor) => editor !== email);
            scenario.viewerEmails.push(user.email);
            await userController.update(user._id, {
                $pull: { editorScenarios: id },
                $push: { viewerScenarios: id },
            });
        } else if (oldPermissions === "Viewer" && newPermissions === "Editor") {
            scenario.viewerEmails = scenario.viewerEmails.filter((viewer) => viewer !== email);
            scenario.editorEmails.push(user.email);
            await userController.update(user._id, {
                $pull: { viewerScenarios: id },
                $push: { editorScenarios: id },
            });
        } else {
            return res.status(400).send("Invalid permissions.");
        }
        await scenarioController.update(id, {
            editorEmails: scenario.editorEmails,
            viewerEmails: scenario.viewerEmails,
        });
        return res.status(200).send("User permission updated successfully.");
    } catch (error) {
        console.error("Error in sharing route:", error);
        return res.status(500).send("Error updating user permission.");
    }
});

export default router;