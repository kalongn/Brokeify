import express from 'express';
import passport from 'passport';
import UserController from '../db/controllers/UserController.js';
import TaxController from '../db/controllers/TaxController.js';

const router = express.Router();

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

router.get("/profile", async (req, res) => {
    if (req.session.user) {
        const userController = new UserController();
        try {
            const user = await userController.read(req.session.user);
            user.googleId = undefined;
            user.refreshToken = undefined;
            user.accessToken = undefined;
            user.permission = undefined;
            user.userSimulations = undefined;
            user.ownerScenarios = undefined;
            user.editorScenarios = undefined;
            user.viewerScenarios = undefined;

            const taxController = new TaxController();
            const updatedTaxes = await Promise.all(user.userSpecificTaxes.map(async (value) => {
                const tax = await taxController.read(value);
                tax.taxBrackets = undefined; // Remove tax brackets for all taxes
                return tax;
            }));

            user.userSpecificTaxes = updatedTaxes;
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
