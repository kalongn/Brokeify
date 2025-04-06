import mongoose from "mongoose";
import { InvestmentType } from "../models/Investment.js";
import InvestmentController from "./InvestmentController.js";
import DistributionController from "./DistributionController.js";

/**
 * Controller for InvestmentType, Support CRUD operations for InvestmentType Class
 */
export default class InvestmentTypeController {
    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * Create a new InvestmentType with the given data
     * @param InvestmentType data 
     * @returns the newly created InvestmentType
     * @throws Error
     *      Throws error if any error occurs
     */
    async create(data) {
        try {
            const investmentType = new InvestmentType(data);
            await investmentType.save();
            return investmentType;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads all InvestmentTypes
     * @returns all InvestmentTypes
     * @throws Error
     *      Throws error if any error occurs
     */
    async readAll() {
        try {
            return await InvestmentType.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function find a InvestmentType with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns a InvestmentType with the given id
     * @throws Error
     *      Throws error if the InvestmentType is not found or if any error occurs
     */
    async read(id) {
        try {
            return await InvestmentType.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    
    async readWithPopulate(id) {
        try {
            return await InvestmentType.findById(id).populate("expectedAnnualReturnDistribution expectedAnnualIncomeDistribution investments");
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function updates the InvestmentType with the given id with the given data
     * @param {mongoose.Types.ObjectId} id 
     * @param {InvestmentType} data 
     * @returns 
     *      The updated InvestmentType
     * @throws Error
     *      Throws error if the InvestmentType is not found or if any error occurs
     */
    async update(id, data) {
        try {
            return await InvestmentType.findByIdAndUpdate(id, data, { new: true });
        }
        catch (error) {
            throw new Error(error);
        }
    }
    /**
     * This function deletes the InvestmentType with the given id
     * @param {mongoose.Types.ObjectId} id 
     * @returns 
     *      Returns the deleted InvestmentType
     * @throws Error
     *      Throws error if the InvestmentType is not found or if any error occurs
     */
    async shallowDelete(id) {
        try {
            return await InvestmentType.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    /**
     * This function deletes the InvestmentType with
     * the given id and also deletes the associated distributions
     * @param {mongoose.Types.ObjectId} id 
     *      The id of the InvestmentType to be deleted
     * @returns 
     *      The deleted InvestmentType
     * @throws Error
     *      Throws error if the InvestmentType is not found or if any error occurs
     */
    async delete(id) {
        try {
            const deleteInvestmentType = await InvestmentType.findById(id);
            const distributionController = new DistributionController();
            const investmentController = new InvestmentController();

            await distributionController.delete(deleteInvestmentType.expectedAnnualReturnDistribution);
            await distributionController.delete(deleteInvestmentType.expectedAnnualIncomeDistribution);
            for (const investment of deleteInvestmentType.investments) {
                await investmentController.delete(investment);
            }
            return await InvestmentType.deleteOne({ _id: id });
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async clone(id) {
        try {
            const type = await InvestmentType.findById(id);
            const clonedType = await this.create({
                name: type.name,
                description: type.description,
                expectedAnnualReturn: type.expectedAnnualReturn,
                expectedAnnualReturnDistribution: type.expectedAnnualReturnDistribution,
                expenseRatio: type.expenseRatio,
                expectedAnnualIncome: type.expectedAnnualIncome,
                expectedAnnualIncomeDistribution: type.expectedAnnualIncomeDistribution,
                taxability: type.taxability,
                investments: type.investments,
            });
            return clonedType.id;

        } catch (err) {
            throw new Error(err);
        }
    }
}