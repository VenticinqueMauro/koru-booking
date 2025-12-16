import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/database.js';
import { koruService } from '../services/koruService.js';

export interface WidgetAuthRequest extends Request {
    accountId?: string;
    websiteId?: string;
    koruToken?: string; // Koru's JWT token for potential future use
}

/**
 * Middleware for widget authentication using Koru credentials
 * Validates website_id and app_id from headers
 */
export const widgetAuthMiddleware = async (
    req: WidgetAuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const websiteId = req.headers['x-koru-website-id'] as string;
        const appId = req.headers['x-koru-app-id'] as string;

        if (!websiteId || !appId) {
            res.status(401).json({ error: 'Koru credentials required' });
            return;
        }

        // Verify credentials with Koru API
        const koruResponse = await koruService.verifyCredentials({ websiteId, appId });

        if (!koruResponse || !koruResponse.authorized) {
            res.status(401).json({ error: 'Invalid Koru credentials' });
            return;
        }

        // Find account by websiteId
        const account = await prisma.account.findUnique({
            where: { websiteId },
        });

        if (!account) {
            res.status(404).json({
                error: 'Account not found. Please login to backoffice first to initialize your account.'
            });
            return;
        }

        // Verify appId matches
        if (account.appId !== appId) {
            res.status(401).json({ error: 'Invalid app_id for this account' });
            return;
        }

        // Attach account info to request
        req.accountId = account.id;
        req.websiteId = account.websiteId;
        req.koruToken = koruResponse.token; // Store Koru's JWT token if needed

        next();
    } catch (error) {
        console.error('Widget auth error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};
