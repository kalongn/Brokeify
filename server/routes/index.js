import express from 'express';
import passport from 'passport';

import ScenarioController from '../db/controllers/ScenarioController.js';
import UserController from '../db/controllers/UserController.js';
import TaxController from '../db/controllers/TaxController.js';
import InvestmentTypeController from '../db/controllers/InvestmentTypeController.js';
import InvestmentController from '../db/controllers/InvestmentController.js';
import DistributionController from '../db/controllers/DistributionController.js';

const router = express.Router();

const scenarioController = new ScenarioController();
const userController = new UserController();
const investmentTypeController = new InvestmentTypeController();
const investmentController = new InvestmentController();
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

// Distribution type map, converting from the database to the frontend and vice versa
const distributionToFrontend = (distribution) => {
    if (!distribution) {
        return null;
    }
    switch (distribution.distributionType) {
        case "FIXED_AMOUNT":
            return { type: "fixed", value: distribution.value };
        case "UNIFORM_AMOUNT":
            return { type: "uniform", lowerBound: distribution.lowerBound, upperBound: distribution.upperBound };
        case "NORMAL_AMOUNT":
            return { type: "normal", mean: distribution.mean, standardDeviation: distribution.standardDeviation };
        case "FIXED_PERCENTAGE":
            return { type: "fixed", value: distribution.value, isPercentage: true };
        case "UNIFORM_PERCENTAGE":
            return { type: "uniform", lowerBound: distribution.lowerBound, upperBound: distribution.upperBound, isPercentage: true };
        case "NORMAL_PERCENTAGE":
            return { type: "normal", mean: distribution.mean, standardDeviation: distribution.standardDeviation, isPercentage: true };
        default:
            return null;
    }
}

const FrontendToDistribution = (distribution) => {
    if (!distribution) {
        return null;
    }
    const { type, ...data } = distribution;
    let distributionType = null;
    switch (type) {
        case "fixed":
            distributionType = data.isPercentage ? "FIXED_PERCENTAGE" : "FIXED_AMOUNT";
            break;
        case "uniform":
            distributionType = data.isPercentage ? "UNIFORM_PERCENTAGE" : "UNIFORM_AMOUNT";
            break;
        case "normal":
            distributionType = data.isPercentage ? "NORMAL_PERCENTAGE" : "NORMAL_AMOUNT";
            break;
        default:
            return null;
    }
    delete data.isPercentage;
    return { distributionType, ...data };
}

// Permission verifier
const canEdit = async (userId, scenarioId) => {
    const user = await userController.read(userId);
    return user.ownerScenarios.some(scenario => scenario._id.toString() === scenarioId) ||
        user.editorScenarios.some(scenario => scenario._id.toString() === scenarioId);
}

// create new default scenario
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

// obtain the basic info of the scenario
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

        const requestLifeExpectancy = FrontendToDistribution(lifeExpectancy);
        const requestSpouseLifeExpectancy = FrontendToDistribution(spouseLifeExpectancy);

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
            spouseLifeExpectancyDistribution: spouseLifeExpectancyDistribution
        });

        return res.status(200).send("Basic info updated.");
    } catch (error) {
        console.error("Error in basic info route:", error);
        return res.status(500).send("Error updating basic info.");
    }
});

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

        const distributionValueMap = {
            "fixed": "FIXED_AMOUNT",
            "normal": "NORMAL_AMOUNT",
        }

        const distributionPercentageMap = {
            "fixed": "FIXED_PERCENTAGE",
            "normal": "NORMAL_PERCENTAGE",
        }

        let type = expectedAnnualReturn.isPercentage ? distributionPercentageMap[expectedAnnualReturn.type] : distributionValueMap[expectedAnnualReturn.type];
        let data = expectedAnnualReturn;
        if (expectedAnnualReturn.isPercentage) {
            switch (expectedAnnualReturn.type) {
                case "fixed":
                    data.fixedValue /= 100;
                    break;
                case "normal":
                    data.mean /= 100;
                    data.stdDev /= 100;
                    break;
            }
        }
        data.standardDeviation = data.stdDev;
        delete data.type;
        delete data.stdDev;
        const expectedAnnualReturnDistribution = await distributionController.create(type, data);

        type = expectedDividendsInterest.isPercentage ? distributionPercentageMap[expectedDividendsInterest.type] : distributionValueMap[expectedDividendsInterest.type];
        data = expectedDividendsInterest;
        delete data.type;
        if (expectedDividendsInterest.isPercentage) {
            switch (expectedDividendsInterest.type) {
                case "fixed":
                    data.fixedValue /= 100;
                    break;
                case "normal":
                    data.mean /= 100;
                    data.stdDev /= 100;
                    break;
            }
        }
        data.standardDeviation = data.stdDev;
        delete data.stdDev;
        const expectedAnnualIncomeDistribution = await distributionController.create(type, data);

        const newInvestmentType = await investmentTypeController.create({
            name: name,
            description: description,
            expectedAnnualReturnDistribution: expectedAnnualReturnDistribution,
            expenseRatio: expenseRatio,
            expectedAnnualIncomeDistribution: expectedAnnualIncomeDistribution,
            taxability: taxability,
            investments: [],
        });

        await scenarioController.update(id, {
            $push: { investmentTypes: newInvestmentType._id }
        });

        return res.status(200).send("Investment type added.");
    } catch (error) {
        console.error("Error in investment type route:", error);
        return res.status(500).send("Error retrieving investment type.");
    }
});

