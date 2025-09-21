// controllers/authController.js

import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

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
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                platformUserId: user.platformUserId,
                token: generateToken(user._id, user.role),
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
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                platformUserId: user.platformUserId,
                token: generateToken(user._id, user.role),
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
        // We now return the new verification and activation statuses
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            platformUserId: user.platformUserId,
            isVerified: user.isVerified,
            isCardActivated: user.isCardActivated,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// --- THIS IS THE NEW FUNCTION FOR KYC SUBMISSION ---
// @desc    Submit KYC data for the logged-in user
// @route   POST /api/users/submit-kyc
// @access  Private
export const submitKyc = async (req, res) => {
    try {
        // Find the user by the ID that our 'protect' middleware provides.
        const user = await User.findById(req.user._id);

        if (user) {
            // Get the KYC data from the request body.
            const { fullName, address, governmentId } = req.body;

            // Update the user's document with the new information.
            user.kyc.fullName = fullName || user.kyc.fullName;
            user.kyc.address = address || user.kyc.address;
            user.kyc.governmentId = governmentId || user.kyc.governmentId;

            // For our V1.0, we will automatically mark the user as verified upon submission.
            user.isVerified = true;

            // Save the updated user to the database.
            const updatedUser = await user.save();

            // Send back the complete, updated profile.
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                platformUserId: updatedUser.platformUserId,
                isVerified: updatedUser.isVerified,
                isCardActivated: updatedUser.isCardActivated,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('KYC Submission Error:', error);
        res.status(400).json({ message: 'Invalid KYC data provided' });
    }
};