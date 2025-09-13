// controllers/ticketController.js

import Ticket from '../models/ticketModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import { mintTicket, markAsUsed } from '../services/blockchainService.js';
import { sendPurchaseConfirmationEmail } from '../services/notificationService.js';

// @desc    Purchase a single ticket for the logged-in user
// @route   POST /api/tickets/purchase
// @access  Private
export const purchaseTicket = async (req, res) => {
  const { eventId } = req.body;
  const attendeeId = req.user._id;

  try {
    const existingTicket = await Ticket.findOne({ attendee: attendeeId, event: eventId });
    if (existingTicket) {
      return res.status(400).json({ message: 'You have already purchased a ticket for this event.' });
    }

    const event = await Event.findById(eventId);
    const attendee = await User.findById(attendeeId);

    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!attendee) return res.status(404).json({ message: 'Attendee not found' });

    if (event.ticketsSold >= event.capacity) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8';
    const tokenId = await mintTicket(attendeeWalletAddress);

    const ticket = await Ticket.create({
      event: eventId,
      attendee: attendeeId,
      purchasePrice: event.ticketPrice,
      nftTokenId: tokenId,
    });

    event.ticketsSold += 1;
    await event.save();
    sendPurchaseConfirmationEmail(attendee, ticket, event);

    res.status(201).json({
      message: 'Ticket purchased and minted successfully!',
      ticket,
    });
  } catch (error) {
    console.error('Ticket purchase error:', error);
    res.status(500).json({ message: 'Server error during ticket purchase.' });
  }
};

// --- THIS IS THE NEW FUNCTION FOR GROUP BOOKINGS ---
// @desc    Purchase multiple tickets for a group of existing users
// @route   POST /api/tickets/purchase-group
// @access  Private
export const purchaseGroupTickets = async (req, res) => {
  const { eventId, attendeeEmails } = req.body;

  if (!attendeeEmails || !Array.isArray(attendeeEmails) || attendeeEmails.length === 0) {
    return res.status(400).json({ message: 'An array of attendee emails is required.' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // --- PHASE 1: THE VALIDATION LOOP ---
    if ((event.ticketsSold + attendeeEmails.length) > event.capacity) {
      return res.status(400).json({ message: 'Not enough tickets available for the requested quantity.' });
    }

    const attendeeData = [];
    for (const email of attendeeEmails) {
      const attendee = await User.findOne({ email });

      if (!attendee) {
        return res.status(404).json({ message: `User with email ${email} not found. All attendees must be registered.` });
      }

      const existingTicket = await Ticket.findOne({ attendee: attendee._id, event: eventId });
      if (existingTicket) {
        return res.status(400).json({ message: `User with email ${email} already has a ticket for this event.` });
      }

      attendeeData.push(attendee);
    }

    // --- PHASE 2: THE CREATION LOOP ---
    const createdTickets = [];
    const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8';

    for (const attendee of attendeeData) {
      const tokenId = await mintTicket(attendeeWalletAddress);
      const ticket = await Ticket.create({
        event: eventId,
        attendee: attendee._id,
        purchasePrice: event.ticketPrice,
        nftTokenId: tokenId,
      });
      createdTickets.push(ticket);
      sendPurchaseConfirmationEmail(attendee, ticket, event);
    }

    event.ticketsSold += attendeeEmails.length;
    await event.save();

    res.status(201).json({
      message: `${attendeeEmails.length} tickets purchased and minted successfully!`,
      tickets: createdTickets,
    });

  } catch (error) {
    console.error('Group ticket purchase error:', error);
    res.status(500).json({ message: 'Server error during group ticket purchase.' });
  }
};

// @desc    Validate a ticket via NFC scan
// @route   POST /api/tickets/validate
// @access  Public (for IoT device)
export const validateTicket = async (req, res) => {
  const { platformUserId, eventId } = req.body;

  try {
    const user = await User.findOne({ platformUserId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid User ID. User not found.' });
    }

    const ticket = await Ticket.findOne({ attendee: user._id, event: eventId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found for this user and event.' });
    }

    if (ticket.isCheckedIn) {
      return res.status(400).json({ success: false, message: 'This ticket has already been checked in.' });
    }

    await markAsUsed(ticket.nftTokenId);
    ticket.isCheckedIn = true;
    await ticket.save();

    res.json({ success: true, message: 'Check-in successful!', user: { name: user.name } });
  } catch (error) {
    console.error('Validation Error:', error);
    if (error.message.includes('Ticket has already been used')) {
        return res.status(400).json({ success: false, message: 'Blockchain confirmation: Ticket already used.' });
    }
    res.status(500).json({ success: false, message: 'Server error during validation.' });
  }
};