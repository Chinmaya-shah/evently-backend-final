// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import connectCloudinary from './config/cloudinary.js';
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import gateRoutes from './routes/gateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { startReservationFinalizer } from './services/reservationService.js';

dotenv.config();

// Connect to Database & Cloudinary
connectDB();
connectCloudinary();

const app = express();

// --- ROBUST CORS CONFIGURATION ---
// This replaces the simple app.use(cors()) to handle specific domains correctly
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);

        // Allowed Domains (Localhost + Your Vercel Deployments)
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://evently-ui.vercel.app',
            // Add other Vercel preview URLs if needed, or use logic below
        ];

        // Check if the incoming origin matches our list OR ends with .vercel.app
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle Pre-flight requests explicitly
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '50mb' })); // Keep your 50mb limit

// Health Check
app.get('/', (req, res) => {
    res.send('Evently API is running (CORS Enabled)...');
});

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/users', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/gates', gateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/ai', aiRoutes);

// Start Services
startReservationFinalizer();

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);