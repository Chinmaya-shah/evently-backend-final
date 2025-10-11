// models/eventModel.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    // --- THIS IS THE CRITICAL FIX #1 ---
    // We are REMOVING 'required: true' to make the image optional.
    eventImage: { type: String },

    ticketPrice: { type: Number, required: true, default: 0 },
    capacity: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Published', 'Ended'], default: 'Draft' }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;