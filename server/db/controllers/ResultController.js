import mongoose from "mongoose";
import Result from "../models/Result.js";

/**
 * Controller for Result, Support CRUD operations for Result Class
 */
export default class ResultController {

    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new Result with the given data
     * @param {Result} data 
     *      Data for the result, check Result.js for the data structure
     * @returns 
     *      Returns the created result
     */
    async create(data) {
        try {
            const result = new Result(data);
            await result.save();
            return result;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads the Result with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the result to be read
     * @returns
     *      Returns the result
     * @throws Error
     *      Throws error if result not found or if any error occurs
     */
    async delete(id) {
        try {
            await Result.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}