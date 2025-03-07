import mongoose from "mongoose";

import { FILING_STATUS } from "./Enums";

const ScenarioSchema = new mongoose.Schema({
    name: { type: String },
    filingStatus: { type: String, enum: FILING_STATUS },
    userBirthYear: { type: Number },
    spouseBirthYear: { type: Number },
    userLifeExpectancy: { type: Number },
    spouseLifeExpectancy: { type: Number },
    investmentsType: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentType' }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    inflationAssumption: { type: Number },
    inflationAssumptionDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    annualPreTaxContributionLimit: { type: Number },
    annualPostTaxContributionLimit: { type: Number },
    financialGoal: { type: Number },
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
