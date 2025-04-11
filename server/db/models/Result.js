import mongoose from "mongoose";
import { RETURN_STATUS } from "./Enums.js";
const YearlyResultSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    inflationRate: { type: Number, required: true },
    investmentValues: [{ name: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true }, values: { type: Number, required: true } }],
    incomeByEvent: [{ name: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, values: { type: Number, required: true } }],
    totalIncome: { type: Number, required: true },
    totalExpense: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    earlyWithdrawalTax: { type: Number, required: true },
    totalDiscretionaryExpenses: { type: Number, required: true }, // acutal / desired
    isViolated: { type: Boolean, required: true },
});

const ResultSchema = new mongoose.Schema({
    resultStatus: {type: String, enum: RETURN_STATUS},
    yearlyResults: [{ type: YearlyResultSchema, required: true }]
});

const Result = mongoose.model('Result', ResultSchema);

export default Result;