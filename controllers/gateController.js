// controllers/gateController.js
import Gate from '../models/gateModel.js';

export const registerGate = async (req, res) => {
    const { macAddress } = req.body;
    if (!macAddress) {
        return res.status(400).json({ message: 'MAC address is required.' });
    }
    try {
        const gateExists = await Gate.findOne({ macAddress });
        if (gateExists) {
            gateExists.status = 'online';
            gateExists.lastSeen = new Date();
            await gateExists.save();
            return res.status(200).json({ message: 'Gate already registered.', gate: gateExists });
        }
        const newGate = await Gate.create({
            macAddress,
            name: `New Gate - ${macAddress.slice(-5).replace(/:/g, '')}`,
            status: 'online',
            lastSeen: new Date()
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
            // --- HEARTBEAT LOGIC ---
            gate.status = 'online';
            gate.lastSeen = new Date();

            const response = {
                activeEventId: gate.activeEvent,
                mode: gate.mode,
                job: null
            };

            if (gate.pendingJob && gate.pendingJob.command) {
                console.log(`🚀 Sending Remote Job to ${gate.macAddress}: ${gate.pendingJob.command}`);
                response.job = {
                    command: gate.pendingJob.command,
                    payload: gate.pendingJob.payload
                };
                gate.pendingJob = null;
            }

            await gate.save();
            res.json(response);
        } else {
            res.status(404).json({ message: 'Gate not found.' });
        }
    } catch (error) {
        console.error("Config Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getAllGates = async (req, res) => {
    try {
        // --- OFFLINE CHECK LOGIC ---
        // Before returning the list, check who hasn't been seen in 20 seconds
        const gates = await Gate.find({}).populate('activeEvent', 'name');
        const now = new Date();

        const updatedGates = await Promise.all(gates.map(async (gate) => {
            // If lastSeen was more than 20 seconds ago, mark offline
            if (gate.lastSeen && (now.getTime() - new Date(gate.lastSeen).getTime() > 20000)) {
                if (gate.status !== 'offline') {
                    gate.status = 'offline';
                    await gate.save();
                }
            }
            return gate;
        }));

        // Sort: Online first
        updatedGates.sort((a, b) => (a.status === 'online' ? -1 : 1));

        res.json(updatedGates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION: INGEST REMOTE LOGS ---
export const logGateEvent = async (req, res) => {
    try {
        const { macAddress, message, type } = req.body;
        const gate = await Gate.findOne({ macAddress });

        if (gate) {
            // Add new log to the beginning of the array
            gate.logs.unshift({
                message,
                type: type || 'info',
                timestamp: new Date()
            });

            // Keep only the last 50 logs to save DB space
            if (gate.logs.length > 50) {
                gate.logs = gate.logs.slice(0, 50);
            }

            gate.lastSeen = new Date(); // Log activity counts as heartbeat
            gate.status = 'online';

            await gate.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ message: "Gate not found" });
        }
    } catch (error) {
        res.status(500).json({ message: 'Log Error' });
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

export const sendJobToGate = async (req, res) => {
    try {
        const { gateId, command, payload } = req.body;
        const gate = await Gate.findById(gateId);

        if (!gate) {
            return res.status(404).json({ message: 'Gate not found' });
        }

        gate.pendingJob = {
            command: command,
            payload: String(payload)
        };

        if (command === 'ACTIVATE') {
            gate.mode = 'activation';
        }

        await gate.save();
        console.log(`Job queued for ${gate.macAddress}: ${command} -> ${payload}`);

        res.json({ message: 'Job queued successfully', gate });

    } catch (error) {
        console.error("Job Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};