// models/ticketModel.js

import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Event',
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  nftTokenId: {
    type: Number,
    required: true,
    unique: true,
  },
  isCheckedIn: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;