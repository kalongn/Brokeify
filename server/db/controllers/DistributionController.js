import { FixedDistribution, UniformDistribution, NormalDistribution, MarkovDistribution } from "../models/Distribution.js";

export default class DistributionController {
    constructor() { }


    async create(distributionType, data) {
        console.log(distributionType, data);
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
}
