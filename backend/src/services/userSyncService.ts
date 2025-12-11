/**
 * User Synchronization Service
 * Syncs Koru users with local database
 */

import { PrismaClient } from '@prisma/client';
import { extractKoruUserInfo, decodeJwtWithoutVerification } from '../utils/jwtDecoder.js';

const prisma = new PrismaClient();

export interface SyncedUser {
    user: {
        id: string;
        email: string;
        username: string | null;
        role: string;
        name: string | null;
        koruUserId: string | null;
        accountId: string | null;
    };
    account: {
        id: string;
        websiteId: string;
        appId: string;
        businessName: string | null;
    } | null;
}

export class UserSyncService {
    /**
     * Sync a Koru user to local database
     * Creates Account and User if they don't exist
     * Updates lastLoginAt on every login
     */
    async syncKoruUser(koruToken: string): Promise<SyncedUser | null> {
        try {
            // Extract user info from Koru JWT
            const userInfo = extractKoruUserInfo(koruToken);

            if (!userInfo.koruUserId) {
                console.error('Cannot sync user: koruUserId not found in token');
                return null;
            }

            // Decode full JWT to get additional info
            const decoded = decodeJwtWithoutVerification(koruToken);

            // Extract websiteId and appId (required for Account)
            const websiteId = userInfo.websiteId || decoded?.website_id || decoded?.websiteId;
            const appId = userInfo.appId || decoded?.app_id || decoded?.appId;

            if (!websiteId || !appId) {
                console.error('Cannot sync user: websiteId or appId not found in token');
                return null;
            }

            // Find or create Account
            let account = await prisma.account.findUnique({
                where: { websiteId },
            });

            if (!account) {
                // Create new account
                account = await prisma.account.create({
                    data: {
                        websiteId,
                        appId,
                        businessName: decoded?.businessName || null,
                        email: userInfo.email || null,
                        active: true,
                    },
                });

                console.log(`✅ Created new Account: ${account.id} (websiteId: ${websiteId})`);

                // Initialize default schedule for new account
                await this.createDefaultSchedule(account.id);

                // Initialize default widget settings
                await this.createDefaultWidgetSettings(account.id, userInfo.email || 'admin@example.com');
            }

            // Find or create User
            let user = await prisma.user.findUnique({
                where: { koruUserId: userInfo.koruUserId },
            });

            if (!user) {
                // Create new user linked to account
                user = await prisma.user.create({
                    data: {
                        email: userInfo.email || `${userInfo.username}@koru.user`,
                        username: userInfo.username,
                        koruUserId: userInfo.koruUserId,
                        name: decoded?.name || userInfo.username || null,
                        role: 'client', // Default role for Koru users
                        accountId: account.id,
                        passwordHash: null, // Koru users don't have local password
                        active: true,
                        lastLoginAt: new Date(),
                    },
                });

                console.log(`✅ Created new User: ${user.id} (koruUserId: ${userInfo.koruUserId})`);
            } else {
                // Update lastLoginAt and account link if changed
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                        accountId: account.id, // Update account link if it changed
                        username: userInfo.username || user.username,
                        email: userInfo.email || user.email,
                    },
                });

                console.log(`✅ Updated User login: ${user.id}`);
            }

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    koruUserId: user.koruUserId,
                    accountId: user.accountId,
                },
                account: {
                    id: account.id,
                    websiteId: account.websiteId,
                    appId: account.appId,
                    businessName: account.businessName,
                },
            };
        } catch (error) {
            console.error('Error syncing Koru user:', error);
            return null;
        }
    }

    /**
     * Create default schedule for new account (Mon-Fri 9am-6pm)
     */
    private async createDefaultSchedule(accountId: string): Promise<void> {
        const defaultSchedule = [
            { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '18:00' }, // Sunday
            { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '18:00' },  // Monday
            { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '18:00' },  // Tuesday
            { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '18:00' },  // Wednesday
            { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '18:00' },  // Thursday
            { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '18:00' },  // Friday
            { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '18:00' }, // Saturday
        ];

        await prisma.schedule.createMany({
            data: defaultSchedule.map((schedule) => ({
                ...schedule,
                accountId,
            })),
        });

        console.log(`✅ Created default schedule for Account: ${accountId}`);
    }

    /**
     * Create default widget settings for new account
     */
    private async createDefaultWidgetSettings(accountId: string, notifyEmail: string): Promise<void> {
        await prisma.widgetSettings.create({
            data: {
                accountId,
                layout: 'list',
                stepInterval: 30,
                accentColor: '#00C896',
                notifyEmail,
                timezone: 'America/Mexico_City',
            },
        });

        console.log(`✅ Created default widget settings for Account: ${accountId}`);
    }

    /**
     * Get user by Koru user ID
     */
    async getUserByKoruId(koruUserId: string) {
        return await prisma.user.findUnique({
            where: { koruUserId },
            include: {
                account: true,
            },
        });
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
            include: {
                account: true,
            },
        });
    }
}

export const userSyncService = new UserSyncService();
