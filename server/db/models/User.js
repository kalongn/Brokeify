import mongoose from 'mongoose';

import { PERMISSION } from './Enums.js';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, default: 'John', },
    lastName: { type: String, default: 'Doe', },
    email: { type: String, unique: true, default: '', },
    googleId: { type: String, unique: true, default: '', },
    picture: { type: String, default: '', },
    refreshToken: { type: String, default: '', },
    accessToken: { type: String, default: '', },
    permission: { type: String, enum: PERMISSION, default: 'GUEST' },
    ownerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    editorScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    viewerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    userSpecificTaxes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tax' }],
    userSimulations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' }],
});

export default mongoose.model('User', UserSchema);