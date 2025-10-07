// routes/gateRoutes.js
import express from 'express';
import {
    registerGate,
    getGateConfig,
    getAllGates,
    updateGate,
    setGateMode
} from '../controllers/gateController.js'; // Changed from require
import { protect, isAdmin } from '../middleware/authMiddleware.js'; // Changed from require

const router = express.Router();

router.post('/register', registerGate);
router.get('/config/:macAddress', getGateConfig);

router.get('/', protect, isAdmin, getAllGates);
router.put('/:id', protect, isAdmin, updateGate);
router.put('/:id/set-mode', protect, isAdmin, setGateMode);

export default router; // Changed from module.exports