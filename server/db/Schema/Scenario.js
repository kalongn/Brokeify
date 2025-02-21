import mongoose from "mongoose";

import { FILING_STATUS } from "./Enums";

const ScenarioSchema = new mongoose.Schema({
    name: { type: String, required: true },
    filingStatus: { type: String, enum: FILING_STATUS, required: true },
    userBirthYear: { type: Number, required: true },
    spouseBirthYear: { type: Number },
    userLifeExpectancy: { type: Number, required: true },
    spouseLifeExpectancy: { type: Number },
    investments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    inflationAssumption: { type: Number, required: true },
    inflationAssumptionDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution', required: true },
    annualPreTaxContributionLimit: { type: Number, required: true },
    annualPostTaxContributionLimit: { type: Number, required: true },
    financialGoal: { type: Number, required: true },
    orderedSpendingStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    orderedExpenseWithdrawalStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    orderedRMDStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    orderedRothStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    startYearRothOptimizer: { type: Number },
    endYearRothOptimizer: { type: Number }
});

ScenarioSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});
ScenarioSchema.set('toJSON', {
    virtuals: true,
});
ScenarioSchema.set('toObject', {
    virtuals: true,
});

export default mongoose.model('Scenario', ScenarioSchema);
