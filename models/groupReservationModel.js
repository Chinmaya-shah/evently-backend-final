// models/groupReservationModel.js

import mongoose from 'mongoose';

const groupReservationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Event',
  },
  purchaser: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // The user who initiated the group booking
  },
  status: {
    type: String,
    required: true,
    enum: [
      'pending',   // The reservation is active and waiting for responses or expiry
      'completed', // The reservation has been finalized (payment processed)
      'failed',    // Payment failed at the end of the timer
      'cancelled', // The purchaser cancelled the entire reservation
    ],
    default: 'pending',
  },
  expiresAt: {
    type: Date,
    required: true, // The timestamp when this reservation should be finalized
  },
}, {
  timestamps: true,
});

const GroupReservation = mongoose.model('GroupReservation', groupReservationSchema);

export default GroupReservation;