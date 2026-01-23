// models/eventModel.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    // Only Name is strictly required for a Draft
    name: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    // Everything else is optional (not required) so Drafts can be partial
    description: { type: String },
    date: { type: Date },
    location: { type: String },

    eventImage: { type: String },

    ticketPrice: { type: Number, default: 0 },
    capacity: { type: Number }, // Removed default, can be null
    ticketsSold: { type: Number, default: 0 },

    category: { type: String, default: 'General' },

    status: {
        type: String,
        enum: ['Draft', 'Published', 'Ended'],
        default: 'Draft'
    }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;