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

        // --- NEW FIELD: REMOTE JOB QUEUE ---
        // If this field has data, the gate knows it has work to do.
        pendingJob: {
            type: {
                command: String, // e.g. 'ACTIVATE_CARD'
                payload: String, // e.g. 'USER_ID_123'
            },
            default: null
        }
    },
    { timestamps: true }
);

const Gate = mongoose.model('Gate', gateSchema);

export default Gate;