// controllers/authController.js

import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Attendee',
    });
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

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // --- START OF DIAGNOSTIC LOGS ---
    console.log("--- LOGIN ATTEMPT ---");
    console.log(`1. Attempting login for email: ${email}`);

    const user = await User.findOne({ email });

    if (user) {
        console.log(`2. User found in database. Hashed password is: ${user.password}`);

        // This is the password comparison
        const isMatch = await user.matchPassword(password);
        console.log(`3. Password comparison result (isMatch): ${isMatch}`); // This should be true

        if (isMatch) {
            console.log("4. Login successful! Sending token.");
            console.log("--------------------");
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                platformUserId: user.platformUserId,
                token: generateToken(user._id, user.role),
            });
        } else {
            console.log("4. Login FAILED: Passwords do not match.");
            console.log("--------------------");
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } else {
        console.log("2. Login FAILED: User not found in database.");
        console.log("--------------------");
        res.status(401).json({ message: 'Invalid email or password' });
    }
    // --- END OF DIAGNOSTIC LOGS ---
  } catch (error) {
    console.error("CRITICAL ERROR in loginUser function:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            platformUserId: user.platformUserId,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};