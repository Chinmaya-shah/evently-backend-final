// routes/authRoutes.js

import express from 'express';
const router = express.Router();

// Import the security middleware that checks if a user is logged in
import { protect } from '../middleware/authMiddleware.js';

// Import all controller functions, including the new 'submitKyc'
import {
  registerUser,
  loginUser,
  getUserProfile,
  submitKyc // <-- Import the new function
} from '../controllers/authController.js';


// --- Public Routes ---
// A user does not need to be logged in to register or log in.
router.post('/register', registerUser);
router.post('/login', loginUser);


// --- Protected Routes ---
// A user MUST be logged in to access these routes. The 'protect' middleware enforces this.

// This route allows a logged-in user to fetch their own profile data.
router.get('/profile', protect, getUserProfile);

// THIS IS THE NEW ROUTE for submitting KYC data.
// It is protected to ensure a user can only submit KYC for their own account.
router.post('/submit-kyc', protect, submitKyc);


export default router;