// obtain all the investments of the scenario
router.get("/investments/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const taxStatusMap = {
            "CASH": "Cash",
            "NON_RETIREMENT": "Non-Retirement",
            "PRE_TAX_RETIREMENT": "Pre-Tax Retirement",
            "AFTER_TAX_RETIREMENT": "After-Tax Retirement",
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const investments = scenario.investmentTypes.flatMap(type => {
            return type.investments.map(investment => {
                return {
                    id: investment._id,
                    type: type.name,
                    dollarValue: investment.value,
                    taxStatus: taxStatusMap[investment.taxStatus]
                }
            });
        });
        return res.status(200).send(investments);
    } catch (error) {
        console.error("Error in investments route:", error);
        return res.status(500).send("Error retrieving investments.");
    }
});

// update the investments of the scenario
router.post("/investments/:scenarioId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }
    try {
        const userId = req.session.user;
        const id = req.params.scenarioId;
        if (!await canEdit(userId, id)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const taxStatusMap = {
            "Cash": "CASH",
            "Non-Retirement": "NON_RETIREMENT",
            "Pre-Tax Retirement": "PRE_TAX_RETIREMENT",
            "After-Tax Retirement": "AFTER_TAX_RETIREMENT",
        }

        const scenario = await scenarioController.readWithPopulate(id);
        const { investments } = req.body;

        for (let investment of investments) {
            if (investment.id === undefined) {
                const investmentDB = await investmentController.create({
                    value: investment.dollarValue,
                    taxStatus: taxStatusMap[investment.taxStatus]
                });

                for (let type of scenario.investmentTypes) {
                    if (type.name === investment.type) {
                        await investmentTypeController.update(type._id, {
                            $push: { investments: investmentDB._id }
                        });
                        break;
                    }
                }
            } else {
                let currentInvestmentType = null;
                for (let type of scenario.investmentTypes) {
                    for (let inv of type.investments) {
                        if (inv._id.toString() === investment.id) {
                            currentInvestmentType = type.name;
                            break;
                        }
                    }
                }
                if (currentInvestmentType !== investment.type) {
                    const currentType = scenario.investmentTypes.find(type => type.name === currentInvestmentType);
                    const newType = scenario.investmentTypes.find(type => type.name === investment.type);
                    await investmentTypeController.update(currentType._id, {
                        $pull: { investments: investment.id }
                    });
                    await investmentTypeController.update(newType._id, {
                        $push: { investments: investment.id }
                    });
                }
                await investmentController.update(investment.id, {
                    value: investment.dollarValue,
                    taxStatus: taxStatusMap[investment.taxStatus]
                });
            }

        }
        return res.status(200).send("Investments updated.");
    } catch (error) {
        console.error("Error in investments route:", error);
        return res.status(500).send("Error updating investments.");
    }


});

export default router;
