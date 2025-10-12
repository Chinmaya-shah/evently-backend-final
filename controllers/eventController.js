// controllers/eventController.js

import Event from '../models/eventModel.js';
import Ticket from '../models/ticketModel.js';
import { logActivity } from '../services/activityService.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Organizer
export const createEvent = async (req, res) => {
    try {
        const { name, description, eventImage, date, location, ticketPrice, capacity } = req.body;

        let finalImageUrl = ''; // Use a different name to avoid confusion
        if (eventImage) {
            const uploadedResponse = await cloudinary.uploader.upload(eventImage, {
                folder: 'evently_events',
                resource_type: 'image',
            });
            finalImageUrl = uploadedResponse.secure_url;
        }

        const event = new Event({
            name,
            description,
            // --- THIS IS THE CRITICAL FIX ---
            // We now correctly save the URL from Cloudinary, not the raw Base64 data.
            eventImage: finalImageUrl,
            date,
            location,
            ticketPrice,
            capacity,
            organizer: req.user._id,
        });

        const createdEvent = await event.save();

        const message = `You created a new event: "${createdEvent.name}"`;
        await logActivity(req.user._id, message, 'event', `/organizer/my-events/edit/${createdEvent._id}`);

        res.status(201).json(createdEvent);
    } catch (error) {
        console.error("Event Creation Error:", error);
        res.status(400).json({ message: 'Event creation failed', error: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Owner of the event
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this event' });
        }

        let finalImageUrl = event.eventImage;
        const newImage = req.body.eventImage;

        if (newImage && newImage.startsWith('data:image')) {
            const uploadedResponse = await cloudinary.uploader.upload(newImage, {
                folder: 'evently_events',
            });
            finalImageUrl = uploadedResponse.secure_url;
        }

        event.name = req.body.name || event.name;
        event.description = req.body.description || event.description;
        event.date = req.body.date || event.date;
        event.location = req.body.location || event.location;
        event.ticketPrice = req.body.ticketPrice === undefined ? event.ticketPrice : req.body.ticketPrice;
        event.capacity = req.body.capacity || event.capacity;

        // --- THIS IS THE SECOND CRITICAL FIX ---
        event.eventImage = finalImageUrl;

        const updatedEvent = await event.save();
        res.json(updatedEvent);

    } catch (error) {
        console.error("Event Update Error:", error);
        res.status(500).json({ message: 'Server error while updating event.' });
    }
};


// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find({}).populate('organizer', 'name');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name');
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Owner of the event
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) { return res.status(404).json({ message: 'Event not found' }); }
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to delete this event' });
        }
        if (event.ticketsSold > 0) {
            return res.status(400).json({ message: 'Cannot delete an event for which tickets have already been sold.' });
        }
        await event.deleteOne();
        res.json({ message: 'Event removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting event.' });
    }
};

// @desc    Get analytics for a specific event
// @route   GET /api/events/:id/analytics
// @access  Private/Owner of the event
export const getEventAnalytics = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) { return res.status(404).json({ message: 'Event not found' }); }
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to view analytics for this event' });
        }
        const totalRevenue = event.ticketsSold * event.ticketPrice;
        const tickets = await Ticket.find({ event: req.params.id }).populate('attendee', 'name email platformUserId');
        res.json({
            eventName: event.name,
            ticketsSold: event.ticketsSold,
            capacity: event.capacity,
            totalRevenue: totalRevenue,
            attendees: tickets.map(t => t.attendee),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching analytics.' });
    }
};

// @desc    Get all events for the logged-in organizer
// @route   GET /api/events/myevents
// @access  Private/Organizer
export const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};