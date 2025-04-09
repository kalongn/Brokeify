import mongoose from "mongoose";
import { Distribution, FixedDistribution, UniformDistribution, NormalDistribution } from "../models/Distribution.js";

/**
 * @typedef {"FIXED_AMOUNT" | "FIXED_PERCENTAGE" | "UNIFORM_AMOUNT" | "UNIFORM_PERCENTAGE" | "NORMAL_AMOUNT" | "NORMAL_PERCENTAGE"} DistributionType
 */

/**
 * Controller for Distribution, Support CRUD operations for Distribution Class
 */
export default class DistributionController {

    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * 
     * @param {DistributionType} distributionType 
     *      Type of distribution to be created
     * @param {Distribution} data 
     *      Data for the distribution, check Distribution.js for the data structure for each respective distribution type
     * @returns 
     *      Returns the created distribution
     * @throws Error
     *      Throws error if any error occurs or if the distribution type is not handled
     */
    async create(distributionType, data) {
        try {
            let distribution;
            switch (distributionType) {
                case "FIXED_AMOUNT":
                case "FIXED_PERCENTAGE":
                    distribution = new FixedDistribution({ distributionType, ...data });
                    break;

                case "UNIFORM_AMOUNT":
                case "UNIFORM_PERCENTAGE":
                    distribution = new UniformDistribution({ distributionType, ...data });
                    break;

                case "NORMAL_AMOUNT":
                case "NORMAL_PERCENTAGE":
                    distribution = new NormalDistribution({ distributionType, ...data });
                    break;

                default:
                    throw new Error("Unhandled distribution type");
            }
            await distribution.save();
            return distribution;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads all the distributions and return them all
     * @returns All the distributions
     * @throws Error if any Error occurs
     */
    async readAll() {
        try {
            return await Distribution.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function find the distribution of the given Id
     * @param {mongoose.Types.ObjectId} id 
     *      The Id of the distribution to be found
     * @returns The distribution of that Id
     * @throws Error if the distribution is not found
     */
    async read(id) {
        try {
            return await Distribution.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function update the distribution of the given Id with the given data, handling the distribution type accordingly
     * @param {mongoose.Types.ObjectId} id 
     *      The Id of the distribution to be updated
     * @param {Distribution} data 
     *      Data for the distribution, check Distribution.js for the data structure for each respective distribution type
     * @returns The updated Distribution of that Id
     * @throws Error if the distribution is not found or if the distribution type is not handled
     */
    async update(id, data) {
        try {
            const distribution = await Distribution.findById(id);

            if (distribution.distributionType !== data.distributionType) {
                await this.delete(id);
                return await this.create(data.distributionType, data);
            }

            switch (distribution.distributionType) {
                case "FIXED_AMOUNT":
                case "FIXED_PERCENTAGE":
                    return await FixedDistribution.findByIdAndUpdate(id, data, { new: true });

                case "UNIFORM_AMOUNT":
                case "UNIFORM_PERCENTAGE":
                    return await UniformDistribution.findByIdAndUpdate(id, data, { new: true });

                case "NORMAL_AMOUNT":
                case "NORMAL_PERCENTAGE":
                    return await NormalDistribution.findByIdAndUpdate(id, data, { new: true });

                default:
                    throw new Error("Unhandled distribution type");
            }
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function delete the distribution of the given Id
     * @param {mongoose.Types.ObjectId} id 
     *      The Id of the distribution to be deleted
     * @returns The deleted distribution
     * @throws Error if the distribution is not found
     */
    async delete(id) {
        if (id === undefined || id === null) {
            return null;
        }
        try {
            return await Distribution.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}