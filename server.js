// server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import gateRoutes from './routes/gateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'; // <-- 1. IMPORT THE NEW ROUTES
import { startReservationFinalizer } from './services/reservationService.js';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/events', eventRoutes);
app.use('/api/users', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/gates', gateRoutes);
app.use('/api/notifications', notificationRoutes); // <-- 2. PLUG IN THE NEW ROUTES

startReservationFinalizer();

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);