import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';

const router = Router();

// POST /api/auth/login - Login with Koru credentials or email/password
router.post('/login', (req, res) => authController.login(req, res));

// GET /api/auth/verify - Verify JWT token
router.get('/verify', (req, res) => authController.verify(req, res));

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => authController.logout(req, res));

export default router;
