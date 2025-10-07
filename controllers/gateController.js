// controllers/gateController.js
import Gate from '../models/gateModel.js'; // Changed from require

export const registerGate = async (req, res) => {
    const { macAddress } = req.body;
    if (!macAddress) {
        return res.status(400).json({ message: 'MAC address is required.' });
    }
    try {
        const gateExists = await Gate.findOne({ macAddress });
        if (gateExists) {
            return res.status(200).json({ message: 'Gate already registered.', gate: gateExists });
        }
        const newGate = await Gate.create({
            macAddress,
            name: `New Gate - ${macAddress.slice(-5).replace(/:/g, '')}`,
        });
        res.status(201).json({ message: 'Gate registered successfully.', gate: newGate });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getGateConfig = async (req, res) => {
    try {
        const gate = await Gate.findOne({ macAddress: req.params.macAddress });
        if (gate) {
            res.json({
                activeEventId: gate.activeEvent,
                mode: gate.mode,
            });
        } else {
            res.status(404).json({ message: 'Gate not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getAllGates = async (req, res) => {
    try {
        const gates = await Gate.find({}).populate('activeEvent', 'name');
        res.json(gates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateGate = async (req, res) => {
    try {
        const gate = await Gate.findById(req.params.id);
        if (gate) {
            gate.name = req.body.name || gate.name;
            gate.location = req.body.location || gate.location;
            gate.activeEvent = req.body.activeEventId === '' ? null : req.body.activeEventId || gate.activeEvent;
            const updatedGate = await gate.save();
            res.json(updatedGate);
        } else {
            res.status(404).json({ message: 'Gate not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const setGateMode = async (req, res) => {
    try {
        const gate = await Gate.findById(req.params.id);
        if (gate) {
            const { mode } = req.body;
            if (!['activation', 'validation', 'cloner'].includes(mode)) {
                return res.status(400).json({ message: 'Invalid mode specified.' });
            }
            gate.mode = mode;
            await gate.save();
            res.json({ message: `Gate mode updated to ${mode}`, gate });
        } else {
            res.status(404).json({ message: 'Gate not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Removed module.exports and used named exports above