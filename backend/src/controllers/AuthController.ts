import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { superAdminService } from '../services/superAdminService.js';

export class AuthController {
    /**
     * Login endpoint - supports both Koru and email/password authentication
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { websiteId, appId, email, password } = req.body;

            // Determine login type
            if (email && password) {
                // Super admin email/password login
                const result = await superAdminService.login({ email, password });
                res.json({
                    success: true,
                    token: result.token,
                    user: result.user,
                    isSuperAdmin: true,
                });
            } else if (websiteId && appId) {
                // Regular Koru authentication
                const result = await authService.login({ websiteId, appId });
                res.json({
                    success: true,
                    token: result.token,
                    account: result.account,
                    isSuperAdmin: false,
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Invalid login credentials. Provide either (email, password) or (websiteId, appId)'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            });
        }
    }

    /**
     * Verify token endpoint
     */
    async verify(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ valid: false, error: 'No token provided' });
                return;
            }

            const token = authHeader.substring(7);

            // Try to verify as regular JWT first
            try {
                const decoded = authService.verifyToken(token);
                res.json({
                    valid: true,
                    accountId: decoded.accountId,
                    websiteId: decoded.websiteId,
                    isSuperAdmin: false,
                });
                return;
            } catch {
                // Try super admin token
                const decoded = superAdminService.verifyToken(token);
                res.json({
                    valid: true,
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    isSuperAdmin: decoded.isSuperAdmin,
                });
            }
        } catch (error) {
            res.status(401).json({ valid: false, error: 'Invalid token' });
        }
    }

    /**
     * Logout endpoint (client-side token removal)
     */
    async logout(req: Request, res: Response): Promise<void> {
        // JWT is stateless, so logout is handled client-side
        // This endpoint exists for consistency and future enhancements
        res.json({ success: true, message: 'Logged out successfully' });
    }
}

export const authController = new AuthController();
