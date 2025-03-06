import mongoose from "mongoose";

import { EVENT_TYPE, ASSET_ALLOCATION_TYPE, TAX_STATUS } from "./Enums";

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
}, EventOptions);

EventSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

EventSchema.set('toJSON', {
    virtuals: true,
});

EventSchema.set('toObject', {
    virtuals: true,
});

const Event = mongoose.model('Event', EventSchema);


// InvestRebalanceEvent Interface
const InvestRebalanceEventOptions = { discriminatorKey: 'type', collection: 'events' };

const InvestRebalanceEventSchema = new mongoose.Schema({
    assetAllocationType: { type: String, enum: ASSET_ALLOCATION_TYPE, required: true },
    percentageAllocations: [[{ type: Number }]], // Glide Path use [[Before, After], [Before, After], ...], Fixed use [[Percentage], [Percentage], ....]
    allocatedInvestments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment' }],
    maximumCash: { type: Number, default: 0 },
}, InvestRebalanceEventOptions);

const InvestRebalanceEvent = Event.discriminator('InvestRebalanceEvent', InvestRebalanceEventSchema);

const RebalanceSchema = new mongoose.Schema({
    taxStatus: { type: String, enum: TAX_STATUS }
});

const Rebalance = InvestRebalanceEvent.discriminator('Rebalance', RebalanceSchema);
const Invest = InvestRebalanceEvent.discriminator('Invest', InvestRebalanceEventSchema);

// IncomeExpenseEvent Interface
const IncomeExpenseEventOptions = { discriminatorKey: 'type', collection: 'events' };
const IncomeExpenseEventSchema = new mongoose.Schema({
    amount: { type: Number },
    expectedAnnualChange: { type: Number },
    expectedAnnualChangeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    isinflationAdjusted: { type: Boolean },
    userContributions: { type: Number, default: 100 },
    spouseContributions: { type: Number, default: 0 },
}, IncomeExpenseEventOptions);

const IncomeExpenseEvent = Event.discriminator('IncomeExpenseEvent', IncomeExpenseEventSchema);

const IncomeSchema = new mongoose.Schema({
    isSocialSecurity: { type: Boolean },
});

const ExpenseSchema = new mongoose.Schema({
    isDiscretionary: { type: Boolean },
});
const Income = IncomeExpenseEvent.discriminator('Income', IncomeSchema);
const Expense = IncomeExpenseEvent.discriminator('Expense', ExpenseSchema);

export default { Event, InvestRebalanceEvent, Rebalance, Invest, IncomeExpenseEvent, Income, Expense };