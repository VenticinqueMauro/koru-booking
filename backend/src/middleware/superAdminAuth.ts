import { Request, Response, NextFunction } from 'express';
import { superAdminService } from '../services/superAdminService.js';

export interface SuperAdminRequest extends Request {
    userId?: string;
    email?: string;
    role?: string;
}

/**
 * Middleware for admin authentication
 * Validates JWT token and ensures user has admin role (from Koru)
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

        // Check if user has admin role (from Koru) or legacy super_admin role
        if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        // Attach user info to request
        req.userId = decoded.userId;
        req.email = decoded.email;
        req.role = decoded.role;

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
