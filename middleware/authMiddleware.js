// middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// This function checks if a user is logged in
export const protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- THIS IS THE CRITICAL FIX ---
// We are adding the missing 'isAdmin' function.
// This function checks if the logged-in user (provided by 'protect') has the 'Admin' role.
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next(); // If they are an Admin, proceed to the next step
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// This function is used by the organizer-specific routes
export const isOrganizer = (req, res, next) => {
    if (req.user && (req.user.role === 'Organizer' || req.user.role === 'Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized, an Organizer role is required' });
    }
};