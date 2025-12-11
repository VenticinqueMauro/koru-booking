import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database.js';
import { koruService } from './koruService.js';
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
        let account = await prisma.account.findUnique({
            where: { websiteId: credentials.websiteId },
        });

        if (!account) {
            // Create new account on first login with data from Koru API
            account = await prisma.account.create({
                data: {
                    websiteId: credentials.websiteId,
                    appId: credentials.appId,
                    businessName: koruResponse.app.name, // Use app name as business name
                },
            });

            // Initialize default schedule for new account
            await this.initializeDefaultSchedule(account.id);

            // Initialize default widget settings with Koru config
            await this.initializeWidgetSettings(account.id, koruResponse.config);
        } else {
            // Update appId and business name if changed
            if (account.appId !== credentials.appId || account.businessName !== koruResponse.app.name) {
                account = await prisma.account.update({
                    where: { id: account.id },
                    data: {
                        appId: credentials.appId,
                        businessName: koruResponse.app.name,
                    },
                });
            }
        }

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

    private async initializeDefaultSchedule(accountId: string): Promise<void> {
        const defaultSchedule = [
            { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '17:00' }, // Sunday
            { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '17:00' },  // Monday
            { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '17:00' },  // Tuesday
            { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '17:00' },  // Wednesday
            { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '17:00' },  // Thursday
            { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '17:00' },  // Friday
            { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '17:00' }, // Saturday
        ];

        await prisma.schedule.createMany({
            data: defaultSchedule.map(s => ({ ...s, accountId })),
        });
    }

    private async initializeWidgetSettings(accountId: string, koruConfig: Record<string, any>): Promise<void> {
        // Extract widget settings from Koru config if available
        const accentColor = koruConfig.color || '#00C896';

        await prisma.widgetSettings.create({
            data: {
                accountId,
                layout: 'list',
                stepInterval: 30,
                accentColor,
                notifyEmail: 'admin@example.com', // TODO: Get from Koru config or prompt user
                timezone: 'America/Mexico_City',
            },
        });
    }
}

export const authService = new AuthService();
