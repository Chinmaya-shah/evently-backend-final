// routes/eventRoutes.js

import express from 'express';
// Import all the controller functions
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventAnalytics,
    getMyEvents
} from '../controllers/eventController.js';
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- ORGANIZER-SPECIFIC ROUTES ---

// 1. Get Logged-In Organizer's Events
// Matches: GET /api/events/myevents
router.get('/myevents', protect, isOrganizer, getMyEvents);

// 2. Get Analytics for a specific event
// Matches: GET /api/events/analytics/:id
// FIX: This path now matches what the Frontend is requesting
router.get('/analytics/:id', protect, isOrganizer, getEventAnalytics);


// --- GENERAL EVENT ROUTES ---

// 3. Main Event Collection
// Matches: GET /api/events (Public), POST /api/events (Organizer)
router.route('/')
    .get(getEvents)
    .post(protect, isOrganizer, createEvent);

// 4. Specific Event Operations (Must be last to avoid conflict)
// Matches: GET/PUT/DELETE /api/events/:id
router.route('/:id')
    .get(getEventById)
    .put(protect, isOrganizer, updateEvent)
    .delete(protect, isOrganizer, deleteEvent);

export default router;