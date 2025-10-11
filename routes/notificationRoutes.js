// routes/notificationRoutes.js
import express from 'express';
import { getMyNotifications, markNotificationsAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// We protect these routes to ensure only the logged-in user can access their own notifications
router.get('/', protect, getMyNotifications);
router.put('/read', protect, markNotificationsAsRead);

export default router;