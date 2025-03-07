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
});

InvestmentTypeSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});
InvestmentTypeSchema.set('toJSON', {
    virtuals: true,
});
InvestmentTypeSchema.set('toObject', {
    virtuals: true,
});

const InvestmentSchema = new mongoose.Schema({
    value: { type: Number },
    investmentType: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentType', required: true },
    taxStatus: { type: String, enum: TAX_STATUS }
});

InvestmentSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

InvestmentSchema.set('toJSON', {
    virtuals: true,
});
InvestmentSchema.set('toObject', {
    virtuals: true,
});

const InvestmentType = mongoose.model('InvestmentType', InvestmentTypeSchema);


const Investment = mongoose.model('Investment', InvestmentSchema);

export { InvestmentType, Investment };