// routes/authRoutes.js

import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  submitKyc,
  findUserForAdmin,
  generateActivationCode, // <-- Renamed import
  getIdForKiosk,
  confirmActivation
} from '../controllers/authController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for registration and login
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes for authenticated users
router.get('/profile', protect, getUserProfile);
router.post('/submit-kyc', protect, submitKyc);

// Admin-only routes
router.get('/admin/find', protect, isAdmin, findUserForAdmin);

// --- CHANGED ROUTE NAME TO MATCH FRONTEND ---
router.post('/generate-otp', protect, isAdmin, generateActivationCode);

// Public routes for the IoT Kiosk to communicate with
router.post('/kiosk/get-id', getIdForKiosk);
router.post('/kiosk/confirm-activation', confirmActivation);

export default router;