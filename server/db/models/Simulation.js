import mongoose from "mongoose";
import { SIMULATION_TYPE, EXPLORATION_TYPE } from "./Enums.js";
const SimulationSchema = new mongoose.Schema({
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
    results: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Result' }],
    simulationType: { type: String, enum: SIMULATION_TYPE, required: true },
    paramOneType: { type: String, enum: EXPLORATION_TYPE, default: undefined  },
    paramTwoType: { type: String, enum: EXPLORATION_TYPE, default: undefined },
    paramOne: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    paramTwo: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
});

const Simulation = mongoose.model('Simulation', SimulationSchema);

export default Simulation;