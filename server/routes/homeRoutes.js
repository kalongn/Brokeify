import express from 'express';
import UserController from '../db/controllers/UserController.js';

const router = express.Router();
const userController = new UserController();

router.get("/home", async (req, res) => {
    if (req.session.user) {
        const user = await userController.readWithScenarios(req.session.user);
        const returnList = [];
        for (let i = 0; i < user.ownerScenarios.length; i++) {
            const scenario = user.ownerScenarios[i];

            let investmentsLength = 0;
            for (let type of scenario.investmentTypes) {
                investmentsLength += type.investments.length;
            }

            returnList.push({
                id: scenario._id,
                name: scenario.name,
                filingStatus: scenario.filingStatus,
                financialGoal: scenario.financialGoal,
                investmentsLength: investmentsLength,
                eventsLength: scenario.events.length,
            });
        }
        return res.status(200).send(returnList);
    } else {
        res.status(401).send("Not logged in.");
    }
});

export default router;