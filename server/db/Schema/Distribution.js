import mongoose from "mongoose";

const options = { discriminatorKey: 'type', collection: 'distributions' };

const DistributionSchema = new mongoose.Schema({
    distributionType: { type: String, enum: ['FIXED_AMOUNT', 'FIXED_PERCENTAGE', 'UNIFORM_AMOUNT', 'UNIFORM_PERCENTAGE', 'NORMAL_AMOUNT', 'NORMAL_PERCENTAGE', 'MARKOV_PERCENTAGE'], required: true },
    percentile: { Number } // this probably will be modified
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
    randomEpsilon: { type: Schema.Types.ObjectId, ref: 'NormalDistribution' }
});
const MarkovDistribution = Distribution.discriminator('MarkovDistribution', MarkovDistributionSchema);

export default { Distribution, FixedDistribution, UniformDistribution, NormalDistribution, MarkovDistribution };
