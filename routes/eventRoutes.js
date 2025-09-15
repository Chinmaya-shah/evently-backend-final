// routes/eventRoutes.js

import express from 'express';
// Import all the controller functions we need for these routes
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventAnalytics,
    getMyEvents // Import the new function
} from '../controllers/eventController.js';
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- ORGANIZER-SPECIFIC ROUTES ---

// This new route fetches only the events created by the logged-in organizer.
// It must come before the '/:id' route to be matched correctly.
router.get('/myevents', protect, isOrganizer, getMyEvents);

// This route allows an organizer to get analytics for one of their events.
router.route('/:id/analytics')
    .get(protect, isOrganizer, getEventAnalytics);


// --- GENERAL EVENT ROUTES ---

// Routes for the main events collection
router.route('/')
    .get(getEvents) // Anyone can get the list of all events
    .post(protect, isOrganizer, createEvent); // Only an organizer can create an event

// Routes for a specific event by its ID
router.route('/:id')
    .get(getEventById) // Anyone can get details for a single event
    .put(protect, isOrganizer, updateEvent) // Only an organizer can update an event
    .delete(protect, isOrganizer, deleteEvent); // Only an organizer can delete an event

export default router;