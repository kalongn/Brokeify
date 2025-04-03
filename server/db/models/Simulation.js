import mongoose from "mongoose";

const SimulationSchema = new mongoose.Schema({
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
    results: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Result' }],
});

const Simulation = mongoose.model('Simulation', SimulationSchema);

export default Simulation;