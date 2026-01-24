// routes/gateRoutes.js
import express from 'express';
import {
    registerGate,
    getGateConfig,
    getAllGates,
    updateGate,
    setGateMode,
    sendJobToGate // <-- Import new function
} from '../controllers/gateController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public (IoT Device)
router.post('/register', registerGate);
router.get('/config/:macAddress', getGateConfig);

// Private (Admin)
router.get('/', protect, isAdmin, getAllGates);
router.put('/:id', protect, isAdmin, updateGate);
router.put('/:id/set-mode', protect, isAdmin, setGateMode);

// --- NEW ROUTE FOR REMOTE COMMANDS ---
router.post('/send-job', protect, isAdmin, sendJobToGate);

export default router;