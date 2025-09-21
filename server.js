// server.js

import dotenv from 'dotenv';
// We load the environment variables from the .env file FIRST.
dotenv.config();

import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors'; // <-- 1. IMPORT THE NEW CORS LIBRARY

// Import our new reservation service and all the route files
import { startReservationFinalizer } from './services/reservationService.js';
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

// Connect to the database
connectDB();

const app = express();

// Enable the server to accept JSON in the body of requests
app.use(express.json());

// --- THIS IS THE CRITICAL FIX ---
// This tells our server to accept requests from any origin,
// which will solve the "Failed to fetch" error from our local HTML file.
app.use(cors());

// --- START THE AUTOMATED BACKGROUND JOB ---
startReservationFinalizer();

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/events', eventRoutes);
app.use('/api/users', authRoutes);
app.use('/api/tickets', ticketRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});