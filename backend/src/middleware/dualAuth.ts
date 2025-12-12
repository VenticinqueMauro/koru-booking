import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { koruService } from '../services/koruService.js';
import { accountInitService } from '../services/accountInitService.js';
import { prisma } from '../utils/database.js';

export interface DualAuthRequest extends Request {
    accountId?: string;
    websiteId?: string;
    authType?: 'jwt' | 'koru';
}

/**
 * Dual authentication middleware
 * Accepts either JWT token (backoffice) or Koru credentials (widget)
 */
export const dualAuthMiddleware = async (
    req: DualAuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const websiteId = req.headers['x-koru-website-id'] as string;
        const appId = req.headers['x-koru-app-id'] as string;

        // Try JWT authentication first (backoffice)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = authService.verifyToken(token);

                req.accountId = decoded.accountId;
                req.websiteId = decoded.websiteId;
                req.authType = 'jwt';

                if (!req.accountId) {
                    console.error('JWT is valid but accountId is undefined');
                    res.status(401).json({ error: 'Invalid account credentials' });
                    return;
                }

                next();
                return;
            } catch (error) {
                // JWT failed, try Koru credentials
            }
        }

        // Try Koru credentials (widget)
        if (websiteId && appId) {
            // Verify credentials with Koru API
            const koruResponse = await koruService.verifyCredentials({ websiteId, appId });

            if (!koruResponse || !koruResponse.authorized) {
                res.status(401).json({ error: 'Invalid Koru credentials' });
                return;
            }

            // Find or create account automatically
            let account = await prisma.account.findUnique({
                where: { websiteId },
            });

            if (!account) {
                console.log(`🆕 Auto-creating Account for widget (websiteId: ${websiteId})`);

                // Auto-create account with data from Koru API response
                account = await accountInitService.createAndInitializeAccount(
                    websiteId,
                    appId,
                    {
                        businessName: koruResponse.app?.name,
                        email: koruResponse.website?.url,
                        config: koruResponse.config || {},
                    }
                );

                if (!account) {
                    res.status(500).json({ error: 'Failed to create account' });
                    return;
                }

                console.log(`✅ Account auto-created successfully: ${account.id}`);
            } else {
                // Verify appId matches
                if (account.appId !== appId) {
                    res.status(401).json({ error: 'Invalid app_id for this account' });
                    return;
                }
            }

            // TypeScript null check (should never happen after the above logic)
            if (!account) {
                res.status(500).json({ error: 'Failed to create or find account' });
                return;
            }

            req.accountId = account.id;
            req.websiteId = account.websiteId;
            req.authType = 'koru';

            next();
            return;
        }

        // No valid authentication found
        res.status(401).json({ error: 'Authentication required' });
    } catch (error) {
        console.error('Dual auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};
