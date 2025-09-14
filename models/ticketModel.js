// models/ticketModel.js

import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Event', // This links the ticket to a specific event
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // This links the ticket to a specific user
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  nftTokenId: {
    type: String,
    // This is no longer required on creation, as it's only set after payment.
  },
  // --- THIS IS THE CRITICAL CHANGE ---
  // We replace 'isCheckedIn' with a more detailed status field.
  status: {
    type: String,
    required: true,
    // These are the possible stages in a ticket's life
    enum: [
      'pending_acceptance', // Invitation sent, waiting for friend's response
      'accepted',           // Friend accepted, waiting for payment finalization
      'declined',           // Friend declined the invitation
      'confirmed',          // Payment finalized, ticket is valid for entry
      'used',               // Attendee has checked in at the event
      'expired',            // Invitation was not answered in time
    ],
    default: 'confirmed', // A regular, single purchase defaults to confirmed
  },
  // This new field will link a ticket to its parent group reservation
  groupReservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupReservation',
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;