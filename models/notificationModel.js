// models/notificationModel.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: { // e.g., /events/[eventId] or /my-tickets
        type: String,
    },
    type: {
        type: String,
        enum: ['invitation', 'event_update', 'new_event', 'general'],
        default: 'general',
    }
}, {
    timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;