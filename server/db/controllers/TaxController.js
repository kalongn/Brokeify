import mongoose from "mongoose";
import { Tax, FederalIncomeTax, StateIncomeTax, FederalStandardDeduction, StateStandardDeduction, CapitalGainTax } from "../models/Tax.js";

/**
 * @typedef { 'FEDERAL_INCOME' | 'CAPITAL_GAIN' | 'FEDERAL_STANDARD_REDUCTION'| 'EARLY_WITHDRAWAL'| 'STATE_INCOME'| } TAX_TYPE 
 */

/**
 * Controller for Tax, Support CRUD operations for Tax Class
 */
export default class TaxController {

    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new Tax with the given data and taxType
     * @param {TAX_TYPE} taxType 
     *      Type of tax to be created
     * @param {Tax} data 
     *      Data for the tax, check Tax.js for the data structure for each respective tax type
     * @returns 
     *      Returns the created Tax
     * @throws Error
     *      ˝Throws error if any error occurs or if the tax type is not handled
     */
    async create(taxType, data) {
        try {
            let tax;
            switch (taxType) {
                case "FEDERAL_INCOME":
                    tax = new FederalIncomeTax({ taxType, ...data });
                    break;

                case "STATE_INCOME":
                    tax = new StateIncomeTax({ taxType, ...data });
                    break;

                case "FEDERAL_STANDARD":
                    tax = new FederalStandardDeduction({ taxType, ...data });
                    break;

                case "STATE_STANDARD":
                    tax = new StateStandardDeduction({ taxType, ...data });
                    break;

                case "CAPITAL_GAIN":
                    tax = new CapitalGainTax({ taxType, ...data });
                    break;

                default:
                    throw new Error("Unhandled tax type");
            }
            await tax.save();
            return tax;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    // no read, readAll, delete function as not needed, as we will attach these values to the user object / global User (aka a dummy User) object
    /**
     * This function reads all Taxes
     * @returns 
     *      Returns all Taxes
     * @throws Error
     *      Throws error if any error occurs
     */
    async readAll() {
        try {
            return await Tax.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }


    /**
     * This function reads a Tax with the given id
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Tax to be read
     * @returns 
     *      Returns the Tax with the given id
     */
    async read(id) {
        try {
            return await Tax.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    /**
     * This function update a Tax with the given id and data
     * @param {mongoose.Types.ObjectId} id 
     *      Id of the Tax to be read
     * @param {Tax} data 
     *      Data for the tax, check Tax.js for the data structure for each respective tax type
     * @returns 
     *      Returns the updated Tax
     * @throws Error
     *      Throws error if the Tax is not found or if any error occurs
     */
    async update(id, data) {
        try {
            const tax = await Tax.findById(id);
            switch (tax.taxType) {
                case "FEDERAL_INCOME":
                    return await FederalIncomeTax.findByIdAndUpdate(id, data, {
                        new: true
                    });
                case "STATE_INCOME":
                    return await StateIncomeTax.findByIdAndUpdate
                        (id, data, {
                            new: true
                        });
                case "FEDERAL_STANDARD":
                    return await FederalStandardDeduction.findByIdAndUpdate
                        (id, data, {
                            new: true
                        });
                case "STATE_STANDARD":
                    return await StateStandardDeduction.findByIdAndUpdate
                        (id, data, {
                            new: true
                        });
                case "CAPITAL_GAIN":
                    return await CapitalGainTax.findByIdAndUpdate
                        (id, data, {
                            new: true
                        });
                default:
                    throw new Error("Unhandled tax type");
            }
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async delete(id) {
        try {
            return await Tax.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}