import mongoose from "mongoose";

import { FILING_STATUS } from "./Enums.js";

const ScenarioSchema = new mongoose.Schema({
    name: { type: String, default: "Untitle Scenario" },
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
    annualPostTaxContributionLimit: { type: Number },
    financialGoal: { type: Number },
    orderedSpendingStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    orderedExpenseWithdrawalStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    orderedRMDStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    orderedRothStrategy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    startYearRothOptimizer: { type: Number, default: undefined },
    endYearRothOptimizer: { type: Number },
    ownerFirstName: { type: String },
    ownerLastName: { type: String },
    ownerEmail: { type: String },
    editorEmails: [{ type: String }],
    viewerEmails: [{ type: String }],
    isSimulationReady: { type: Boolean, default: false },
    dateCreated: {
        type: String,
        default: () => {
            const date = new Date();
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        }
    },
});

const Scenario = mongoose.model('Scenario', ScenarioSchema);

export default Scenario;
