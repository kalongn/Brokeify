import mongoose from "mongoose";

const SimulationSchema = new mongoose.Schema({
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
    results: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Result' }],
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

const Simulation = mongoose.model('Simulation', SimulationSchema);

export default Simulation;