import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();

// Connect to Database
connectDB();

const seedAdmin = async () => {
  try {
    // 1. Check if admin already exists to prevent duplicates
    const adminExists = await User.findOne({ email: 'admin@evently.com' });

    if (adminExists) {
      console.log('⚠️  Admin user already exists!');
      process.exit();
    }

    // 2. Create the Admin User
    // The password will be automatically hashed by the pre-save middleware in userModel.js
    const user = await User.create({
      name: 'Super Admin',
      email: 'admin@evently.com',
      password: 'password123', // Default password
      role: 'Admin',           // Crucial: Sets permissions
      isVerified: true,        // Auto-verify admin
      platformUserId: 'ADMIN_001'
    });

    console.log('✅ Admin User Created Successfully');
    console.log('-----------------------------------');
    console.log('📧 Email:    admin@evently.com');
    console.log('🔑 Password: password123');
    console.log('-----------------------------------');

    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();