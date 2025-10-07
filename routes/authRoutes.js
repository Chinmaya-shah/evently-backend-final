// routes/authRoutes.js

import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  submitKyc,
  findUserForAdmin,
  prepareActivation,
  getIdForKiosk,
  confirmActivation // <-- 1. Import the missing function
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
router.post('/prepare-activation', protect, isAdmin, prepareActivation);

// --- THIS IS THE CRITICAL FIX ---
// Public routes for the IoT Kiosk to communicate with
router.post('/kiosk/get-id', getIdForKiosk);
// 2. Add the missing road sign for the confirm-activation endpoint
router.post('/kiosk/confirm-activation', confirmActivation);

export default router;