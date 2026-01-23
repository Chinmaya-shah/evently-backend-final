// routes/aiRoutes.js
import express from 'express';
import {
  suggestImages,
  trackDownload,
  generateImage
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Suggest images from Unsplash
// @access  Public (or Protected, depending on preference. Keeping it open for easier searching)
// URL:     GET /api/ai/suggest-images?searchTerm=...
router.get('/suggest-images', suggestImages);

// @desc    Track Unsplash downloads (Required by Unsplash API guidelines)
// @access  Public
// URL:     POST /api/ai/track-download
router.post('/track-download', trackDownload);

// @desc    Generate AI Image (Gemini/Hugging Face)
// @access  Private (Logged in users only)
// URL:     POST /api/ai/generate-image
router.post('/generate-image', protect, generateImage);

export default router;