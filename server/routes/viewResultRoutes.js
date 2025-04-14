import express from 'express';

import UserController from "../db/controllers/UserController.js";
import ScenarioController from "../db/controllers/ScenarioController.js";
import SimulationController from "../db/controllers/SimulationController.js";

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



router.post("/charts/:simulationId", async (req, res) => {
    const simulationId = req.params.simulationId;
    console.log("Simulation ID:", simulationId);
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
            case "Shaded Line Data":
                chart.data = {
                    type: "shadedLine",
                    data: chart.data,
                    label: chart.label,
                };
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