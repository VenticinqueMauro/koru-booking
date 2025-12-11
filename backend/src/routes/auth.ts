import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';

const router = Router();

// POST /api/auth/login - Login with Koru credentials or email/password (legacy)
router.post('/login', (req, res) => authController.login(req, res));

// POST /api/auth/koru-login - Login with Koru username/password (Identity Broker)
router.post('/koru-login', (req, res) => authController.koruLogin(req, res));

// GET /api/auth/verify - Verify JWT token
router.get('/verify', (req, res) => authController.verify(req, res));

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => authController.logout(req, res));

export default router;
