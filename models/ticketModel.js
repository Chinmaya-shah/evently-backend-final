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
    type: String,
    // Populated after minting
  },
  // --- NEW FIELD: PROOF OF PURCHASE ---
  mintingTxHash: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    required: true,
    enum: [
      'pending_payment',
      'pending_acceptance',
      'accepted',
      'declined',
      'confirmed',
      'used',
      'expired',
      'cancelled'
    ],
    default: 'confirmed',
  },
  groupReservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupReservation',
  },
}, {
  timestamps: true,
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;