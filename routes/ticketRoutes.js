// routes/ticketRoutes.js

import express from 'express';
import {
  purchaseTicket,
  validateTicket,
  requestGroupTickets,
  getMyTickets,
  acceptTicketInvitation,
  declineTicketInvitation,
  createDevTicket // <-- Import our new dev tool
} from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- THIS IS THE NEW DEVELOPER-ONLY ROUTE ---
// It allows us to create a ticket for a user for testing purposes.
router.post('/dev/create', createDevTicket);

// Route for fetching the user's own tickets
router.get('/mytickets', protect, getMyTickets);

// Route for a single user buying a ticket for themselves
router.post('/purchase', protect, purchaseTicket);

// Route for initiating a group reservation
router.post('/request-group', protect, requestGroupTickets);

// Routes for responding to an invitation
router.post('/accept/:ticketId', protect, acceptTicketInvitation);
router.post('/decline/:ticketId', protect, declineTicketInvitation);

// Route for the IoT gate device to validate a ticket
router.post('/validate', validateTicket);

export default router;