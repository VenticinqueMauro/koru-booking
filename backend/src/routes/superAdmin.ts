import { Router } from 'express';
import { superAdminController } from '../controllers/SuperAdminController.js';
import { superAdminMiddleware } from '../middleware/superAdminAuth.js';

const router = Router();

// All routes require super admin authentication
router.use(superAdminMiddleware);

// GET /api/super-admin/accounts - Get all accounts
router.get('/accounts', (req, res) => superAdminController.getAllAccounts(req, res));

// GET /api/super-admin/stats - Get global statistics
router.get('/stats', (req, res) => superAdminController.getGlobalStats(req, res));

// PUT /api/super-admin/accounts/:accountId - Update account credentials
router.put('/accounts/:accountId', (req, res) => superAdminController.updateAccount(req, res));

// GET /api/super-admin/accounts/:accountId/services - Get services for specific account
router.get('/accounts/:accountId/services', (req, res) => superAdminController.getAccountServices(req, res));

// GET /api/super-admin/accounts/:accountId/bookings - Get bookings for specific account
router.get('/accounts/:accountId/bookings', (req, res) => superAdminController.getAccountBookings(req, res));

export default router;
