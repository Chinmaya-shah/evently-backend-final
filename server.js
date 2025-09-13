// server.js

import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/authRoutes.js'; // CORRECTED FILENAME
import ticketRoutes from './routes/ticketRoutes.js';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Enable the server to accept JSON in the body of requests
app.use(express.json());

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/events', eventRoutes);
app.use('/api/users', authRoutes); // CORRECTED FILENAME
app.use('/api/tickets', ticketRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});