// routes/eventRoutes.js

import express from 'express';
// 1. IMPORT THE CORRECT FUNCTION NAME: getEvents
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventAnalytics
} from '../controllers/eventController.js';
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.route('/')
    .get(getEvents) // 2. USE THE CORRECT FUNCTION NAME
    .post(protect, isOrganizer, createEvent);

// --- Routes for a specific event by ID ---
router.route('/:id')
    .get(getEventById)
    .put(protect, isOrganizer, updateEvent)
    .delete(protect, isOrganizer, deleteEvent);

// --- Analytics Route ---
router.route('/:id/analytics')
    .get(protect, isOrganizer, getEventAnalytics);

// 3. THE DUPLICATE ROUTE HAS BEEN REMOVED.

export default router;