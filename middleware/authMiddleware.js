// middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
  let token;

  // Check if the request has an Authorization header, and if it starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID from the token and attach it to the request object
      // We exclude the password field for security
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Move on to the next function (the controller)
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const isOrganizer = (req, res, next) => {
    // Check if the user object exists and if their role is Organizer or Admin
    if (req.user && (req.user.role === 'Organizer' || req.user.role === 'Admin')) {
        next(); // User is an organizer, proceed
    } else {
        res.status(403).json({ message: 'Not authorized, an Organizer role is required' });
    }
};

export { protect, isOrganizer };