import express from "express";
import { distributionToBackend, distributionToFrontend, canEdit } from "./helper.js";

import ScenarioController from "../db/controllers/ScenarioController.js";
import InvestmentTypeController from "../db/controllers/InvestmentTypeController.js";
import DistributionController from "../db/controllers/DistributionController.js";

const router = express.Router();

const scenarioController = new ScenarioController();
const investmentTypeController = new InvestmentTypeController();
const distributionController = new DistributionController();


// obtain the investment types of the scenario
router.get("/investmentTypes/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.readWithPopulate(id);

        const investmentType = scenario.investmentTypes.map(type => {
            return {
                id: type._id,
                name: type.name,
                taxability: type.taxability,
            }
        });
        return res.status(200).send(investmentType);
    } catch (error) {
        console.error("Error in investment types route:", error);
        return res.status(500).send("Error retrieving investment types.");
    }
});

router.get("/investmentType/:scenarioId/:investmentTypeId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const investmentTypeId = req.params.investmentTypeId;

        const investmentType = await investmentTypeController.readWithPopulate(investmentTypeId);

        const resultInvestmentType = {
            name: investmentType.name,
            description: investmentType.description,
            expectedAnnualReturn: distributionToFrontend(investmentType.expectedAnnualReturnDistribution),
            expenseRatio: investmentType.expenseRatio * 100,
            expectedDividendsInterest: distributionToFrontend(investmentType.expectedAnnualIncomeDistribution),
            taxability: investmentType.taxability ? "taxable" : "taxExempt",
        }

        return res.status(200).send(resultInvestmentType);
    } catch (error) {
        console.error("Error in investment type route:", error);
        return res.status(500).send("Error retrieving investment type.");
    }
});

// create a new investment type for the scenario
router.post("/investmentType/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const { name, description, expectedAnnualReturn, expenseRatio, expectedDividendsInterest, taxability } = req.body;

        const scenario = await scenarioController.readWithPopulate(id);
        const currentInvestmentType = scenario.investmentTypes;
        for (let type of currentInvestmentType) {
            if (type.name === name) {
                return res.status(400).send("Investment type already exists.");
            }
        }

        const requestExpectedAnnualReturn = distributionToBackend(expectedAnnualReturn);
        const requestExpectedDividendsInterest = distributionToBackend(expectedDividendsInterest);

        const requestExpenseRatio = expenseRatio / 100;

        let { distributionType, ...data } = requestExpectedAnnualReturn;
        const expectedAnnualReturnDistribution = await distributionController.create(distributionType, data);
        ({ distributionType, ...data } = requestExpectedDividendsInterest);
        const expectedAnnualIncomeDistribution = await distributionController.create(distributionType, data);

        const newInvestmentType = await investmentTypeController.create({
            name: name,
            description: description,
            expectedAnnualReturnDistribution: expectedAnnualReturnDistribution,
            expenseRatio: requestExpenseRatio,
            expectedAnnualIncomeDistribution: expectedAnnualIncomeDistribution,
            taxability: taxability === "taxable",
            investments: [],
        });

        await scenarioController.update(id, {
            $push: { investmentTypes: newInvestmentType._id }
        });

        return res.status(200).send("Investment type added.");
    } catch (error) {
        console.error("Error in investment type route:", error);
        return res.status(500).send("Error creating investment type.");
    }
});

router.put("/investmentType/:scenarioId/:investmentTypeId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }
        const investmentTypeId = req.params.investmentTypeId;

        const { name, description, expectedAnnualReturn, expenseRatio, expectedDividendsInterest, taxability } = req.body;

        const investmentType = await investmentTypeController.read(investmentTypeId);

        const requestExpectedAnnualReturn = distributionToBackend(expectedAnnualReturn);
        const requestExpectedDividendsInterest = distributionToBackend(expectedDividendsInterest);

        const expectedAnnualReturnDistribution = await distributionController.update(investmentType.expectedAnnualReturnDistribution, requestExpectedAnnualReturn);
        const expectedAnnualIncomeDistribution = await distributionController.update(investmentType.expectedAnnualIncomeDistribution, requestExpectedDividendsInterest);

        const requestExpenseRatio = expenseRatio / 100;

        await investmentTypeController.update(investmentTypeId, {
            name: name,
            description: description,
            expectedAnnualReturnDistribution: expectedAnnualReturnDistribution,
            expenseRatio: requestExpenseRatio,
            expectedAnnualIncomeDistribution: expectedAnnualIncomeDistribution,
            taxability: taxability === "taxable",
        });

        return res.status(200).send("Investment type updated.");
    } catch (error) {
        console.error("Error in investment type route:", error);
        return res.status(500).send("Error updating investment type.");
    }
});

export default router;