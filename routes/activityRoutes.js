// routes/activityRoutes.js
import express from 'express';
import { getMyActivities } from '../controllers/activityController.js';
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// A protected route that only organizers can access
router.get('/', protect, isOrganizer, getMyActivities);

export default router;