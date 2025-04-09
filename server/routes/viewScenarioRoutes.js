import express from 'express';

import ScenarioController from '../db/controllers/ScenarioController.js';
import { canView, distributionToString, stateAbbreviationToString, taxStatusToFrontend } from './helper.js';

const router = express.Router();
const scenarioController = new ScenarioController();


router.get("/scenario/:scenarioId", async (req, res) => {
    if (req.session.user) {
        try {
            const id = req.params.scenarioId;

            if (!await canView(req.session.user, id)) {
                return res.status(403).send("You do not have permission to access this scenario.");
            }

            let scenario = await scenarioController.readWithPopulate(id);
            if (!scenario) {
                return res.status(404).send("Scenario not found.");
            }

            const investmentIdNameMap = {};
            for (let investmentType of scenario.investmentTypes) {
                for (let investment of investmentType.investments) {
                    investmentIdNameMap[investment._id] = investmentType.name;
                }
            }

            const investments = scenario.investmentTypes.flatMap(investmentType => {
                return investmentType.investments.map(investment => ({
                    investmentType: {
                        name: investmentType.name,
                        expectedAnnualReturn: distributionToString(investmentType.expectedAnnualReturnDistribution),
                        taxability: investmentType.taxability,
                    },
                    value: investment.value,
                    taxStatus: taxStatusToFrontend(investment.taxStatus),
                }));
            });

            const eventIdNameMap = {};
            for (let event of scenario.events) {
                eventIdNameMap[event._id] = event.name;
            }

            const events = scenario.events.map(event => {
                let startYear;
                if (event.startYearTypeDistribution) {
                    startYear = distributionToString(event.startYearTypeDistribution);
                } else if (event.startsWith) {
                    startYear = `Starts with event: ${eventIdNameMap[event.startsWith] || "Unnamed Event"}`;
                } else if (event.startsAfter) {
                    startYear = `Starts after event: ${eventIdNameMap[event.startsAfter] || "Unnamed Event"}`;
                } else {
                    startYear = "N/A";
                }

                return {
                    name: event.name,
                    amount: event.amount ?? event.maximumCash ?? 0,
                    duration: distributionToString(event.durationTypeDistribution),
                    startYear: startYear,
                    eventType: event.eventType,
                };
            });

            const spendingStrategy = scenario.orderedSpendingStrategy.map(eventId => {
                return eventIdNameMap[eventId] || "Unnamed Event";
            });

            const expenseWithdrawalStrategy = scenario.orderedExpenseWithdrawalStrategy.map(investId => {
                return investmentIdNameMap[investId] || "Unnamed Investment";
            });

            const rmdStrategy = scenario.orderedRMDStrategy.map(investId => {
                return investmentIdNameMap[investId] || "Unnamed Investment";
            });

            const rothStrategy = scenario.orderedRothStrategy.map(investId => {
                return investmentIdNameMap[investId] || "Unnamed Investment";
            });


            const data = {
                name: scenario.name,
                ownerFirstName: scenario.ownerFirstName,
                ownerLastName: scenario.ownerLastName,
                financialGoal: scenario.financialGoal,
                filingStatus: scenario.filingStatus,
                userBirthYear: scenario.userBirthYear,
                spouseBirthYear: scenario.spouseBirthYear,
                userLifeExpectancyDistribution: distributionToString(scenario.userLifeExpectancyDistribution),
                spouseLifeExpectancyDistribution: distributionToString(scenario.spouseLifeExpectancyDistribution),
                stateOfResidence: stateAbbreviationToString(scenario.stateOfResidence),
                investments: investments,
                events: events,
                inflationAssumptionDistribution: distributionToString(scenario.inflationAssumptionDistribution),
                annualPostTaxContributionLimit: distributionToString(scenario.annualPostTaxContributionLimit),
                orderedSpendingStrategy: spendingStrategy,
                orderedExpenseWithdrawalStrategy: expenseWithdrawalStrategy,
                orderedRMDStrategy: rmdStrategy,
                startYearRothOptimizer: scenario.startYearRothOptimizer,
                endYearRothOptimizer: scenario.endYearRothOptimizer,
                orderedRothStrategy: rothStrategy,
            }

            return res.status(200).send(data);
        } catch (error) {
            console.error("Error in scenario route:", error);
            return res.status(500).send("Error retrieving scenario.");
        }
    } else {
        res.status(401).send("Not logged in.");
    }
});

export default router;