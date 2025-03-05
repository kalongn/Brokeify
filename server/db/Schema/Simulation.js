import mongoose from "mongoose";

const SimulationSchema = new mongoose.Schema({
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
    result: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
});

SimulationSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});

SimulationSchema.set('toJSON', {
    virtuals: true,
});

SimulationSchema.set('toObject', {
    virtuals: true,
});

export default mongoose.model('Simulation', SimulationSchema);