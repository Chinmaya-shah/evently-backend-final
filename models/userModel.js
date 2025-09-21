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
  role: {
    type: String,
    required: true,
    enum: ['Attendee', 'Organizer', 'Admin'],
    default: 'Attendee',
  },
  platformUserId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(16),
  },

  // --- THESE ARE THE NEW, HIGH-SECURITY FIELDS ---

  // KYC (Know Your Customer) Information
  // In a real production app, this sensitive data would be encrypted at rest.
  kyc: {
    fullName: { type: String, default: '' },
    address: { type: String, default: '' },
    governmentId: { type: String, default: '' }, // e.g., Aadhaar number
  },

  // Verification Status
  isVerified: {
    type: Boolean,
    required: true,
    default: false, // A new user is NOT verified by default.
  },

  // NFC Card Activation Status (The "One-Time Lock")
  isCardActivated: {
    type: Boolean,
    required: true,
    default: false, // A new user does NOT have an active card by default.
  },

  // This will store the UID of the physical card or a reference to the phone's virtual card.
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