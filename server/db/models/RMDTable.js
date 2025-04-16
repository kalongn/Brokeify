import mongoose from "mongoose";

const RMDTableSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    ages: [{ type: Number, required: true }],
    distributionPeriods: [{ type: Number, required: true }]
});

const RMDTable = mongoose.model('RMDTable', RMDTableSchema);

export default RMDTable;