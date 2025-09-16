// controllers/ticketController.js

import Ticket from '../models/ticketModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import GroupReservation from '../models/groupReservationModel.js';
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
        if (event.ticketsSold >= event.capacity) return res.status(400).json({ message: 'Event is sold out' });

        const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8';
        const tokenId = await mintTicket(attendeeWalletAddress);
        const ticket = await Ticket.create({
            event: eventId,
            attendee: attendeeId,
            purchasePrice: event.ticketPrice,
            nftTokenId: tokenId,
            status: 'confirmed',
        });
        event.ticketsSold += 1;
        await event.save();
        sendPurchaseConfirmationEmail(attendee, ticket, event);
        res.status(201).json({ message: 'Ticket purchased and minted successfully!', ticket });
    } catch (error) {
        console.error('Ticket purchase error:', error);
        res.status(500).json({ message: 'Server error during ticket purchase.' });
    }
};

// @desc    Request tickets for a group, creating a pending reservation
// @route   POST /api/tickets/request-group
// @access  Private
export const requestGroupTickets = async (req, res) => {
    const { eventId, attendeeEmails } = req.body;
    const purchaser = req.user;
    const allEmails = new Set(attendeeEmails);
    allEmails.add(purchaser.email);
    const finalAttendeeEmails = Array.from(allEmails);

    if (finalAttendeeEmails.length === 0) {
        return res.status(400).json({ message: 'No attendees specified.' });
    }
    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if ((event.ticketsSold + finalAttendeeEmails.length) > event.capacity) {
            return res.status(400).json({ message: 'Not enough tickets available for this group size.' });
        }
        const attendeeData = [];
        for (const email of finalAttendeeEmails) {
            const attendee = await User.findOne({ email });
            if (!attendee) return res.status(404).json({ message: `User with email ${email} is not registered on Evently.` });
            const existingTicket = await Ticket.findOne({ attendee: attendee._id, event: eventId, status: { $in: ['confirmed', 'used', 'accepted', 'pending_acceptance'] } });
            if (existingTicket) return res.status(400).json({ message: `User with email ${email} already has a ticket or a pending invitation for this event.` });
            attendeeData.push(attendee);
        }
        const reservation = await GroupReservation.create({
            event: eventId,
            purchaser: purchaser._id,
            expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        });
        for (const attendee of attendeeData) {
            await Ticket.create({
                event: eventId,
                attendee: attendee._id,
                purchasePrice: event.ticketPrice,
                status: attendee.email === purchaser.email ? 'accepted' : 'pending_acceptance',
                groupReservation: reservation._id,
            });
            console.log(`Invitation logic processed for ${attendee.email}`);
        }
        res.status(201).json({
            message: `Reservation created successfully for ${finalAttendeeEmails.length} user(s).`,
            reservationId: reservation._id,
        });
    } catch (error) {
        console.error('Group reservation error:', error);
        res.status(500).json({ message: 'Server error during group reservation.' });
    }
};

// @desc    Accept a ticket invitation
// @route   POST /api/tickets/accept/:ticketId
// @access  Private
export const acceptTicketInvitation = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket invitation not found.' });
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

// @desc    Decline a ticket invitation
// @route   POST /api/tickets/decline/:ticketId
// @access  Private
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

// --- THIS IS THE UPDATED FUNCTION ---
// @desc    Get all tickets for the logged-in user, with filtering
// @route   GET /api/tickets/mytickets
// @access  Private
export const getMyTickets = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of the current day

        // We build our base database query to find tickets for the logged-in user.
        const query = { attendee: req.user._id };

        // Now, we look for the 'status' filter from the app's request (e.g., ?status=upcoming)
        if (req.query.status === 'upcoming') {
            // If the app wants upcoming tickets, we first find all event IDs with a date in the future.
            const upcomingEvents = await Event.find({ date: { $gte: today } }).select('_id');
            // Then, we add a condition to our main query to only find tickets whose 'event' field is in that list.
            query.event = { $in: upcomingEvents.map(e => e._id) };
        } else if (req.query.status === 'past') {
            // If the app wants past tickets, we do the same for events with a date in the past.
            const pastEvents = await Event.find({ date: { $lt: today } }).select('_id');
            query.event = { $in: pastEvents.map(e => e._id) };
        }

        const tickets = await Ticket.find(query)
            .populate('event', 'name date location') // We still populate the event details
            .sort({ 'event.date': -1 }); // Sort by event date, newest first

        res.json(tickets);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Validate a ticket via NFC scan
// @route   POST /api/tickets/validate
// @access  Public
export const validateTicket = async (req, res) => {
    const { platformUserId, eventId } = req.body;
    try {
        const user = await User.findOne({ platformUserId });
        if (!user) return res.status(404).json({ success: false, message: 'Invalid User ID.' });

        const ticket = await Ticket.findOne({ attendee: user._id, event: eventId, status: 'confirmed' });
        if (!ticket) return res.status(404).json({ success: false, message: 'No valid ticket found for this user and event.' });

        ticket.status = 'used';
        await ticket.save();
        await markAsUsed(ticket.nftTokenId);
        res.json({ success: true, message: 'Check-in successful!', user: { name: user.name } });
    } catch (error) {
        console.error('Validation Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};