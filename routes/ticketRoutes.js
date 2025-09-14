// routes/ticketRoutes.js

import express from 'express';
// Import the new controller functions
import {
  purchaseTicket,
  validateTicket,
  requestGroupTickets, // Changed from purchaseGroupTickets
  getMyTickets,
  acceptTicketInvitation,
  declineTicketInvitation
} from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for fetching the user's own tickets
router.get('/mytickets', protect, getMyTickets);

// Route for a single user buying a ticket for themselves
router.post('/purchase', protect, purchaseTicket);

// NEW ROUTE for initiating a group reservation
router.post('/request-group', protect, requestGroupTickets);

// NEW ROUTES for responding to an invitation
router.post('/accept/:ticketId', protect, acceptTicketInvitation);
router.post('/decline/:ticketId', protect, declineTicketInvitation);

// Route for the IoT gate device to validate a ticket
router.post('/validate', validateTicket);

export default router;