// models/gateModel.js
import mongoose from 'mongoose';

const gateSchema = new mongoose.Schema(
    {
        macAddress: { type: String, required: true, unique: true },
        name: { type: String, required: true, default: 'Unassigned Gate' },
        location: { type: String, default: 'N/A' },
        activeEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            default: null,
        },
        mode: {
            type: String,
            enum: ['activation', 'validation', 'cloner'],
            default: 'validation',
        },
        status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    },
    { timestamps: true }
);

const Gate = mongoose.model('Gate', gateSchema);

export default Gate; // Changed from module.exports