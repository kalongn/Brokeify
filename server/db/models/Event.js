import mongoose from "mongoose";

import { EVENT_TYPE, ASSET_ALLOCATION_TYPE, TAX_STATUS } from "./Enums.js";

// Default Event Interface
const EventOptions = { discriminatorKey: 'type', collection: 'events' };

const EventSchema = new mongoose.Schema({
    eventType: { type: String, enum: EVENT_TYPE, required: true },
    name: { type: String },
    description: { type: String, },
    startYear: { type: Number },
    startYearTypeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    duration: { type: Number },
    durationTypeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    startsWith: { type: mongoose.Schema.Types.ObjectId, ref: 'startsWith' },
    startsAfter: { type: mongoose.Schema.Types.ObjectId, ref: 'startsAfter' },
}, EventOptions);

const Event = mongoose.model('Event', EventSchema);

const RebalanceSchema = new mongoose.Schema({
    assetAllocationType: { type: String, enum: ASSET_ALLOCATION_TYPE, required: true },
    percentageAllocations: [[{ type: Number }]], // Glide Path use [[Before, After], [Before, After], ...], Fixed use [[Percentage], [Percentage], ....]
    allocatedInvestments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    maximumCash: { type: Number, default: 0 },
    taxStatus: { type: String, enum: TAX_STATUS }
});

const InvestSchema = new mongoose.Schema({
    assetAllocationType: { type: String, enum: ASSET_ALLOCATION_TYPE, required: true },
    percentageAllocations: [[{ type: Number }]], // Glide Path use [[Before, After], [Before, After], ...], Fixed use [[Percentage], [Percentage], ....]
    allocatedInvestments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    maximumCash: { type: Number, default: 0 },
});

const Rebalance = Event.discriminator('Rebalance', RebalanceSchema);
const Invest = Event.discriminator('Invests', InvestSchema);

const IncomeSchema = new mongoose.Schema({
    amount: { type: Number },
    expectedAnnualChange: { type: Number },
    expectedAnnualChangeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    isinflationAdjusted: { type: Boolean },
    userContributions: { type: Number, default: 100 },
    spouseContributions: { type: Number, default: 0 },
    isSocialSecurity: { type: Boolean },
});

const ExpenseSchema = new mongoose.Schema({
    amount: { type: Number },
    expectedAnnualChange: { type: Number },
    expectedAnnualChangeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    isinflationAdjusted: { type: Boolean },
    userContributions: { type: Number, default: 100 },
    spouseContributions: { type: Number, default: 0 },
    isDiscretionary: { type: Boolean },
});

const Income = Event.discriminator('Income', IncomeSchema);
const Expense = Event.discriminator('Expense', ExpenseSchema);

export { Event, Rebalance, Invest, Income, Expense };