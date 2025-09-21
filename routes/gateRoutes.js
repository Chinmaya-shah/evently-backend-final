// routes/gateRoutes.js

import express from 'express';
const router = express.Router();

import {
    registerGate,
    getGateConfig,
    getAllGates,
    updateGate
} from '../controllers/gateController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

// --- Public routes for the IoT devices ---
router.post('/register', registerGate);
router.get('/config/:macAddress', getGateConfig);

// --- Protected routes for the Admin Portal ---
router.route('/').get(protect, isAdmin, getAllGates);
router.route('/:id').put(protect, isAdmin, updateGate);

export default router;