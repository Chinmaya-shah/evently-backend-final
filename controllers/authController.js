// controllers/authController.js

import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// A simple in-memory store for our one-time activation tokens.
const activationTokens = new Map();


// Helper function to generate a JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ name, email, password, role: role || 'Attendee' });
        if (user) {
            res.status(201).json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                platformUserId: user.platformUserId, token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id, name: user.name, email: user.email, role: user.role,
                platformUserId: user.platformUserId, token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id, name: user.name, email: user.email, role: user.role,
            platformUserId: user.platformUserId, isVerified: user.isVerified, isCardActivated: user.isCardActivated,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Submit KYC data for the logged-in user
// @route   POST /api/users/submit-kyc
// @access  Private
export const submitKyc = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            const { fullName, address, governmentId } = req.body;
            user.kyc.fullName = fullName || user.kyc.fullName;
            user.kyc.address = address || user.kyc.address;
            user.kyc.governmentId = governmentId || user.kyc.governmentId;
            user.isVerified = true;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role,
                platformUserId: updatedUser.platformUserId, isVerified: updatedUser.isVerified, isCardActivated: updatedUser.isCardActivated,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('KYC Submission Error:', error);
        res.status(400).json({ message: 'Invalid KYC data provided' });
    }
};


// --- THIS IS THE NEW FUNCTION FOR THE ADMIN PORTAL SEARCH ---
// @desc    Admin finds a user by email
// @route   GET /api/users/admin/find
// @access  Private/Admin
export const findUserForAdmin = async (req, res) => {
    // We get the email from a query parameter, e.g., ?email=user@example.com
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ message: 'Email query parameter is required.' });
    }
    try {
        const user = await User.findOne({ email });
        if (user) {
            // Send back the necessary user data for the portal
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                isCardActivated: user.isCardActivated,
            });
        } else {
            res.status(404).json({ message: `User with email ${email} not found.` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// --- Functions for the Activation Portal & Kiosk ---

// @desc    Prepare a user for card activation by generating a one-time code
// @route   POST /api/users/prepare-activation
// @access  Private/Admin
export const prepareActivation = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.isVerified) return res.status(400).json({ message: 'User must be KYC verified before card activation.' });
        if (user.isCardActivated) return res.status(400).json({ message: 'This user already has an active card.' });

        const oneTimeCode = crypto.randomInt(100000, 999999).toString();

        activationTokens.set(oneTimeCode, {
            userId: user._id,
            platformUserId: user.platformUserId,
            expiresAt: Date.now() + 60 * 1000, // 60-second expiry
        });

        console.log(`Generated activation code ${oneTimeCode} for user ${user.email}`);
        res.status(200).json({ oneTimeCode });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Kiosk gets the platformUserId using the one-time code
// @route   POST /api/users/kiosk/get-id
// @access  Public
export const getIdForKiosk = async (req, res) => {
    const { oneTimeCode } = req.body;
    const tokenData = activationTokens.get(oneTimeCode);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
        activationTokens.delete(oneTimeCode);
        return res.status(404).json({ message: 'Invalid or expired activation code.' });
    }

    res.status(200).json({ platformUserId: tokenData.platformUserId });
};

// @desc    Kiosk confirms successful activation
// @route   POST /api/users/kiosk/confirm-activation
// @access  Public
export const confirmActivation = async (req, res) => {
    const { oneTimeCode, cardUID } = req.body;
    const tokenData = activationTokens.get(oneTimeCode);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
        return res.status(404).json({ message: 'Invalid or expired activation code.' });
    }

    try {
        const user = await User.findById(tokenData.userId);
        if (user) {
            user.isCardActivated = true;
            user.activeCardId = cardUID;
            await user.save();

            activationTokens.delete(oneTimeCode);
            console.log(`Successfully activated card for user ${user.email}`);
            res.status(200).json({ message: 'Activation confirmed successfully.' });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};