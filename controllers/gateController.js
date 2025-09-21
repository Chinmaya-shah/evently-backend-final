// controllers/gateController.js

import Gate from '../models/gateModel.js';

// @desc    Register a new IoT gate device
// @route   POST /api/gates/register
// @access  Public (as the device is not a user)
export const registerGate = async (req, res) => {
    const { macAddress } = req.body;
    if (!macAddress) {
        return res.status(400).json({ message: 'MAC address is required.' });
    }

    try {
        // Check if a gate with this unique hardware address already exists
        const gateExists = await Gate.findOne({ macAddress });

        if (gateExists) {
            // If it exists, just confirm it's already registered
            return res.status(200).json({ message: 'Gate already registered.', gate: gateExists });
        }

        // If it's a new device, create a new record for it in the database
        const newGate = await Gate.create({
            macAddress,
            name: `New Gate - ${macAddress.slice(-4)}`, // Give it a default name
        });

        res.status(201).json({ message: 'Gate registered successfully.', gate: newGate });
    } catch (error) {
        console.error('Gate registration error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Fetch the configuration for a specific gate
// @route   GET /api/gates/config/:macAddress
// @access  Public (as the device is not a user)
export const getGateConfig = async (req, res) => {
    try {
        const gate = await Gate.findOne({ macAddress: req.params.macAddress });

        if (gate) {
            // Send back the ID of the event the gate is assigned to
            res.json({ activeEventId: gate.activeEvent });
        } else {
            res.status(404).json({ message: 'Gate not found. Please register the device.' });
        }
    } catch (error) {
        console.error('Gate config error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Functions for the future Admin Portal ---

// @desc    Get a list of all registered gates
// @route   GET /api/gates
// @access  Private/Admin
export const getAllGates = async (req, res) => {
    try {
        const gates = await Gate.find({}).populate('activeEvent', 'name');
        res.json(gates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a gate (e.g., assign an event to it)
// @route   PUT /api/gates/:id
// @access  Private/Admin
export const updateGate = async (req, res) => {
    try {
        const gate = await Gate.findById(req.params.id);
        if (gate) {
            gate.name = req.body.name || gate.name;
            gate.location = req.body.location || gate.location;
            gate.activeEvent = req.body.activeEventId || gate.activeEvent;

            const updatedGate = await gate.save();
            res.json(updatedGate);
        } else {
            res.status(404).json({ message: 'Gate not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};