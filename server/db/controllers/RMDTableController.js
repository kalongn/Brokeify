import mongoose from "mongoose";
import RMDTable from "../models/RMDTable.js";

// TODO: This class is incomplete and will need to be completed later on once we figure out how many RMD table we actually need.

/**
 * Controller for RMDTable, Support CRUD operations for RMDTable Class, DO NOT USE THIS CLASS YET
 */
export default class RMDTableController {
    constructor() { }

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

    async readAll() {
        try {
            return await RMDTable.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async read(id) {
        try {
            return await RMDTable.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async update(id, data) {
        try {
            return await RMDTable.findByIdAndUpdate(id, data, {
                new: true
            });
        }
        catch (error) {
            throw new Error(error);
        }

    }
}