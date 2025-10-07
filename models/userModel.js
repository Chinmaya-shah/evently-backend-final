// models/userModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role: {
            type: String,
            required: true,
            enum: ['Attendee', 'Organizer', 'Admin', 'SuperAdmin'],
            default: 'Attendee',
        },
        platformUserId: { type: String, required: true, unique: true, default: () => nanoid(16) },

        // --- THIS IS THE RESTORED KYC OBJECT ---
        kyc: {
            fullName: { type: String, default: '' },
            address: { type: String, default: '' },
            governmentId: { type: String, default: '' },
        },

        // --- THESE ARE OUR NEW SECURITY FIELDS ---
        activeCardUID: {
            type: String,
            unique: true,
            sparse: true,
        },
        isVerified: { type: Boolean, default: false },
        isCardActivated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;