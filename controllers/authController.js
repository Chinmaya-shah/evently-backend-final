// controllers/authController.js

import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const activationTokens = new Map();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const registerUser = async (req, res) => {
    // ... function content is correct and unchanged
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) { return res.status(400).json({ message: 'User already exists' }); }
        const user = await User.create({ name, email, password, role: role || 'Attendee' });
        if (user) {
            res.status(201).json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                platformUserId: user.platformUserId, token: generateToken(user._id, user.role),
            });
        } else { res.status(400).json({ message: 'Invalid user data' }); }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const loginUser = async (req, res) => {
    // ... function content is correct and unchanged
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                platformUserId: user.platformUserId, token: generateToken(user._id, user.role),
            });
        } else { res.status(401).json({ message: 'Invalid email or password' }); }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const getUserProfile = async (req, res) => {
    // ... function content is correct and unchanged
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id, name: user.name, email: user.email, role: user.role,
            platformUserId: user.platformUserId, isVerified: user.isVerified, isCardActivated: user.isCardActivated,
        });
    } else { res.status(404).json({ message: 'User not found' }); }
};

export const submitKyc = async (req, res) => {
    // ... function content is correct and unchanged
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.kyc.fullName = req.body.fullName || user.kyc.fullName;
            user.kyc.address = req.body.address || user.kyc.address;
            user.kyc.governmentId = req.body.governmentId || user.kyc.governmentId;
            user.isVerified = true;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else { res.status(404).json({ message: 'User not found' }); }
    } catch (error) { res.status(400).json({ message: 'Invalid KYC data provided' }); }
};

export const findUserForAdmin = async (req, res) => {
    // ... function content is correct and unchanged
    const email = req.query.email;
    if (!email) { return res.status(400).json({ message: 'Email query parameter is required.' }); }
    try {
        const user = await User.findOne({ email });
        if (user) {
            res.json({
                _id: user._id, name: user.name, email: user.email,
                isVerified: user.isVerified, isCardActivated: user.isCardActivated,
            });
        } else { res.status(404).json({ message: `User with email ${email} not found.` }); }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const prepareActivation = async (req, res) => {
    // ... function content is correct and unchanged
    try {
        const user = await User.findById(req.body.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.isVerified) return res.status(400).json({ message: 'User must be KYC verified.' });
        if (user.isCardActivated) return res.status(400).json({ message: 'User already has an active card.' });
        const oneTimeCode = crypto.randomInt(100000, 999999).toString();
        activationTokens.set(oneTimeCode, {
            userId: user._id, platformUserId: user.platformUserId, expiresAt: Date.now() + 60 * 1000,
        });
        res.status(200).json({ oneTimeCode });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const getIdForKiosk = async (req, res) => {
    // ... function content is correct and unchanged
    const { oneTimeCode } = req.body;
    const tokenData = activationTokens.get(oneTimeCode);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
        activationTokens.delete(oneTimeCode);
        return res.status(404).json({ message: 'Invalid or expired activation code.' });
    }
    tokenData.expiresAt = Date.now() + 60 * 1000;
    activationTokens.set(oneTimeCode, tokenData);
    res.status(200).json({ platformUserId: tokenData.platformUserId });
};

export const confirmActivation = async (req, res) => {
    // ... function content is correct and unchanged
    const { oneTimeCode, cardUID } = req.body;
    const tokenData = activationTokens.get(oneTimeCode);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
        activationTokens.delete(oneTimeCode);
        return res.status(404).json({ message: 'Invalid or expired activation code.' });
    }
    try {
        const user = await User.findById(tokenData.userId);
        if (user) {
            user.isCardActivated = true;
            user.activeCardUID = cardUID;
            await user.save();
            activationTokens.delete(oneTimeCode);
            res.status(200).json({ message: 'Activation confirmed successfully.' });
        } else { res.status(404).json({ message: 'User not found.' }); }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This card is already assigned to another user.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};