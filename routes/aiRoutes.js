// routes/aiRoutes.js
import express from 'express';
import { suggestImages, trackDownload, generateImage } from '../controllers/aiController.js'; // <-- Import generateImage
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/suggest-images').get(protect, isOrganizer, suggestImages);
router.route('/track-download').post(protect, isOrganizer, trackDownload);

// --- THIS IS THE NEW ROUTE FOR THE AI ART DIRECTOR ---
router.route('/generate-image').post(protect, isOrganizer, generateImage);

export default router;