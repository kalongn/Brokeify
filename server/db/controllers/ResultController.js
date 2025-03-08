import Result from "../models/Result.js";

export default class ResultController {

    constructor() { }

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

    async delete(id) {
        try {
            await Result.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}