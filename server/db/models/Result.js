import mongoose from "mongoose";
import { RETURN_STATUS } from "./Enums.js";
const YearlyResultSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    inflationRate: { type: Number, required: true },
    cumulativeInflation: { type: Number, required: true },
    investmentValues: [{ name: { type: String, required: true }, value: { type: Number, required: true } }],
    incomeByEvent: [{ name: { type: String, required: true }, value: { type: Number, required: true } }],
    expenseByEvent: [{ name: { type: String, required: true }, value: { type: Number, required: true } }],
    totalIncome: { type: Number, required: true },
    totalExpense: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    earlyWithdrawalTax: { type: Number, required: true },
    totalDiscretionaryExpenses: { type: Number, required: true }, // acutal / desired
    isViolated: { type: Boolean, required: true },
    step1: {type: Number, requires: false}, //for 1/2d exploration
    step2: {type: Number, requires: false}, //for 2d exploration
});

const ResultSchema = new mongoose.Schema({
    resultStatus: {type: String, enum: RETURN_STATUS},
    yearlyResults: [{ type: YearlyResultSchema, required: true }]
});

const Result = mongoose.model('Result', ResultSchema);

export default Result;