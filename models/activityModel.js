// models/activityModel.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['event', 'ticket', 'payment'],
    },
    link: { // Optional link to the specific event or ticket
        type: String,
    },
}, {
    timestamps: true,
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;