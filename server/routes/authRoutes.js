import express from 'express';
import passport from 'passport';
import UserController from '../db/controllers/UserController.js';

const router = express.Router();
const userController = new UserController();

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

router.get("/auth/guest", async (req, res) => {
    const user = await userController.create({
        ownerScenarios: [],
        userSpecificTaxes: [],
        userSimulations: [],
    });
    req.session.user = user._id;
    res.redirect(`${process.env.CLIENT_URL}/Home`);
});

router.get("/logout", async (req, res) => {
    const userId = req.session.user;
    req.session.destroy(async (err) => {
        if (err) {
            return res.status(500).send("Could not log out.");
        }
        const user = await userController.read(userId);
        console.log(`User ${userId} logged out.`);
        if (user.permission === "GUEST") {
            await userController.deepDeleteGuest(userId);
        }
        res.redirect(`${process.env.CLIENT_URL}/`);
    });
});

export default router;