import mongoose from "mongoose";

import { TAX_STATUS } from "./Enums.js";

const InvestmentTypeSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    expectedAnnualReturn: { type: Number },
    expectedAnnualReturnDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    expenseRatio: { type: Number },
    expectedAnnualIncome: { type: Number },
    expectedAnnualIncomeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    taxability: { type: Boolean },
    investments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }]
});

const InvestmentSchema = new mongoose.Schema({
    value: { type: Number },
    taxStatus: { type: String, enum: TAX_STATUS }
});

const InvestmentType = mongoose.model('InvestmentType', InvestmentTypeSchema);
const Investment = mongoose.model('Investment', InvestmentSchema);

export { InvestmentType, Investment };