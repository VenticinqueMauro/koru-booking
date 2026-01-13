import 'dotenv/config';
import express from 'express';
import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import superAdminRoutes from './routes/superAdmin.js';
import servicesRoutes from './routes/services.js';
import bookingsRoutes from './routes/bookings.js';
import slotsRoutes from './routes/slots.js';
import schedulesRoutes from './routes/schedules.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = env.PORT;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

// Export for Vercel serverless
export default app;

// Local development server (only runs when executed directly)
if (process.env.NODE_ENV !== 'production') {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🚀 Koru Booking API Server         ║
║   📡 Running on port ${PORT}            ║
║   🌍 Environment: ${env.NODE_ENV}       ║
╚═══════════════════════════════════════╝
    `);
  });
}
