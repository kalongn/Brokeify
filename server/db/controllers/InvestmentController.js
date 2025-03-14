import mongoose from "mongoose";
import { Investment } from "../models/Investment.js";

/**
 * Controller for Investment, Support CRUD operations for Investment Class
 */
export default class InvestmentController {
    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new Investment with the given data
     * @param {Investment} data 
     *      Data for the Investment, check Investment.js for the data structure
     *      Requires an ID from InvestmentType beside other normal datatype
     * @returns 
     *      Returns the created Investment
     * @throws Error
     *      Throws error if any error occurs
     */
    async create(data) {
        try {
            const investment = new Investment(data);
            await investment.save();
            return investment;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads all Investments
     * @returns all Investments
     * @throws Error
     *     Throws error if any error occurs
     */
    async readAll() {
        try {
            return await Investment.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This funciton finds a Investment with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the Investment with the given id
     * @throws Error
     *      Throws error if the Investment is not found or if any error occurs
     */
    async read(id) {
        try {
            return await Investment.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function updates the Investment with the given id with the given data
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Investment to be updated
     * @param {Investment} data 
     *      Data for the Investment, check Investment.js for the data structure
     * @returns 
     *      Returns the updated Investment
     * @throws Error
     *      Throws error if the Investment is not found or if any error occurs
     */
    async update(id, data) {
        try {
            return await Investment.findByIdAndUpdate
                (id, data, { new: true });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function deletes the Investment with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the deleted Investment
     * @throws Error
     *      Throws error if the Investment is not found or if any error occurs
     */
    async delete(id) {
        try {
            return await Investment.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}
