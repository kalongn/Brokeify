import Simulation from "../models/Simulation.js";
import ResultController from "./ResultController.js";

export default class SimulationController {

    constructor() { }

    async create(data) {
        try {
            const simulation = new Simulation(data);
            await simulation.save();
            return simulation;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async delete(id) {
        const resultController = new ResultController();
        try {
            const simulation = await Simulation.findById(id);
            for (const result of simulation.results) {
                await resultController.delete(result);
            }
            await Simulation.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}