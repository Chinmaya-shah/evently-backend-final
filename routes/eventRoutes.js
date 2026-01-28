// routes/eventRoutes.js
import express from 'express';
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

// --- ORGANIZER ROUTES ---
// 1. My Events (Specific Path)
router.get('/myevents', protect, isOrganizer, getMyEvents);

// 2. Analytics (Specific Path)
router.get('/analytics/:id', protect, isOrganizer, getEventAnalytics);

// --- GENERAL ROUTES ---
// 3. Root (Get All Public / Create)
router.route('/')
    .get(getEvents)
    .post(protect, isOrganizer, createEvent);

// 4. ID (Get One / Update / Delete) - Must be last!
router.route('/:id')
    .get(getEventById)
    .put(protect, isOrganizer, updateEvent)
    .delete(protect, isOrganizer, deleteEvent);

export default router;