import mongoose from "mongoose";

import { EVENT_TYPE, ASSET_ALLOCATION_TYPE, TAX_STATUS } from "./Enums";

// Default Event Interface
const EventOptions = { discriminatorKey: 'type', collection: 'events' };

const EventSchema = new mongoose.Schema({
    eventType: { type: String, enum: EVENT_TYPE, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    startYear: { type: Number, required: true },
    startYearTypeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution', required: true },
    duration: { type: Number, required: true },
    durationTypeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution', required: true },
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
    percentageAllocations: [[{ type: Number, required: true }]], // Glide Path use [[Before, After], [Before, After], ...], Fixed use [[Percentage], [Percentage], ....]
    allocatedInvestments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true }],
    maximumCash: { type: Number, default: 0, required: true },
}, InvestRebalanceEventOptions);

const InvestRebalanceEvent = Event.discriminator('InvestRebalanceEvent', InvestRebalanceEventSchema);

const RebalanceSchema = new mongoose.Schema({
    taxStatus: { type: String, enum: TAX_STATUS, required: true }
});

const Rebalance = InvestRebalanceEvent.discriminator('Rebalance', RebalanceSchema);
const Invest = InvestRebalanceEvent.discriminator('Invest', InvestRebalanceEventSchema);

// IncomeExpenseEvent Interface
const IncomeExpenseEventOptions = { discriminatorKey: 'type', collection: 'events' };
const IncomeExpenseEventSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    expectedAnnualChange: { type: Number, required: true },
    expectedAnnualChangeDistribution: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution', required: true },
    isinflationAdjusted: { type: Boolean, required: true },
    userContributions: { type: Number, default: 100, required: true },
    spouseContributions: { type: Number, default: 0 },
}, IncomeExpenseEventOptions);

const IncomeExpenseEvent = Event.discriminator('IncomeExpenseEvent', IncomeExpenseEventSchema);

const IncomeSchema = new mongoose.Schema({
    isSocialSecurity: { type: Boolean, required: true },
});

const ExpenseSchema = new mongoose.Schema({
    isDiscretionary: { type: Boolean, required: true },
});
const Income = IncomeExpenseEvent.discriminator('Income', IncomeSchema);
const Expense = IncomeExpenseEvent.discriminator('Expense', ExpenseSchema);

export default { Event, InvestRebalanceEvent, Rebalance, Invest, IncomeExpenseEvent, Income, Expense };