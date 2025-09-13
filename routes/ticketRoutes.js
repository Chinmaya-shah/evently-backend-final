// routes/ticketRoutes.js

import express from 'express';
// Import the new controller function
import { purchaseTicket, validateTicket, purchaseGroupTickets } from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for a single, logged-in user buying a ticket for themselves
router.post('/purchase', protect, purchaseTicket);

// NEW ROUTE for purchasing multiple tickets for friends
router.post('/purchase-group', protect, purchaseGroupTickets);

// Route for the IoT gate device to validate a ticket
router.post('/validate', validateTicket);

export default router;