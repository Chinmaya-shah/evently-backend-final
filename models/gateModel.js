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

        // --- NEW FIELD: HEARTBEAT ---
        lastSeen: { type: Date, default: Date.now },

        // --- NEW FIELD: REMOTE LOGS ---
        // Stores the last 50 logs from the device so Admin can see history
        logs: [{
            message: String,
            type: { type: String, enum: ['info', 'success', 'error'], default: 'info' },
            timestamp: { type: Date, default: Date.now }
        }],

        pendingJob: {
            type: {
                command: String,
                payload: String,
            },
            default: null
        }
    },
    { timestamps: true }
);

const Gate = mongoose.model('Gate', gateSchema);

export default Gate;