import express from 'express';

import EventController from "../db/controllers/EventController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import SimulationController from "../db/controllers/SimulationController.js";

import { canView, explorationTypeToFrontend } from "./helper.js";

const router = express.Router();
const eventController = new EventController();
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
        values.push(yearlyResults.length > 0 ? count / yearlyResults.length * 100 : 0);
    }

    return {
        labels: labels,
        values: values,
    }
};

const getAverage = (arr) => {
    if (arr.length === 0) {
        return 0;
    }
    const sum = arr.reduce((acc, value) => acc + value, 0);
    return sum / arr.length;
}

const getPercentile = (arr, percentile) => {
    if (arr.length === 0) {
        return 0;
    }
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
                    value = result.totalDiscretionaryExpenses * 100;
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

const generateStackedBarData = (chart, yearToResults) => {
    const labels = [];

    const finalNameToValues = {}
    for (const year in yearToResults) {
        const yearlyResults = yearToResults[year];
        for (const result of yearlyResults) {
            switch (chart.content.quantity) {
                case "Investments Breakdown":
                    result.investmentValues.forEach((investment) => {
                        if (!finalNameToValues[investment.name]) {
                            finalNameToValues[investment.name] = [];
                        }
                    });
                    break;
                case "Incomes Breakdown":
                    result.incomeByEvent.forEach((income) => {
                        if (!finalNameToValues[income.name]) {
                            finalNameToValues[income.name] = [];
                        }
                    });
                    break;
                case "Expenses Breakdown":
                    result.expenseByEvent.forEach((expense) => {
                        if (!finalNameToValues[expense.name]) {
                            finalNameToValues[expense.name] = [];
                        }
                    });
                    break;
                default:
                    // Should not happen
                    break;
            }
        }
    }
    if (chart.content.quantity === "Expenses Breakdown" && !finalNameToValues["Total Taxes"]) {
        finalNameToValues["Total Taxes"] = [];
    }
    finalNameToValues["Other"] = [];

    for (const year in yearToResults) {
        labels.push(year);
        const yearlyResults = yearToResults[year];

        const nameToListOfValues = {}

        for (const result of yearlyResults) {
            switch (chart.content.quantity) {
                case "Investments Breakdown":
                    result.investmentValues.forEach((investment) => {
                        if (!nameToListOfValues[investment.name]) {
                            nameToListOfValues[investment.name] = [];
                        }
                        nameToListOfValues[investment.name].push(chart.content.dollarValue === "Today" ? investment.value / (1 + result.cumulativeInflation) : investment.value);
                    });
                    break;
                case "Incomes Breakdown":
                    result.incomeByEvent.forEach((income) => {
                        if (!nameToListOfValues[income.name]) {
                            nameToListOfValues[income.name] = [];
                        }
                        nameToListOfValues[income.name].push(chart.content.dollarValue === "Today" ? income.value / (1 + result.cumulativeInflation) : income.value);
                    });
                    break;
                case "Expenses Breakdown":
                    result.expenseByEvent.forEach((expense) => {
                        if (!nameToListOfValues[expense.name]) {
                            nameToListOfValues[expense.name] = [];
                        }
                        nameToListOfValues[expense.name].push(chart.content.dollarValue === "Today" ? expense.value / (1 + result.cumulativeInflation) : expense.value);
                    });
                    if (!nameToListOfValues["Total Taxes"]) {
                        nameToListOfValues["Total Taxes"] = [];
                    }
                    nameToListOfValues["Total Taxes"].push(chart.content.dollarValue === "Today" ? result.totalTax / (1 + result.cumulativeInflation) : result.totalTax);
                    break;
                default:
                    // Should not happen
                    break;
            }
        }
        switch (chart.content.valueType) {
            case "Average":
                for (const name in nameToListOfValues) {
                    nameToListOfValues[name] = getAverage(nameToListOfValues[name]);
                }
                break;
            case "Median":
                for (const name in nameToListOfValues) {
                    nameToListOfValues[name].sort((a, b) => a - b);
                    nameToListOfValues[name] = getPercentile(nameToListOfValues[name], 0.5);
                }
                break;
        }

        let otherValue = 0;

        for (const name in nameToListOfValues) {
            if (chart.content.threshold && nameToListOfValues[name] < chart.content.threshold) {
                otherValue += nameToListOfValues[name];
                nameToListOfValues[name] = 0;
            }
        }

        nameToListOfValues["Other"] = otherValue;
        for (const name in finalNameToValues) {
            finalNameToValues[name].push(nameToListOfValues[name] ? nameToListOfValues[name] : 0);
        }
    }

    const data = {
        labels: labels,
        ...finalNameToValues,
    }

    return data;
}

router.get("/charts/:simulationId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }

    try {
        const simulationId = req.params.simulationId;
        console.log("Simulation ID:", simulationId);
        const simulation = await simulationController.read(simulationId);
        const scenarioId = simulation.scenario.toString();

        if (!await canView(req.session.user, scenarioId)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        const scenario = await scenarioController.read(scenarioId);
        const scenarioName = scenario.name;

        let data = null

        switch (simulation.simulationType) {
            case "NORMAL":
                data = {
                    scenarioName: scenarioName,
                }
                break;
            case "1D":
                const paramOneType = simulation.paramOneType;
                let paramOneName = null;
                let paramOneSteps = null;
                if (paramOneType !== "ROTH_BOOLEAN") {
                    const paramOne = await eventController.read(simulation.paramOne);
                    paramOneName = paramOne.name;
                    paramOneSteps = simulation.paramOneSteps;
                }
                data = {
                    scenarioName: scenarioName,
                    paramOneType: explorationTypeToFrontend(paramOneType),
                    paramOneName: paramOneName,
                    paramOneSteps: paramOneSteps,
                }
                break;
            case "2D":
                // TODO: Handle 2D simulation
                data = {
                    scenarioName: scenarioName,
                }
                break;
        }
        return res.status(200).send(data);
    } catch (error) {
        console.error("Error in charts route:", error);
        return res.status(500).send("Error retrieving charts.");
    }
})

const normalSimulation = (requestChart, simulation) => {
    const yearToResults = {}

    simulation.results.forEach((result) => {
        result.yearlyResults.forEach((yearlyResult) => {
            if (!yearToResults[yearlyResult.year]) {
                yearToResults[yearlyResult.year] = [];
            }
            yearToResults[yearlyResult.year].push(yearlyResult);
        });
    });

    requestChart.forEach((chart) => {
        switch (chart.type) {
            case "Line Chart":
                chart.data = generateLineChartData(yearToResults);
                break;
            case "Shaded Line Chart":
                chart.data = generateShadedLineData(chart, yearToResults);
                break;
            case "Stacked Bar Chart":
                chart.data = generateStackedBarData(chart, yearToResults);
                break;
            default:
                break;
        }
    });
    return requestChart;
}


router.post("/charts/:simulationId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Not logged in.");
    }

    const simulationId = req.params.simulationId;
    const charts = req.body;

    try {
        const simulation = await simulationController.read(simulationId);
        const scenarioId = simulation.scenario.toString();

        let responseData = null;
        if (!await canView(req.session.user, scenarioId)) {
            return res.status(403).send("You do not have permission to access this scenario.");
        }

        if (simulation.paramOneType !== undefined && simulation.paramTwoType !== undefined) {
            // TODO: Handle 2D simulation
            return res.status(400).send("2D simulation not supported yet.");
        } else if (simulation.paramOneType !== undefined) {
            return res.status(400).send("1D simulation not supported yet.");
        } else {
            // Normal simulation
            responseData = normalSimulation(charts, simulation);
        }

        return res.status(200).send(responseData);
    } catch (error) {
        console.error("Error in charts route:", error);
        return res.status(500).send("Error retrieving charts.");
    }

});

export default router;  