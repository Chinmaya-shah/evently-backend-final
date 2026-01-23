// controllers/ticketController.js

import Ticket from '../models/ticketModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import GroupReservation from '../models/groupReservationModel.js';
import { mintTicket, markAsUsed } from '../services/blockchainService.js';
import { sendPurchaseConfirmationEmail, createInAppNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

// --- DEV TICKET FUNCTION ---
export const createDevTicket = async (req, res) => {
    const { platformUserId, eventId } = req.body;
    try {
        const user = await User.findOne({ platformUserId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const newTicket = await Ticket.create({
            event: eventId,
            attendee: user._id,
            purchasePrice: event.ticketPrice,
            nftTokenId: 'dev-token-' + Date.now(),
            status: 'confirmed',
        });
        res.status(201).json({ message: "DEV TICKET CREATED", ticket: newTicket });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const purchaseTicket = async (req, res) => {
    const { eventId } = req.body;
    const attendee = req.user;
    try {
        const existingTicket = await Ticket.findOne({ attendee: attendee._id, event: eventId });
        if (existingTicket) {
            return res.status(400).json({ message: 'You have already purchased a ticket for this event.' });
        }
        const event = await Event.findById(eventId);

        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.ticketsSold >= event.capacity) return res.status(400).json({ message: 'Event is sold out' });

        const attendeeWalletAddress = '0x639958B29d0c7F3bA1Ccc1aeaBAd1e60e783b5F8'; // Placeholder for V1.1
        const tokenId = await mintTicket(attendeeWalletAddress);

        const ticket = await Ticket.create({
            event: eventId,
            attendee: attendee._id,
            purchasePrice: event.ticketPrice,
            nftTokenId: tokenId,
            status: 'confirmed',
        });

        event.ticketsSold += 1;
        await event.save();

        const message = `A ticket for "${event.name}" was purchased by ${attendee.name}.`;
        await logActivity(event.organizer, message, 'ticket');

        sendPurchaseConfirmationEmail(attendee, ticket, event);
        res.status(201).json({ message: 'Ticket purchased and minted successfully!', ticket });
    } catch (error) {
        console.error('Ticket purchase error:', error);
        res.status(500).json({ message: 'Server error during ticket purchase.' });
    }
};

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

            if (attendee.email !== purchaser.email) {
                const message = `${purchaser.name} has invited you to the event: ${event.name}!`;
                await createInAppNotification(attendee._id, message, 'invitation', '/events');
            }
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

// --- UPDATED GET MY TICKETS LOGIC ---
export const getMyTickets = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { attendee: req.user._id };

        // 1. Logic for "Active/Upcoming" Tickets (Wallet)
        if (status === 'upcoming') {
            // Fetch tickets that are valid for entry
            query.status = { $in: ['confirmed', 'accepted'] };
        }
        // 2. Logic for "History/Past" Tickets
        else if (status === 'history') {
            // Fetch tickets that are already used, expired, or declined
            query.status = { $in: ['used', 'expired', 'declined'] };
        }

        const tickets = await Ticket.find(query)
            .populate({
                path: 'event',
                select: 'name date location eventImage description' // Populate essential UI fields
            })
            .sort({ createdAt: -1 }); // Show newest purchases/activity first

        res.json(tickets);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const validateTicket = async (req, res) => {
    console.log("\n--- [VALIDATION START] ---");
    const { platformUserId, cardUID, eventId } = req.body;
    console.log(`[1] Received data: platformUserId=${platformUserId}, cardUID=${cardUID}, eventId=${eventId}`);

    if (!platformUserId || !cardUID || !eventId) {
        console.error("[FAIL] Missing required data in the request.");
        return res.status(400).json({ success: false, message: 'Platform User ID, Card UID, and Event ID are required.' });
    }
    try {
        console.log('[2] Searching for user...');
        const user = await User.findOne({ platformUserId });
        if (!user) {
            console.error('[FAIL] User not found in the database.');
            return res.status(404).json({ success: false, message: 'User ID not found.' });
        }
        console.log(`[2a] User found: ${user.email}`);

        console.log('[3] Comparing card UIDs (Digital Lock)...');
        if (user.activeCardUID !== cardUID) {
            console.warn(`[FAIL] SECURITY ALERT: Cloned card detected!`);
            console.error(`--> Scanned UID: ${cardUID}, Expected UID: ${user.activeCardUID}`);
            return res.status(403).json({ success: false, message: 'Card mismatch. Access denied.' });
        }
        console.log('[3a] Card UID match successful.');

        console.log('[4] Searching for a valid ticket...');
        const ticket = await Ticket.findOne({ attendee: user._id, event: eventId, status: 'confirmed' });

        if (!ticket) {
            console.error('[FAIL] No valid, confirmed ticket found for this user and event.');
            return res.status(404).json({ success: false, message: 'No valid, unused ticket found for this event.' });
        }
        console.log(`[4a] Valid ticket found: ID ${ticket._id}`);

        ticket.status = 'used'; // Mark as used so it can't be used again
        await ticket.save();

        console.log('[SUCCESS] All checks passed. Granting access.');
        res.json({ success: true, message: 'Check-in successful!', user: { name: user.name } });
    } catch (error) {
        console.error('[CRITICAL FAIL] An unexpected error occurred during validation:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};