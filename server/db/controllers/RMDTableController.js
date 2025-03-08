import RMDTable from "../models/RMDTable.js";

/**
 * Controller for RMDTable, Support CRUD operations for RMDTable Class, DO NOT USE THIS CLASS YET
 */
export default class RMDTableController {
    /**
     * Constructor (empty)
     */
    constructor() { }

    /**
     * This function creates a new RMDTable with the given data
     * @param {RMDTable} data 
     * @returns 
     *      Returns the created RMDTable
     * @throws Error
     *      Throws error if any error occurs
     */
    async create(data) {
        try {
            const rmdTable = new RMDTable(data);
            await rmdTable.save();
            return rmdTable;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function reads the RMDTable (we are assuming there's only one here since it is always up to date with the current one)
     * @returns 
     *      Returns the RMDTable
     * @throws Error
     *      Throws error if any error occurs
     */
    async read() {
        try {
            return await RMDTable.findOne();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    /**
     * This function updates the RMDTable with the given data (realistically this should run with a script that updates the RMDTable every year)
     * @param {RMDTable} data 
     * @returns 
     *      Returns the updated RMDTable
     * @throws Error
     *     Throws error if RMDTable not found or if any error occurs
     */
    async update(data) {
        try {
            const rmdTable = await RMDTable.findOne();
            if (!rmdTable) {
                throw new Error("RMDTable not found");
            }
            rmdTable.update(data);
            await rmdTable.save();
            return rmdTable;
        }
        catch (error) {
            throw new Error(error);
        }
    }
}