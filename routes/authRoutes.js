import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile, // <-- Import the new function
  submitKyc,
  findUserForAdmin,
  generateActivationCode,
  getIdForKiosk,
  confirmActivation,
  googleAuth
} from '../controllers/authController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);

// --- CRITICAL FIX: Add .put() for updates ---
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.post('/submit-kyc', protect, submitKyc);

router.get('/admin/find', protect, isAdmin, findUserForAdmin);
router.post('/generate-otp', protect, isAdmin, generateActivationCode);

router.post('/kiosk/get-id', getIdForKiosk);
router.post('/kiosk/confirm-activation', confirmActivation);

export default router;