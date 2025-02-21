import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true, default: 'John', },
    lastName: { type: String, required: true, default: 'Doe', },

    email: { type: String, required: true, unique: true, default: '', },

    birthYear: { type: Number, required: true, default: 0, },

    googleId: { type: String, required: true, unique: true, default: '', },

    picture: { type: String, required: true, default: '', },

    refreshToken: { type: String, required: true, default: '', },

    accessToken: { type: String, required: true, default: '', },

    permission: { type: String, enum: ['ADMIN', 'USER', 'GUEST'], default: 'GUEST' },

    OwnerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    EditorScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    ViewerScenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }],
    
});

UserSchema.virtual('id').get(function get() {
    return this._id.toHexString();
});
UserSchema.set('toJSON', {
    virtuals: true,
});
UserSchema.set('toObject', {
    virtuals: true,
});

export default mongoose.model('User', UserSchema);