import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database.js';
import { koruService } from './koruService.js';
import { accountInitService } from './accountInitService.js';
import { KoruCredentials, AuthenticatedAccount } from '../types/auth.js';

export class AuthService {
    private jwtSecret: string;
    private jwtExpiresIn: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    }

    async login(credentials: KoruCredentials): Promise<{ token: string; account: AuthenticatedAccount }> {
        // 1. Verify with Koru API
        const koruResponse = await koruService.verifyCredentials(credentials);

        if (!koruResponse || !koruResponse.authorized) {
            throw new Error('Invalid Koru credentials');
        }

        // 2. Find or create account
        const account = await accountInitService.findOrCreateAccount(
            credentials.websiteId,
            credentials.appId,
            {
                businessName: koruResponse.app.name,
                config: koruResponse.config,
            }
        );

        // 3. Generate JWT token (our own token for backoffice sessions)
        const token = this.generateToken(account.id, credentials.websiteId);

        return {
            token,
            account: {
                id: account.id,
                websiteId: account.websiteId,
                appId: account.appId,
                businessName: account.businessName || undefined,
            },
        };
    }

    generateToken(accountId: string, websiteId: string): string {
        return jwt.sign(
            { accountId, websiteId },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
        );
    }

    verifyToken(token: string): { accountId: string; websiteId: string } {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as any;
            return {
                accountId: decoded.accountId,
                websiteId: decoded.websiteId,
            };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}

export const authService = new AuthService();
