import mongoose from "mongoose";

import { DISTRIBUTION_TYPE } from "./Enums";

const options = { discriminatorKey: 'type', collection: 'distributions' };

const DistributionSchema = new mongoose.Schema({
    distributionType: { type: String, enum: DISTRIBUTION_TYPE, required: true },
}, options);

DistributionSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

DistributionSchema.set('toJSON', {
    virtuals: true,
});

DistributionSchema.set('toObject', {
    virtuals: true,
});

const Distribution = mongoose.model('Distribution', DistributionSchema);

const FixedDistributionSchema = new mongoose.Schema({
    value: { Number }
});
const FixedDistribution = Distribution.discriminator('FixedDistribution', FixedDistributionSchema);

const UniformDistributionSchema = new mongoose.Schema({
    lowerBound: { Number },
    upperBound: { Number }
});
const UniformDistribution = Distribution.discriminator('UniformDistribution', UniformDistributionSchema);

const NormalDistributionSchema = new mongoose.Schema({
    mean: { Number },
    standardDeviation: { Number }
});
const NormalDistribution = Distribution.discriminator('NormalDistribution', NormalDistributionSchema);

const MarkovDistributionSchema = new mongoose.Schema({
    initialValue: { Number },
    driftMu: { Number },
    volatileSigma: { Number },
    timeStepDeltaT: { Number },
    randomEpsilon: { type: mongoose.Schema.Types.ObjectId, ref: 'NormalDistribution' }
});
const MarkovDistribution = Distribution.discriminator('MarkovDistribution', MarkovDistributionSchema);

export default { FixedDistribution, UniformDistribution, NormalDistribution, MarkovDistribution };
