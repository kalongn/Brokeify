import mongoose from "mongoose";

const RunSchema = new mongoose.Schema({
    simulations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', required: true }]
});

RunSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

RunSchema.set('toJSON', {
    virtuals: true,
});

RunSchema.set('toObject', {
    virtuals: true,
});

export default mongoose.model('Run', RunSchema);
