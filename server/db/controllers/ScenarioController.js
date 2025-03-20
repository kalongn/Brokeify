import mongoose from "mongoose";
import Scenario from "../models/Scenario.js";

import EventController from "./EventController.js";
import InvestmentTypeController from "./InvestmentTypeController.js";
import InvestmentController from "./InvestmentController.js";
import DistributionController from "./DistributionController.js";


/**
 * Controller for Scenario, Support CRUD operations for Scenario Class
 */
export default class ScenarioController {
    constructor() { }

    /**
     * This function create a new Scenario with the given data
     * @param {Scenario} data 
     * @returns 
     *      Returns the created Scenario
     * @throws Error
     *      Throws error if any error
     */
    async create(data) {
        try {
            const scenario = new Scenario(data);
            await scenario.save();
            return scenario;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function obtains all Scenarios
     * @returns 
     *      Returns all Scenarios
     * @throws Error
     *      Throws error if any error
     */
    async readAll() {
        try {
            return await Scenario.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads a Scenario with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Scenario to be read
     * @returns 
     *      Returns the Scenario with the given id
     */
    async read(id) {
        try {
            return await Scenario.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function updates a Scenario with the given id
     * @param {mongoose.Types.ObjectId} id
     *      Id of the Scenario to be updated
     * @param {Scenario} data
     *      Data for the Scenario
     * @returns
     *      Returns the updated Scenario
     * @throws Error
     *      Throws error if the Scenario is not found or if any error occurs
     */
    async update(id, data) {
        try {
            return await Scenario.findByIdAndUpdate(id, data, { new: true });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes the Scenario with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the deleted Scenario
     * @throws Error
     *      Throws error if the Scenario is not found or if any error occurs
     */
    async shallowDelete(id) {
        try {
            return await Scenario.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes a Scenario with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Scenario to be deleted
     * @returns 
     *      Returns the deleted Scenario
     * @throws Error
     *      Throws error if the Scenario is not found or if any error occurs
     */
    async delete(id) {
        try {
            const deleteScenario = await Scenario.findById(id).populate("investmentTypes");
            const eventController = new EventController();
            const investmentTypeController = new InvestmentTypeController();
            const investmentController = new InvestmentController();
            const distributionController = new DistributionController();

            for (const event of deleteScenario.events) {
                await eventController.delete(event);
            }

            for (const investmentType of deleteScenario.investmentTypes) {
                console.log(investmentType.investments);
                for (const investment of investmentType.investments) {
                    await investmentController.delete(investment);
                }
                await investmentTypeController.delete(investmentType);
            }

            await distributionController.delete(deleteScenario.inflationAssumptionDistribution);
            return await Scenario.deleteOne({ _id: id });
        }
        catch (error) {
            throw new Error(error);
        }
    }
}