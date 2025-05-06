import mongoose from "mongoose";

import Simulation from "../models/Simulation.js";
import ResultController from "./ResultController.js";

/**
 * Controller for Simulation, Support CRUD operations for Simulation Class
 */
export default class SimulationController {

    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new Simulation with the given data
     * @param {Simulation} data 
     *      Data for the simulation, check Simulation.js for the data structure
     * @returns 
     *      Returns the created Simulation
     * @throws Error
     *      Throws error if any error occurs
     */
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

    async readWithNoPopulate(id) {
        try {
            const simulation = await Simulation.findById(id);
            return simulation;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async read(id) {
        try {
            const simulation = await Simulation.findById(id).populate("results");
            return simulation;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async readWithPopulate(id) {
        try {
            const simulation = await Simulation.findById(id).populate("scenario results paramOne paramTwo paramOneSteps paramTwoSteps");
            return simulation;
        } catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function delete the Simulation with the given id
     * @note
     *      This function also deletes all the results associated with the simulation
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the simulation to be deleted
     * @returns
     *      Returns the simulation
     * @throws Error
     *      Throws error if simulation not found or if any error occurs
     */
    async delete(id) {
        const resultController = new ResultController();
        try {
            const simulation = await Simulation.findById(id);
            if (!simulation) {
                return;
            }
            for (const result of simulation.results) {
                await resultController.delete(result);
            }
            await Simulation.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes a Simulation with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Simulation to be deleted
     * @param {Simulation} data 
     *      Data for the Simulation to be updated
     * @returns 
     *      Returns the updated Simulation
     */
    async update(id, data) {
        try {
            return await Simulation.findByIdAndUpdate(id, data, {
                new: true
            });
        }
        catch (error) {
            throw new Error(error);
        }
    }

}