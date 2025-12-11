import { Request, Response, NextFunction } from 'express';
import { superAdminService } from '../services/superAdminService.js';

export interface SuperAdminRequest extends Request {
    userId?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

/**
 * Middleware for super admin authentication
 * Validates JWT token and ensures user has super_admin role
 */
export const superAdminMiddleware = async (
    req: SuperAdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No authorization token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const decoded = superAdminService.verifyToken(token);

        if (!decoded.isSuperAdmin) {
            res.status(403).json({ error: 'Super admin access required' });
            return;
        }

        // Attach user info to request
        req.userId = decoded.userId;
        req.email = decoded.email;
        req.role = decoded.role;
        req.isSuperAdmin = decoded.isSuperAdmin;

        next();
    } catch (error) {
        console.error('Super admin middleware error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
