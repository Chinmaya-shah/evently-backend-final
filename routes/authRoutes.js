// routes/authRoutes.js

import express from 'express';
const router = express.Router();

// Import the security middleware
import { protect } from '../middleware/authMiddleware.js';

// Import all three controller functions
import {
  registerUser,
  loginUser,
  getUserProfile // <-- Import the new function
} from '../controllers/authController.js';


router.post('/register', registerUser);
router.post('/login', loginUser);

// --- THIS IS THE NEW ROUTE THAT WAS MISSING ---
// It says: for a GET request to '/profile', first run the 'protect' middleware,
// and if that passes, then run the 'getUserProfile' function.
router.get('/profile', protect, getUserProfile);


export default router;