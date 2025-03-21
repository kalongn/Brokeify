import mongoose from "mongoose";

const YearlyResultSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    investmentValues: [{ name: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true }, values: { type: Number, required: true } }],
    incomeByEvent :  [{ name: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, values: { type: Number, required: true } }],
    totalIncome: { type: Number, required: true },
    totalExpense: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    earlyWithdrawalTax: { type: Number, required: true },
    totalDiscretionaryExpenses: { type: Number, required: true }, // acutal / desired
    isViolated: { type: Boolean, required: true },
});

const ResultSchema = new mongoose.Schema({
    yearlyResults: [{ type: YearlyResultSchema, required: true }]
});

ResultSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

ResultSchema.set('toJSON', {
    virtuals: true,
});

ResultSchema.set('toObject', {
    virtuals: true,
});

const Result = mongoose.model('Result', ResultSchema);

export default Result;