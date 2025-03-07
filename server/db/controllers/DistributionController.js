import { Distribution, FixedDistribution, UniformDistribution, NormalDistribution, MarkovDistribution } from "../models/Distribution.js";

export default class DistributionController {
    constructor() { }

    async create(distributionType, data) {
        // console.log(distributionType, data);
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

                case "MARKOV_PERCENTAGE":
                    distribution = new MarkovDistribution({ distributionType, ...data });
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

    async readAll() {
        try {
            return await Distribution.find();
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async read(id) {
        try {
            return await Distribution.findById(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async update(id, data) {
        try {
            const distribution = await Distribution.findById(id);
            switch (distribution.distributionType) {
                case "FIXED_AMOUNT":
                case "FIXED_PERCENTAGE":
                    return await FixedDistribution.findByIdAndUpdate(
                        id,
                        { $set: { ...data } },
                        { new: true }
                    );

                case "UNIFORM_AMOUNT":
                case "UNIFORM_PERCENTAGE":
                    return await UniformDistribution.findByIdAndUpdate(
                        id,
                        { $set: { ...data } },
                        { new: true }
                    );

                case "NORMAL_AMOUNT":
                case "NORMAL_PERCENTAGE":
                    return await NormalDistribution.findByIdAndUpdate(
                        id,
                        { $set: { ...data } },
                        { new: true }
                    );

                case "MARKOV_PERCENTAGE":
                    return await MarkovDistribution.findByIdAndUpdate(
                        id,
                        { $set: { ...data } },
                        { new: true }
                    );

                default:
                    throw new Error("Unhandled distribution type");
            }
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async delete(id) {
        try {
            return await Distribution.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}