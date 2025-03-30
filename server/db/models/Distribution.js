import mongoose from "mongoose";

import { DISTRIBUTION_TYPE } from "./Enums.js";

const options = { discriminatorKey: 'type', collection: 'distributions' };

const DistributionSchema = new mongoose.Schema({
    distributionType: { type: String, enum: DISTRIBUTION_TYPE, required: true },
}, options);

const Distribution = mongoose.model('Distribution', DistributionSchema);

const FixedDistributionSchema = new mongoose.Schema({
    value: { type: Number }
});
const FixedDistribution = Distribution.discriminator('FixedDistribution', FixedDistributionSchema);

const UniformDistributionSchema = new mongoose.Schema({
    lowerBound: { type: Number },
    upperBound: { type: Number }
});
const UniformDistribution = Distribution.discriminator('UniformDistribution', UniformDistributionSchema);

const NormalDistributionSchema = new mongoose.Schema({
    mean: { type: Number },
    standardDeviation: { type: Number }
});
const NormalDistribution = Distribution.discriminator('NormalDistribution', NormalDistributionSchema);

export { Distribution, FixedDistribution, UniformDistribution, NormalDistribution };
