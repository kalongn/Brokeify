import mongoose from "mongoose";

import { FILING_STATUS } from "./Enums.js";

const ScenarioSchema = new mongoose.Schema({
    name: { type: String },
    filingStatus: { type: String, enum: FILING_STATUS },
    userBirthYear: { type: Number },
    spouseBirthYear: { type: Number },
    userLifeExpectancy: { type: Number },
    userLifeExpectancyDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    spouseLifeExpectancy: { type: Number },
    spouseLifeExpectancyDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    stateOfResidence: { type: String },
    investmentTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentType' }],
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

const Scenario = mongoose.model('Scenario', ScenarioSchema);

export default Scenario;
