import mongoose from "mongoose";

import { TAX_TYPE, FILING_STATUS } from "./Enums.js";

const TaxOptions = { discriminatorKey: 'type', collection: 'taxes' };


const TaxBracketSchema = new mongoose.Schema({
    lowerBound: { type: Number, required: true },
    upperBound: { type: Number, required: true },
    rate: { type: Number, required: true }
}, TaxOptions);

const TaxSchema = new mongoose.Schema({
    taxType: { type: String, enum: TAX_TYPE, required: true },
    filingStatus: { type: String, enum: FILING_STATUS, required: true },
    dateCreated: {
        type: String,
        default: () => {
            const date = new Date();
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }
    },
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

const FederalIncomeTaxSchema = new mongoose.Schema({
    taxBrackets: [{ type: TaxBracketSchema, required: true }]
});

const StateIncomeTaxSchema = new mongoose.Schema({
    state: { type: String, required: true },
    taxBrackets: [{ type: TaxBracketSchema, required: true }]
});

const FederalStandardDeductionSchema = new mongoose.Schema({
    standardDeduction: { type: Number, required: true }
});

const StateStandardDeductionSchema = new mongoose.Schema({
    state: { type: String, required: true },
    standardDeduction: { type: Number, required: true }
});

const CapitalGainTaxSchema = new mongoose.Schema({
    taxBrackets: [{ type: TaxBracketSchema, required: true }]
});

const Tax = mongoose.model('Tax', TaxSchema);
const FederalIncomeTax = Tax.discriminator('FederalIncomeTax', FederalIncomeTaxSchema);
const StateIncomeTax = Tax.discriminator('StateIncomeTax', StateIncomeTaxSchema);
const FederalStandardDeduction = Tax.discriminator('FederalStandardDeduction', FederalStandardDeductionSchema);
const StateStandardDeduction = Tax.discriminator('StateStandardDeduction', StateStandardDeductionSchema);
const CapitalGainTax = Tax.discriminator('CapitalGainTax', CapitalGainTaxSchema);

export { Tax, FederalIncomeTax, StateIncomeTax, FederalStandardDeduction, StateStandardDeduction, CapitalGainTax };
