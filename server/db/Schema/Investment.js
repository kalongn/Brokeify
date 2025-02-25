import mongoose from "mongoose";

import { TAX_STATUS } from "./Enums";

const InvestmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    value: { type: Number, required: true },
    investmentType: { type: String, required: true },
    expectedAnnualReturn: { type: Number, required: true },
    expectedAnnualReturnDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution', required: true },
    expenseRatio: { type: Number, required: true },
    expectedAnnualIncome: { type: Number, required: true },
    expectedAnnualIncomeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution', required: true },
    taxability: { type: Boolean, required: true },
    taxStatus: { type: String, enum: TAX_STATUS, required: true }
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

export default mongoose.model('Investment', InvestmentSchema);