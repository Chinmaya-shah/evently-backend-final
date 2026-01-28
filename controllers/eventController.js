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
        const { name, description, eventImage, date, location, ticketPrice, capacity, status, category } = req.body;

        // --- VALIDATION LOGIC ---
        if (status === 'Published') {
            if (!description || !date || !location || !capacity || !eventImage) {
                return res.status(400).json({
                    message: 'Cannot publish incomplete event. Please fill all fields (Image, Date, Location, Capacity) or save as Draft.'
                });
            }
        }

        let finalImageUrl = '';
        if (eventImage) {
            if (eventImage.startsWith('data:image')) {
                const uploadedResponse = await cloudinary.uploader.upload(eventImage, {
                    folder: 'evently_events',
                    resource_type: 'image',
                });
                finalImageUrl = uploadedResponse.secure_url;
            } else {
                finalImageUrl = eventImage;
            }
        }

        const event = new Event({
            name,
            description,
            eventImage: finalImageUrl,
            date,
            location,
            ticketPrice: Number(ticketPrice) || 0,
            capacity: Number(capacity),
            organizer: req.user._id, // Linked to the logged-in user
            status: status || 'Draft',
            category: category || 'General'
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
// @access  Private/Owner
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Strict Check: Only the organizer who created it can update it
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this event' });
        }

        if (req.body.status === 'Published') {
             const hasDesc = req.body.description || event.description;
             const hasDate = req.body.date || event.date;
             const hasLoc = req.body.location || event.location;
             const hasCap = req.body.capacity || event.capacity;
             const hasImg = req.body.eventImage || event.eventImage;

             if (!hasDesc || !hasDate || !hasLoc || !hasCap || !hasImg) {
                return res.status(400).json({
                    message: 'Cannot publish incomplete event. Please fill all fields.'
                });
             }
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
        event.category = req.body.category || event.category;

        if (req.body.status) {
            event.status = req.body.status;
        }

        event.eventImage = finalImageUrl;

        const updatedEvent = await event.save();
        res.json(updatedEvent);

    } catch (error) {
        console.error("Event Update Error:", error);
        res.status(500).json({ message: 'Server error while updating event.' });
    }
};

// @desc    Get all events (Public Feed - Only Published)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'Published' }).populate('organizer', 'name');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single event
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

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Owner
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

// @desc    Get analytics
// @route   GET /api/events/analytics/:id
// @access  Private/Owner
export const getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) { return res.status(404).json({ message: 'Event not found' }); }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to view analytics for this event' });
    }

    const totalRevenue = event.ticketsSold * event.ticketPrice;
    const tickets = await Ticket.find({ event: req.params.id })
        .populate('attendee', 'name email platformUserId')
        .sort({ createdAt: -1 });

    res.json({
      eventName: event.name,
      ticketsSold: event.ticketsSold,
      capacity: event.capacity,
      totalRevenue: totalRevenue,
      attendees: tickets.map(t => ({
          name: t.attendee?.name || 'Unknown',
          email: t.attendee?.email || 'N/A',
          platformId: t.attendee?.platformUserId || 'N/A',
          ticketId: t.nftTokenId || 'Pending',
          txHash: t.mintingTxHash || 'N/A',
          purchaseDate: t.createdAt,
          status: t.status
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching analytics.' });
  }
};

// @desc    Get organizer's events (My Events)
// @route   GET /api/events/myevents
// @access  Private/Organizer
export const getMyEvents = async (req, res) => {
    try {
        // --- DEBUG LOG ---
        // This will print to your backend terminal so you can verify WHO is asking.
        console.log(`🔍 Fetching MyEvents for User ID: ${req.user._id}`);

        // Strict Filter: Only events where organizer matches the logged-in user
        const events = await Event.find({ organizer: req.user._id });
        res.json(events);
    } catch (error) {
        console.error("GetMyEvents Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};