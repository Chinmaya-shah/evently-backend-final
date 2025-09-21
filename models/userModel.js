// models/userModel.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  // --- THIS IS THE CRITICAL CHANGE ---
  // We have added 'SuperAdmin' to the list of allowed roles.
  role: {
    type: String,
    required: true,
    enum: ['Attendee', 'Organizer', 'Admin', 'SuperAdmin'], // <-- 'SuperAdmin' is now a valid role
    default: 'Attendee',
  },
  platformUserId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(16),
  },

  // All our previous high-security fields remain the same
  kyc: {
    fullName: { type: String, default: '' },
    address: { type: String, default: '' },
    governmentId: { type: String, default: '' },
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  isCardActivated: {
    type: Boolean,
    required: true,
    default: false,
  },
  activeCardId: {
    type: String,
    default: '',
  },

}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});


// --- Middleware to hash password before saving the user document ---
// This logic does not need to change.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Method to compare entered password with the hashed password in the DB ---
// This logic does not need to change.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;