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
            // Update status to online whenever it registers/pings
            gateExists.status = 'online';
            await gateExists.save();
            return res.status(200).json({ message: 'Gate already registered.', gate: gateExists });
        }
        const newGate = await Gate.create({
            macAddress,
            name: `New Gate - ${macAddress.slice(-5).replace(/:/g, '')}`,
            status: 'online'
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
            // Mark as online since it's polling
            gate.status = 'online';

            // Prepare response
            const response = {
                activeEventId: gate.activeEvent,
                mode: gate.mode,
                job: null // Default no job
            };

            // CHECK FOR JOBS
            if (gate.pendingJob) {
                console.log(`🚀 Sending Remote Job to ${gate.macAddress}: ${gate.pendingJob.command}`);
                response.job = gate.pendingJob;

                // Clear the job from DB so it doesn't run twice?
                // Better approach: Gate must confirm completion.
                // For V2.0 simplicity: We send it, and assume gate clears it or we clear it here.
                // Let's clear it here to prevent loops, effectively "Popping" the queue.
                gate.pendingJob = null;
            }

            await gate.save();
            res.json(response);
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

// --- NEW FUNCTION: SEND REMOTE JOB ---
export const sendJobToGate = async (req, res) => {
    try {
        const { gateId, command, payload } = req.body;
        const gate = await Gate.findById(gateId);

        if (!gate) {
            return res.status(404).json({ message: 'Gate not found' });
        }

        // Add job to the "Mailbox"
        gate.pendingJob = {
            command: command, // e.g. 'ACTIVATE'
            payload: payload  // e.g. platformUserId
        };

        // Auto-switch to Activation mode if sending an activation job
        if (command === 'ACTIVATE') {
            gate.mode = 'activation';
        }

        await gate.save();
        res.json({ message: 'Job queued successfully', gate });

    } catch (error) {
        console.error("Job Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};