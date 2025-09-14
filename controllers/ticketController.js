// controllers/ticketController.js

import Ticket from '../models/ticketModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import GroupReservation from '../models/groupReservationModel.js'; // <-- 1. IMPORT THE NEW MODEL
import { mintTicket, markAsUsed } from '../services/blockchainService.js';
import { sendPurchaseConfirmationEmail } from '../services/notificationService.js';

// This function for single purchases is now updated to use the new ticket status
export const purchaseTicket = async (req, res) => {
  const { eventId } = req.body;
  const attendeeId = req.user._id;
  try {
    const existingTicket = await Ticket.findOne({ attendee: attendeeId, event: eventId });
    if (existingTicket) {
      return res.status(400).json({ message: 'You have already purchased a ticket for this event.' });
    }
    // ... (rest of the function is the same, but the created ticket will have status 'confirmed' by default)
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const attendee = await User.findById(attendeeId);
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });
    if (event.ticketsSold >= event.capacity) return res.status(400).json({ message: 'Event is sold out' });

    const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8';
    const tokenId = await mintTicket(attendeeWalletAddress);
    const ticket = await Ticket.create({
      event: eventId,
      attendee: attendeeId,
      purchasePrice: event.ticketPrice,
      nftTokenId: tokenId,
      status: 'confirmed', // A direct purchase is immediately confirmed
    });
    event.ticketsSold += 1;
    await event.save();
    sendPurchaseConfirmationEmail(attendee, ticket, event);
    res.status(201).json({ message: 'Ticket purchased and minted successfully!', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error during ticket purchase.' });
  }
};


// --- THIS IS THE NEW INVITATION REQUEST FUNCTION ---
// @desc    Request tickets for a group, creating a pending reservation
// @route   POST /api/tickets/request-group
// @access  Private
export const requestGroupTickets = async (req, res) => {
  const { eventId, attendeeEmails } = req.body;
  const purchaserId = req.user._id;

  if (!attendeeEmails || attendeeEmails.length === 0) {
    return res.status(400).json({ message: 'Attendee emails are required.' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // --- Validation Loop ---
    if ((event.ticketsSold + attendeeEmails.length) > event.capacity) {
      return res.status(400).json({ message: 'Not enough tickets available.' });
    }
    const attendeeData = [];
    for (const email of attendeeEmails) {
      const attendee = await User.findOne({ email });
      if (!attendee) return res.status(404).json({ message: `User with email ${email} not found.` });
      const existingTicket = await Ticket.findOne({ attendee: attendee._id, event: eventId, status: { $in: ['confirmed', 'used'] } });
      if (existingTicket) return res.status(400).json({ message: `User with email ${email} already has a ticket.` });
      attendeeData.push(attendee);
    }

    // --- Create the Parent Reservation ---
    const reservation = await GroupReservation.create({
      event: eventId,
      purchaser: purchaserId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set expiry for 24 hours from now
    });

    // --- Create Pending Tickets ---
    for (const attendee of attendeeData) {
      await Ticket.create({
        event: eventId,
        attendee: attendee._id,
        purchasePrice: event.ticketPrice,
        status: 'pending_acceptance', // The initial status for an invitation
        groupReservation: reservation._id,
      });
      // Here you would also trigger a real notification (email, push notification)
      console.log(`Invitation sent to ${attendee.email}`);
    }

    res.status(201).json({
      message: `Reservation created. Invitations sent to ${attendeeEmails.length} user(s).`,
      reservationId: reservation._id,
      expiresAt: reservation.expiresAt,
    });
  } catch (error) {
    console.error('Group reservation error:', error);
    res.status(500).json({ message: 'Server error during group reservation.' });
  }
};

// --- NEW FUNCTION TO ACCEPT A TICKET ---
// @desc    Accept a ticket invitation
// @route   POST /api/tickets/accept/:ticketId
// @access  Private (only the invited user can accept)
export const acceptTicketInvitation = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket invitation not found.' });

        // Security Check: Ensure the person accepting is the correct user.
        if (ticket.attendee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to accept this ticket.' });
        }
        if (ticket.status !== 'pending_acceptance') {
            return res.status(400).json({ message: `This invitation is no longer pending. Current status: ${ticket.status}`});
        }

        ticket.status = 'accepted';
        await ticket.save();
        res.status(200).json({ message: 'Ticket invitation accepted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION TO DECLINE A TICKET ---
// @desc    Decline a ticket invitation
// @route   POST /api/tickets/decline/:ticketId
// @access  Private (only the invited user can decline)
export const declineTicketInvitation = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket invitation not found.' });

        if (ticket.attendee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to decline this ticket.' });
        }
        if (ticket.status !== 'pending_acceptance') {
            return res.status(400).json({ message: `This invitation is no longer pending. Current status: ${ticket.status}`});
        }

        ticket.status = 'declined';
        await ticket.save();
        res.status(200).json({ message: 'Ticket invitation declined.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all tickets for the logged-in user
// @route   GET /api/tickets/mytickets
// @access  Private
export const getMyTickets = async (req, res) => { /* ... this function remains the same ... */ };

// @desc    Validate a ticket via NFC scan
// @route   POST /api/tickets/validate
// @access  Public (for IoT device)
export const validateTicket = async (req, res) => {
    // This needs a small update to check for the correct status
    const { platformUserId, eventId } = req.body;
    try {
        const user = await User.findOne({ platformUserId });
        if (!user) return res.status(404).json({ success: false, message: 'Invalid User ID.' });

        // The ticket must be 'confirmed' to be valid for entry
        const ticket = await Ticket.findOne({ attendee: user._id, event: eventId, status: 'confirmed' });
        if (!ticket) return res.status(404).json({ success: false, message: 'No valid ticket found.' });

        ticket.status = 'used'; // Change status from confirmed to used
        await ticket.save();

        await markAsUsed(ticket.nftTokenId); // Still mark on blockchain
        res.json({ success: true, message: 'Check-in successful!', user: { name: user.name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};