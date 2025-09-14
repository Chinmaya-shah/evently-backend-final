// server.js

import dotenv from 'dotenv';
// We load the environment variables from the .env file FIRST.
dotenv.config();

import express from 'express';
import connectDB from './config/db.js';

// Import our new reservation service
import { startReservationFinalizer } from './services/reservationService.js';

// Import routes
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

// Connect to the database
connectDB();

const app = express();

// Enable the server to accept JSON in the body of requests
app.use(express.json());


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