import mongoose from "mongoose";

import { TAX_TYPE, FILING_STATUS } from "./Enums";

const TaxBracketSchema = new mongoose.Schema({
    lowerBound: { type: Number, required: true },
    upperBound: { type: Number, required: true },
    rate: { type: Number, required: true }
});

const TaxSchema = new mongoose.Schema({
    taxType: { type: String, enum: TAX_TYPE, required: true },
    filingStatus: { type: String, enum: FILING_STATUS, required: true },
    taxBrackets: [{ type: TaxBracketSchema, required: true }]
});

TaxSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

TaxSchema.set('toJSON', {
    virtuals: true,
});

TaxSchema.set('toObject', {
    virtuals: true,
});

export default mongoose.model('Tax', TaxSchema);
