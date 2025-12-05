import 'dotenv/config';
import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import servicesRoutes from './routes/services.js';
import bookingsRoutes from './routes/bookings.js';
import slotsRoutes from './routes/slots.js';
import schedulesRoutes from './routes/schedules.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/schedules', schedulesRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Koru Booking API Server         ║
║   📡 Running on port ${PORT}            ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}       ║
╚═══════════════════════════════════════╝
  `);
});
