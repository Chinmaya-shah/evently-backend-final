// models/gateModel.js

import mongoose from 'mongoose';

const gateSchema = new mongoose.Schema({
    // The unique, permanent hardware address of the ESP32 device
    macAddress: {
        type: String,
        required: true,
        unique: true,
    },
    // A friendly, human-readable name assigned by an Admin
    name: {
        type: String,
        required: true,
        default: 'Unassigned Gate',
    },
    // A description of the gate's location
    location: {
        type: String,
        default: 'N/A',
    },
    // The link to the event this gate is currently configured for
    activeEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event', // This links to a document in our 'events' collection
        default: null,
    },
    // The current status of the gate
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline',
    },
}, {
    timestamps: true,
});

const Gate = mongoose.model('Gate', gateSchema);

export default Gate;