import mongoose from "mongoose";

import { EVENT_TYPE, ASSET_ALLOCATION_TYPE, TAX_STATUS } from "./Enums.js";

// Default Event Interface
const EventOptions = { discriminatorKey: 'type', collection: 'events' };

const EventSchema = new mongoose.Schema({
    eventType: { type: String, enum: EVENT_TYPE, required: true },
    name: { type: String },
    description: { type: String, },
    duration: { type: Number },
    durationTypeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    startYear: { type: Number },
    startYearTypeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    startsWith: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    startsAfter: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
}, EventOptions);

const Event = mongoose.model('Event', EventSchema);

const RebalanceSchema = new mongoose.Schema({
    assetAllocationType: { type: String, enum: ASSET_ALLOCATION_TYPE },
    percentageAllocations: [[{ type: Number }]], // Glide Path use [[Before, After], [Before, After], ...], Fixed use [[Percentage], [Percentage], ....]
    allocatedInvestments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    taxStatus: { type: String, enum: TAX_STATUS }
});

const InvestSchema = new mongoose.Schema({
    assetAllocationType: { type: String, enum: ASSET_ALLOCATION_TYPE },
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
    userContributions: { type: Number, default: 1 },
    isSocialSecurity: { type: Boolean },
});

const ExpenseSchema = new mongoose.Schema({
    amount: { type: Number },
    expectedAnnualChange: { type: Number },
    expectedAnnualChangeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    isinflationAdjusted: { type: Boolean },
    userContributions: { type: Number, default: 1 },
    isDiscretionary: { type: Boolean },
});

const Income = Event.discriminator('Income', IncomeSchema);
const Expense = Event.discriminator('Expense', ExpenseSchema);

export { Event, Rebalance, Invest, Income, Expense };