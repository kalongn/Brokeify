import mongoose from 'mongoose';

import { PERMISSION } from './Enums.js';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, default: 'Guest' },
    lastName: { type: String, default: 'Guest' },
    email: { type: String, unique: true, sparsed: true },
    googleId: { type: String, unique: true, sparsed: true },
    picture: { type: String },
    refreshToken: { type: String },
    accessToken: { type: String },
    permission: { type: String, enum: PERMISSION, default: 'GUEST' },
    ownerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    editorScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    viewerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    userSpecificTaxes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tax' }],
    userSimulations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' }],
});

export default mongoose.model('User', UserSchema);