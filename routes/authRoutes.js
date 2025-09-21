// routes/authRoutes.js

import express from 'express';
const router = express.Router();

// We need both 'protect' (for logged-in users) and 'isAdmin' for our new admin-only routes
import { protect, isAdmin } from '../middleware/authMiddleware.js';

// Import all controller functions, including our new ones for the admin and kiosk flow
import {
  registerUser,
  loginUser,
  getUserProfile,
  submitKyc,
  findUserForAdmin,
  prepareActivation,
  getIdForKiosk,
  confirmActivation
} from '../controllers/authController.js';


// --- PUBLIC AUTH ROUTES ---
// A user does not need to be logged in to access these.
router.post('/register', registerUser);
router.post('/login', loginUser);


// --- PROTECTED USER ROUTES ---
// A user MUST be logged in to access these routes.
router.get('/profile', protect, getUserProfile);
router.post('/submit-kyc', protect, submitKyc);


// --- NEW ADMIN & KIOSK ROUTES ---

// This new route allows a logged-in Admin to search for any user by their email.
router.get('/admin/find', protect, isAdmin, findUserForAdmin);

// This route is for the admin web portal to generate a one-time code. It is admin-only.
router.post('/prepare-activation', protect, isAdmin, prepareActivation);

// These two routes are for the Arduino Kiosk. They are public but secured by the short-lived, one-time code.
router.post('/kiosk/get-id', getIdForKiosk);
router.post('/kiosk/confirm-activation', confirmActivation);


export default router;