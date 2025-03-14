import mongoose from "mongoose";

const RMDTableSchema = new mongoose.Schema({
    ages: [{ type: Number, required: true }],
    distributionPeriods: [{ type: Number, required: true }]
});

RMDTableSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

RMDTableSchema.set('toJSON', {
    virtuals: true,
});

RMDTableSchema.set('toObject', {
    virtuals: true,
});

const RMDTable = mongoose.model('RMDTable', RMDTableSchema);

export default RMDTable;