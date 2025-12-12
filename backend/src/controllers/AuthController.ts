import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { superAdminService } from '../services/superAdminService.js';
import { koruService } from '../services/koruService.js';
import { userSyncService } from '../services/userSyncService.js';
import jwt from 'jsonwebtoken';

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
     * Koru user login with username/password (Identity Broker)
     * Uses Koru's /api/auth/login endpoint
     */
    async koruLogin(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Username and password are required'
                });
                return;
            }

            // Authenticate with Koru API
            const koruResponse = await koruService.loginUser({ username, password });

            if (!koruResponse || !koruResponse.access_token) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
                return;
            }

            // Sync user to local database with direct user info from Koru response
            const syncedUser = await userSyncService.syncKoruUser(
                koruResponse.access_token,
                koruResponse.user,
                username
            );

            if (!syncedUser) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to sync user. Please contact support.'
                });
                return;
            }

            // Generate our own JWT with user and account info
            const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
            const token = jwt.sign(
                {
                    userId: syncedUser.user.id,
                    accountId: syncedUser.account?.id,
                    websiteId: syncedUser.account?.websiteId,
                    role: syncedUser.user.role,
                    koruUserId: syncedUser.user.koruUserId,
                    koruToken: koruResponse.access_token, // Store Koru token for future validations
                    koruTokenExpiresAt: koruResponse.expires_at, // Store expiration from Koru
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: syncedUser.user.id,
                    email: syncedUser.user.email,
                    username: syncedUser.user.username,
                    name: syncedUser.user.name,
                    role: syncedUser.user.role,
                },
                account: syncedUser.account,
                koruTokenExpiresAt: koruResponse.expires_at, // Include Koru token expiration
                isSuperAdmin: false,
            });
        } catch (error) {
            console.error('Koru login error:', error);
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
