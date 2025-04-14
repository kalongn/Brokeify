import express from 'express';

import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import SimulationController from "../db/controllers/SimulationController.js";

import { canView } from "./helper.js";

const router = express.Router();
const userController = new UserController();
const simulationController = new SimulationController();
const scenarioController = new ScenarioController();

const generateLineChartData = (yearToResults) => {
    const labels = [];
    const values = [];

    for (const year in yearToResults) {
        labels.push(year);
        const yearlyResults = yearToResults[year];
        let count = 0;
        for (const result of yearlyResults) {
            if (!result.isViolated) {
                count++;
            }
        }
        values.push(yearlyResults.length > 0 ? count / yearlyResults.length : 0);
    }

    return {
        labels: labels,
        values: values,
    }
};

const getPercentile = (arr, percentile) => {
    const index = Math.floor(percentile * arr.length);
    return arr[index];
}

const generateShadedLineData = (chart, yearToResults) => {
    const labels = [];
    const median = [];
    const lower10 = [];
    const upper10 = [];
    const lower20 = [];
    const upper20 = [];
    const lower30 = [];
    const upper30 = [];
    const lower40 = [];
    const upper40 = [];

    for (const year in yearToResults) {
        labels.push(year);
        const yearlyResults = yearToResults[year];
        const values = yearlyResults.map((result) => {
            let value = 0;
            switch (chart.content.quantity) {
                case "Total Investments":
                    value = result.investmentValues.reduce((acc, investment) => acc + investment.value, 0);
                    break;
                case "Total Income":
                    value = result.totalIncome;
                    break;
                case "Total Expenses (including taxes)":
                    value = result.totalExpense + result.totalTax;
                    break;
                case "Early Withdrawal Tax":
                    value = result.earlyWithdrawalTax;
                    break;
                case "Percentage of Discretionary Expenses":
                    value = result.totalDiscretionaryExpenses;
                    break;
                default:
                    // Should not happen
                    break;
            }
            if (chart.content.quantity !== "Percentage of Discretionary Expenses") {
                if (chart.content.dollarValue === "Today") {
                    value /= (1 + result.cumulativeInflation);
                }
            }
            return value;
        });
        values.sort((a, b) => a - b);

        median.push(getPercentile(values, 0.5));
        lower10.push(getPercentile(values, 0.1));
        upper10.push(getPercentile(values, 0.9));
        lower20.push(getPercentile(values, 0.2));
        upper20.push(getPercentile(values, 0.8));
        lower30.push(getPercentile(values, 0.3));
        upper30.push(getPercentile(values, 0.7));
        lower40.push(getPercentile(values, 0.4));
        upper40.push(getPercentile(values, 0.6));
    }

    return {
        labels: labels,
        median: median,
        lower10: lower10,
        upper10: upper10,
        lower20: lower20,
        upper20: upper20,
        lower30: lower30,
        upper30: upper30,
        lower40: lower40,
        upper40: upper40,
    }
};

router.get("/charts/:simulationId", async (req, res) => {
    const simulationId = req.params.simulationId;
    console.log("Simulation ID:", simulationId);
    const simulation = await simulationController.read(simulationId);
    const scenarioId = simulation.scenario.toString();

    if (!await canView(req.session.user, scenarioId)) {
        return res.status(403).send("You do not have permission to access this scenario.");
    }

    const scenario = await scenarioController.read(scenarioId);
    const scenarioName = scenario.name;
    return res.status(200).send({
        scenarioName: scenarioName,
    });
})



router.post("/charts/:simulationId", async (req, res) => {
    const simulationId = req.params.simulationId;
    const charts = req.body;

    const simulation = await simulationController.read(simulationId);

    const yearToResults = {}

    simulation.results.forEach((result) => {
        result.yearlyResults.forEach((yearlyResult) => {
            if (!yearToResults[yearlyResult.year]) {
                yearToResults[yearlyResult.year] = [];
            }
            yearToResults[yearlyResult.year].push(yearlyResult);
        });
    });



    charts.forEach((chart) => {
        switch (chart.type) {
            case "Line Chart":
                chart.data = generateLineChartData(yearToResults);
                break;
            case "Shaded Line Chart":
                chart.data = generateShadedLineData(chart, yearToResults);
                break;
            case "Stacked Bar Chart":
                chart.data = {
                    type: "stackedBar",
                    data: chart.data,
                    label: chart.label,
                };
                break;
            default:
                break;
        }
    });

    return res.status(200).send(charts);
});

export default router;  