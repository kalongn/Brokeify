import express from "express";
import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import InvestmentController from "../db/controllers/InvestmentController.js";
import DistributionController from "../db/controllers/DistributionController.js";

const router = express.Router();
const userController = new UserController();
const scenarioController = new ScenarioController();
const investmentTypeController = new InvestmentTypeController();
const investmentController = new InvestmentController();
const distributionController = new DistributionController();

router.post("/newScenario", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const user = await userController.read(req.session.user);
        const newScenario = await scenarioController.create({
            investmentTypes: [await investmentTypeController.create({
                name: "Cash",
                description: "HERE COMES THE MONEY",
                expectedAnnualReturn: 0,
                expectedAnnualReturnDistribution: await distributionController.create("FIXED_AMOUNT", { value: 0 }),
                exprenseRatio: 0,
                expectedAnnualIncome: 0,
                expectedAnnualIncomeDistribution: await distributionController.create("FIXED_AMOUNT", { values: 0 }),
                taxability: false,
                investments: [await investmentController.create({ value: 0, taxStatus: "CASH" })],
            })],
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

export default router;