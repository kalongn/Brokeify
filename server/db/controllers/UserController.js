import mongoose from "mongoose";
import User from "../models/User.js";

import ScenarioController from "./ScenarioController.js";
import TaxController from "./TaxController.js";
import SimulationController from "./SimulationController.js";

/**
 * Controller for User, Support CRUD operations for User Class
 */
export default class UserController {
    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new User with the given data
     * @param {User} data 
     * @returns 
     *      Returns the created User
     * @throws Error
     *      Throws error if any error occurs
     */
    async create(data) {
        try {
            const user = new User(data);
            await user.save();
            return user;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads all Users
     * @returns 
     *      Returns all Users
     * @throws Error
     *      Throws error if any error occurs
     */
    async readAll() {
        try {
            return await User.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads a User with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the User to be read
     * @returns 
     *      Returns the User with the given id
     * @throws Error
     *      Throws error if the User is not found or if any error occurs
     */
    async read(id) {
        try {
            return await User.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads a User with the given id, stripping sensitive information and populating userSpecificTaxes
     *      This is used to get the User with all the taxes associated with it
     *      and to remove sensitive information from the User object
     *      and meant to use for the route /profile
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the User to be read
     * @returns 
     *      Returns the User with the given id and populated userSpecificTaxes
     * @throws Error
     *      Throws error if the User is not found or if any error occurs
     */
    async readWithTaxes(id) {
        try {
            const user = await User.findById(id).populate('userSpecificTaxes');
            return user;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads a User with the given id, populating the ownerScenarios and their investmentTypes
     *      This is used to get the User with all the scenarios associated with it
     *      and to get the number of investments and events in each scenario
     *      and meant to use for the route /home to load all the scenariocards for the User
     *      and to show the number of investments and events in each scenario
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the User to be read
     * @returns 
     *      Returns an array of objects containing the scenario id, name, filingStatus, financialGoal, investmentsLength and eventsLength
     *      for each scenario associated with the User
     * @throws Error
     *      Throws error if the User is not found or if any error occurs
     */
    async readWithScenarios(id) {
        try {
            return await User.findById(id).populate({
                path: 'ownerScenarios',
                populate: { path: 'investmentTypes' }
            });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function finds a User with the given googleId
     *      This is used for authentication with Google
     *      and to check if the User already exists in the database
     *      before creating a new User
     * @param {String} googleId 
     *      Google Id of the User to be found
     * @returns 
     *      Returns the User with the given googleId
     * @throws Error
     *      Throws error if the User is not found or if any error occurs
     */
    async findByGoogleId(googleId) {
        try {
            return await User.findOne
                ({ googleId });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes a User with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the User to be deleted
     * @param {User} data 
     *      Data for the User to be updated
     * @returns 
     *      Returns the updated User
     */
    async update(id, data) {
        try {
            return await User.findByIdAndUpdate(id, data, {
                new: true
            });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * Deletes a User with the given id, should also delete all the scenarios, taxes and simulations associated with the User.
     * This function is expect to be used for deleting Guest Users only
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the deleted User
     */
    async deepDeleteGuest(id) {
        const scenarioController = new ScenarioController();
        const taxController = new TaxController();
        const simulationController = new SimulationController();
        try {
            const user = await User.findById(id).populate('ownerScenarios userSpecificTaxes userSimulations');
            for (const scenario of user.ownerScenarios) {
                await scenarioController.delete(scenario._id);
            }
            for (const tax of user.userSpecificTaxes) {
                await taxController.delete(tax._id);
            }
            for (const simulation of user.userSimulations) {
                simulationController.delete(simulation._id);
            }
            return await User.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}