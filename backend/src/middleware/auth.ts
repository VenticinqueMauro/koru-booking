import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';

export interface AuthRequest extends Request {
    accountId?: string;
    websiteId?: string;
}

/**
 * Middleware for JWT authentication (backoffice)
 * Validates JWT token from Authorization header
 */
export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No authorization token provided' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = authService.verifyToken(token);

        // Attach account info to request
        req.accountId = decoded.accountId;
        req.websiteId = decoded.websiteId;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
