import express from 'express';

import authRoutes from './authRoutes.js';
import homeRoutes from './homeRoutes.js';
import viewScenarioRoutes from './viewScenarioRoutes.js';
import profileRoutes from './profileRoutes.js';
import createScenarioRoutes from './createScenarioRoutes.js';
import basicInfoRoutes from './basicInfoRoutes.js';
import investmentTypesRoutes from './investmentTypesRoutes.js';
import investmentsRoutes from './investmentsRoutes.js';
import eventsRoutes from './eventsRoutes.js';
import limitsRoutes from './limitsRoutes.js';
import spendingStrategyRoutes from './spendingStrategyRoutes.js';
import expenseWithdrawalStrategyRoutes from './expenseWithdrawalStrategyRoutes.js';
import rmdStrategyRoutes from './RMDStrategyRoutes.js';
import rothStrategyRoutes from './rothStrategyRoutes.js';
import sharingRoutes from './sharingRoutes.js';

import scenarioYamlRoutes from './scenarioYamlRoutes.js';

const router = express.Router();
router.use(authRoutes);
router.use(homeRoutes);
router.use(viewScenarioRoutes);
router.use(profileRoutes);
router.use(createScenarioRoutes);
router.use(basicInfoRoutes);
router.use(investmentTypesRoutes);
router.use(investmentsRoutes);
router.use(eventsRoutes);
router.use(limitsRoutes);
router.use(spendingStrategyRoutes);
router.use(expenseWithdrawalStrategyRoutes);
router.use(rmdStrategyRoutes);
router.use(rothStrategyRoutes);
router.use(sharingRoutes);

router.use(scenarioYamlRoutes);

router.get("/", async (req, res) => {
    console.log(req.session); // can be used to debug session data
    if (req.session.user) {
        return res.status(200).send("Verified, userId: " + req.session.user);
    } else {
        return res.status(204).send();
    }
});

export default router;