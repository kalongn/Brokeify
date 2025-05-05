import mongoose from 'mongoose';

import { PERMISSION } from './Enums.js';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, default: 'Guest' },
    lastName: { type: String, default: 'Guest' },
    email: { type: String, unique: true, sparse: true, default: undefined },
    googleId: { type: String, unique: true, sparse: true, default: undefined },
    picture: { type: String },
    refreshToken: { type: String },
    accessToken: { type: String },
    permission: { type: String, enum: PERMISSION, default: 'GUEST' },
    lastLogin: { type: Date, default: Date.now },
    ownerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    editorScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    viewerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    userSpecificTaxes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tax' }],
    isRunningSimulation: { type: Boolean, default: false },
    previousSimulation: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', default: null },
});

export default mongoose.model('User', UserSchema);